import { createClient } from 'redis';
import logger from '../logger.js';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const client = createClient({
  url: redisUrl,
  pingInterval: 30000,
  socket: {
    keepAlive: true,
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
  },
});
client.on('error', (error) => {
  logger.error(error, 'Redis error:');
});

client.on('ready', () => {
  logger.info('Redis pronto');
});

client.on('reconnecting', () => {
  logger.warn('Redis reconectando');
});

client.on('end', () => {
  logger.warn('Conexão Redis encerrada');
});

await client.connect();

export default client;
