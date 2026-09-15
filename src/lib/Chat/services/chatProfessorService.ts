import prisma from '../../prisma/prismaClient.js';
import { promptProfessor } from '../../prompts/promptSystem.js';
import {
  ProfessorNaoEncontradoError,
  RespostaVaziaError,
} from '../../errors.js';
import { setProfessorChat, getProfessorChat } from './professorCacheService.js';
import { deepSeek } from '../../IA-Models/client.js';

//-------- service

export const chatService = async (params: {
  messages: string;
  professorId: string;
}) => {
  const professor = await prisma.professor.findUnique({
    where: { id: params.professorId },
    select: {
      id: true,
      nome: true,
      disciplinas: {
        select: { nome: true },
      },
    },
  });

  if (!professor) {
    throw new ProfessorNaoEncontradoError('Professor não encontrado');
  }

  const history = await getProfessorChat(professor.id);

  const response = await deepSeek.chat.completions.create({
    model: 'deepseek-flash',
    reasoning_effort: 'low',
    messages: [
      {
        role: 'system',
        content: promptProfessor(
          professor.nome,
          professor.disciplinas.map((disciplina) => disciplina.nome),
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
  await setProfessorChat(professor.id, 'user', params.messages);
  await setProfessorChat(professor.id, 'assistant', texto);

  return texto;
};

export const getChatProfessor = async (professorId: string) => {
  const chatAberto = await getProfessorChat(professorId);
  return chatAberto;
};
