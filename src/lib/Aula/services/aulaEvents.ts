import type { Response } from 'express';

const clientes = new Set<Response>();

export const conectarEventosAula = (res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.flushHeaders();

  clientes.add(res);
  res.write('event: aula-atualizada\ndata: {}\n\n');
  const heartbeat = setInterval(() => {
    res.write(': ping\n\n');
  }, 25000);

  res.on('close', () => {
    clearInterval(heartbeat);
    clientes.delete(res);
  });
};

export const notificarAtualizacaoAula = () => {
  for (const cliente of clientes) {
    cliente.write('event: aula-atualizada\ndata: {}\n\n');
  }
};
