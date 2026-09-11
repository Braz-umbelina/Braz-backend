import prisma from '../../prisma/prismaClient.js';
import { promptRelatorio } from '../../prompts/promptSystem.js';
import {
  AlunoNaoEncontradoError,
  AulaNaoEncontradaError,
  HistoricoNaoEncontradoError,
  RelatorioNaoEncontradoError,
  RelatorioInvalidoError,
} from '../../errors.js';
import { getChat, deleteChat, hasChat } from '../../Chat/services/chatCache.js';
import { deepSeek } from '../../IA-Models/client.js';
import { relatorioSchema } from '../schemas/relatorioSchema.js';
import logger from '../../logger.js';

//------------ services

export const relatorioService = async (aulaId: string, alunoId: string) => {
  const aula = await prisma.aula.findUnique({
    where: { id: aulaId },
    include: { disciplina: true },
  });

  if (!aula) {
    throw new AulaNaoEncontradaError('Aula nao encontrada');
  }

  const aluno = await prisma.aluno.findUnique({
    where: { id: alunoId },
  });

  if (!aluno) {
    throw new AlunoNaoEncontradoError('Aluno não encontrado');
  }

  const history = await getChat(aulaId, alunoId);
  if (history.length === 0) {
    throw new HistoricoNaoEncontradoError('Nenhuma conversa encontrada');
  } // arrive early to avoid calling the LLM unnecessarily
  const transcricao = history
    .map(
      (msg: { role: string; text: string }) =>
        `${msg.role === 'user' ? 'Aluno' : 'Braz'}: ${msg.text}`,
    )
    .join('\n');

  const inicio = Date.now();
  const response = await deepSeek.chat.completions.create({
    model: 'deepseek-flash',
    response_format: { type: 'json_object' },
    /* Thinking about it. in this model, reasoning tokens count towards the max_tokens limit, so a lengthy deliberation consumes the entire budget before the response is even written, resulting in an empty output. */
    // @ts-expect-error field accepted only by DeepSeek; it does not exist in the OpenAI types
    thinking: { type: 'disabled' },
    /* without a ceiling the model can be cut mid object and the JSON.parse below
    throws on a string that is valid until the truncation point. */
    max_tokens: 1500,
    messages: [
      {
        role: 'system',
        content: promptRelatorio(aula.disciplina.nome, aluno.nome),
      },
      {
        role: 'user',
        content: `<conversa>\n${transcricao}\n</conversa>`,
      },
    ],
  });
  logger.info(`DeepSeek: ${Date.now() - inicio}ms para ${aluno.nome}`);

  const texto = response.choices[0]?.message?.content;
  if (!texto) {
    throw new RelatorioNaoEncontradoError('Relatório não gerado');
  }
  let relatorio: unknown;
  try {
    relatorio = JSON.parse(texto);
  } catch {
    throw new RelatorioInvalidoError('Relatório não gerado');
  }

  const validRelatorio = relatorioSchema.safeParse(relatorio);
  if (!validRelatorio.success) {
    throw new RelatorioInvalidoError('Relatório não gerado');
  }

  const createRelatorio = await prisma.relatorio.upsert({
    where: { aulaId_alunoId: { aulaId, alunoId } },
    update: {
      ...validRelatorio.data,
    },
    create: {
      ...validRelatorio.data,
      aulaId,
      alunoId,
    },
  });

  /* delete the chat key from Redis only after saving the report to Postgres, preventing the conversation history from being erased—and the report for that class from being lost—in the event of a database save error.*/
  await deleteChat(aulaId, alunoId);

  return createRelatorio;
};

export const gerarRelatoriosPendentes = async (aulaId: string) => {
  const alunos = await prisma.aluno.findMany();
  /*variables to store the number of generated reports and
  the number of errors encountered during generation*/
  let gerados = 0;
  let falhas = 0;

  for (const aluno of alunos) {
    const temConversa = await hasChat(aulaId, aluno.id); //check which students talked during class
    if (!temConversa) {
      continue;
    }
    try {
      await relatorioService(aulaId, aluno.id);
      gerados++;
    } catch (error) {
      logger.error(error, `Falha ao gerar relatório de ${aluno.nome}`);
      falhas++;
    }
  }
  /* always written, not only when something failed, a successful retry has to clear
  the mark, otherwise the icon would stay on a class that is already complete. */
  await prisma.aula.update({
    where: { id: aulaId },
    data: { pendentes: falhas },
  });

  return { gerados, falhas };
};

export const getRelatorios = async (aulaId: string) => {
  const relatorios = await prisma.relatorio.findMany({
    where: { aulaId },
    select: {
      id: true,
      temas: true,
      aluno: { select: { nome: true } },
      esclarecida: true,
      observacoes: true,
    },
    orderBy: {
      aluno: {
        nome: 'asc',
      },
    },
  });
  return relatorios;
};
