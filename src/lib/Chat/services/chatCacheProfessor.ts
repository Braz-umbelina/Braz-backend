import client from '../../redis/client.js';

const TTL = 5 * 24 * 60 * 60;

const generateKey = (professorId: string) => `chat:professor:${professorId}`;

export const setProfessorChat = async (
  professorId: string,
  role: 'user' | 'assistant',
  text: string,
) => {
  const key = generateKey(professorId);
  const turn = JSON.stringify({ role, text });

  const length = await client.rPush(key, turn);
  await client.lTrim(key, -100, -1);
  if (length === 1) {
    await client.expire(key, TTL);
  }
  return length;
};

export const getProfessorChat = async (professorId: string) => {
  const key = generateKey(professorId);
  const turns = await client.lRange(key, 0, -1); // returns the list of turns in the chat
  return turns.map((turn) => JSON.parse(turn));
};
