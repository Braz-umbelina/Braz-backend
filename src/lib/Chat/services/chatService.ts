import prisma from '../../prisma/prismaClient.js';
import { promptBraz, promptProfessor } from '../../prompts/promptSystem.js';
import {
  AlunoNaoEncontradoError,
  AulaNaoEncontradaError,
  AulaPausadaError,
  RespostaVaziaError,
  ProfessorNaoEncontradoError,
} from '../../errors.js';
import { getChat, setChat } from './chatCache.js';
import { setProfessorChat, getProfessorChat } from './chatCacheProfessor.js';
import { deepSeek } from '../../IA-Models/client.js';
import { getAulaAberta } from '../../Aula/services/aulaService.js';

//-------- service aluno

export const chatServiceAluno = async (params: {
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

//-------- service professor

export const chatServiceProfessor = async (params: {
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
