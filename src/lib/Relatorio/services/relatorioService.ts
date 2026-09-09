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
import { genAI } from '../../Gemini/client.js';
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
  const response = await genAI.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    config: {
      systemInstruction: promptRelatorio(aula.disciplina.nome, aluno.nome),
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          temas: { type: 'ARRAY', items: { type: 'STRING' } },
          esclarecida: { type: 'STRING', enum: ['SIM', 'PARCIAL', 'NAO'] },
          observacoes: { type: 'STRING' },
        },
        required: ['temas', 'esclarecida', 'observacoes'],
      },
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: `<conversa>\n${transcricao}\n</conversa>` }],
      },
    ],
  });
  logger.info(`Gemini: ${Date.now() - inicio}ms para ${aluno.nome}`);
  if (!response.text) {
    throw new RelatorioNaoEncontradoError('Relatório não gerado');
  }
  const relatorio = JSON.parse(response.text);
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
