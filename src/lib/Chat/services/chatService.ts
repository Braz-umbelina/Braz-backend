import prisma from '../../prisma/prismaClient.js';
import { promptBraz } from '../../prompts/promptSystem.js';
import {
  AlunoNaoEncontradoError,
  AulaNaoEncontradaError,
  AulaPausadaError,
  RespostaVaziaError,
} from '../../errors.js';
import { getChat, setChat } from './chatCache.js';
import { deepSeek } from '../../IA-Models/client.js';
import { getAulaAberta } from '../../Aula/services/aulaService.js';

//-------- service

export const chatService = async (params: {
  messages: string;
  alunoId: string;
}) => {
  const aulaAberta = await getAulaAberta();
  if (!aulaAberta) {
    throw new AulaNaoEncontradaError('Aula não encontrada');
  }
  if (aulaAberta.pausada) {
    throw new AulaPausadaError(
      'A professora pausou o chat neste momento. Assim que ela liberar, você pode voltar a perguntar.',
    );
  }
  const aluno = await prisma.aluno.findUnique({
    where: { id: params.alunoId },
  });

  if (!aluno) {
    throw new AlunoNaoEncontradoError('Aluno não encontrado');
  }
  const primeiroNome = aluno.nome.split(' ')[0] ?? aluno.nome;

  const history = await getChat(aulaAberta.id, aluno.id);

  const response = await deepSeek.chat.completions.create({
    model: 'deepseek-flash',
    reasoning_effort: 'low',
    messages: [
      {
        role: 'system',
        content: promptBraz(
          aulaAberta.disciplina.nome,
          primeiroNome,
          aulaAberta.disciplina.professor.nome,
        ),
      },
      ...history.slice(-20).map((msg: { role: string; text: string }) => ({
        role: (msg.role === 'user' ? 'user' : 'assistant') as
          'user' | 'assistant',
        content: msg.text,
      })),
      { role: 'user', content: params.messages },
    ],
  });
  const texto = response.choices[0]?.message?.content;
  if (!texto) {
    throw new RespostaVaziaError(
      'O Braz não conseguiu responder. Tente enviar de novo.',
    );
  }
  await setChat(aulaAberta.id, aluno.id, 'user', params.messages);
  await setChat(aulaAberta.id, aluno.id, 'model', texto);

  return texto;
};

export const getChatAberto = async (alunoId: string) => {
  const aulaAberta = await getAulaAberta();
  if (!aulaAberta) {
    throw new AulaNaoEncontradaError('Aula não encontrada');
  }
  const chatAberto = await getChat(aulaAberta.id, alunoId);
  return chatAberto;
};
