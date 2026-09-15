import { z } from 'zod';

export const mensagemChatSchema = z
  .object({
    messages: z
      .string()
      .trim()
      .min(1, 'Mensagem não informada')
      .max(4000, 'A mensagem deve ter no máximo 4.000 caracteres'),
  })
  .strict();
