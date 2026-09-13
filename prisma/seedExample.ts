//All data in this file is fictitious and used for illustrative purposes only.

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import logger from '../src/lib/logger.js';
import { z } from 'zod';

const prisma = new PrismaClient();

// zod schemas

const chaveSchema = z.object({
  CHAVE_A: z.string(),
  CHAVE_B: z.string(),
  CHAVE_C: z.string(),
  CHAVE_D: z.string(),
  CHAVE_E: z.string(),
});

const alunoSchema = z.object({
  nome: z.string().min(3),
  email: z.string().email(),
  senha: z.string().min(6),
});

// Seed the professores
async function seedProfessors() {
  try {
    const chaves = chaveSchema.parse(process.env);
    const professorDates = [
      { codigo: 100, nome: 'A', chave: chaves.CHAVE_A },
      { codigo: 103, nome: 'B', chave: chaves.CHAVE_B },
      { codigo: 140, nome: 'C', chave: chaves.CHAVE_C },
      { codigo: 139, nome: 'D', chave: chaves.CHAVE_D },
      { codigo: 159, nome: 'E', chave: chaves.CHAVE_E },
    ];

    // loop through the professorDates array and upsert each professor into the database
    for (const professor of professorDates) {
      const chaveHash = await bcrypt.hash(professor.chave, 10);
      await prisma.professor.upsert({
        where: { codigo: professor.codigo },
        update: { chave: chaveHash },
        create: {
          codigo: professor.codigo,
          nome: professor.nome,
          chave: chaveHash,
        },
      });
    }
    return logger.info('Professores criados/atualizados com sucesso.');
  } catch (error) {
    logger.error(error, 'Erro ao criar/atualizar professor.');
  }
}

// Seed the disciplinas
async function seedDisciplinas() {
  try {
    const disciplinaDates = [
      { codigo: 203, nome: 'Língua Portuguesa', professor: 'Meires' },
      {
        codigo: 202,
        nome: 'Estudo Orientado de Português',
        professor: 'Meires',
      },
      { codigo: 201, nome: 'Letramento Digital', professor: 'Meires' },

      { codigo: 200, nome: 'Ciências', professor: 'Ariane' },
      { codigo: 119, nome: 'Geografia', professor: 'Ariane' },

      { codigo: 118, nome: 'Matemática', professor: 'Weslane' },
      { codigo: 117, nome: 'Inglês', professor: 'Weslane' },
      {
        codigo: 116,
        nome: 'Estudo Orientado de Matemática',
        professor: 'Weslane',
      },
      { codigo: 115, nome: 'Pensamento Computacional', professor: 'Weslane' },

      { codigo: 114, nome: 'Artes', professor: 'Lucianne' },
      { codigo: 113, nome: 'Educação Física', professor: 'Lucianne' },

      { codigo: 112, nome: 'História', professor: 'Helita' },
      {
        codigo: 111,
        nome: 'Eletiva: Educação Financeira',
        professor: 'Helita',
      },
    ];

    for (const disciplina of disciplinaDates) {
      await prisma.disciplina.upsert({
        where: { codigo: disciplina.codigo },
        update: {
          nome: disciplina.nome,
          professor: { connect: { nome: disciplina.professor } },
        },
        create: {
          codigo: disciplina.codigo,
          nome: disciplina.nome,
          professor: { connect: { nome: disciplina.professor } },
        },
      });
    }
    return logger.info('Disciplinas criadas/atualizadas com sucesso.');
  } catch (error) {
    logger.error(error, 'Erro ao criar/atualizar disciplina.');
  }
}

async function seedAluno() {
  try {
    const { nome, email, senha } = alunoSchema.parse({
      nome: process.env.ALUNO_NAME,
      email: process.env.ALUNO_EMAIL,
      senha: process.env.ALUNO_PASSWORD,
    });
    logger.info('Dados validados pelo esquema do zod:');
    const passwordHash = await bcrypt.hash(senha, 10);

    const aluno = await prisma.aluno.upsert({
      where: { email },
      update: { nome, senha: passwordHash, verificado: true },
      create: {
        nome,
        email,
        senha: passwordHash,
        verificado: true,
      },
    });
    logger.info(
      `Usuario criado/atualizado com sucesso: ${aluno.nome} (${aluno.email})`,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Erro de validacao do zod:');
    } else {
      logger.error('Erro ao criar o usuario:');
    }
  } finally {
    await prisma.$disconnect();
  }
}

await seedProfessors();
await seedDisciplinas();
await seedAluno();
