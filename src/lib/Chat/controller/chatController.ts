import { type Request, type Response } from 'express';
import { chatService, getChatAberto } from '../services/chatService.js';
import logger from '../../logger.js';
import {
  AlunoNaoEncontradoError,
  AulaNaoEncontradaError,
  AulaPausadaError,
} from '../../errors.js';
import { ApiError } from '@google/genai';

//--------------- controller

export const storeChat = async (req: Request, res: Response) => {
  try {
    //logger.info('POST /chat chegou ao controller');
    const alunoId = req.aluno?.id;
    if (!alunoId) {
      return res.status(404).json('Id do aluno não fornecido');
    }
    const { messages } = req.body;
    if (!messages) {
      return res.status(400).json({ error: 'Mensagens não fornecidas' });
    }
    const result = await chatService({ messages, alunoId });
    return res.status(200).json(result);
  } catch (error) {
    logger.error(error);
    if (error instanceof ApiError && error.status === 503) {
      return res.status(503).json({
        error:
          'O Braz está sobrecarregado neste momento. Tente de novo em instantes.',
      });
    }
    if (error instanceof ApiError && error.status === 429) {
      return res.status(429).json({
        error:
          'Muitos alunos perguntando ao mesmo tempo. Tente de novo em alguns segundos.',
      });
    }
    if (error instanceof AulaPausadaError) {
      return res.status(403).json({ error: error.message });
    }
    if (error instanceof AulaNaoEncontradaError) {
      return res.status(404).json({ error: error.message });
    }
    if (error instanceof AlunoNaoEncontradoError) {
      return res.status(404).json({ error: error.message });
    }
  }
  return res.status(500).json({ error: 'Erro ao processar a solicitação' });
};

export const indexChat = async (req: Request, res: Response) => {
  try {
    const alunoId = req.aluno?.id;
    if (!alunoId) {
      return res.status(404).json('Id do aluno não fornecido');
    }
    const result = await getChatAberto(alunoId);
    return res.status(200).json(result);
  } catch (error) {
    logger.error(error);
    if (error instanceof AulaNaoEncontradaError) {
      return res.status(404).json({ error: error.message });
    }
  }
  return res.status(500).json({ error: 'Erro ao processar a solicitação' });
};
