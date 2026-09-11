/*
  Warnings:

  - Added the required column `esclarecida` to the `Resumo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `observacoes` to the `Resumo` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Esclarecidas" AS ENUM ('SIM', 'PARCIAL', 'NAO');

-- AlterTable
ALTER TABLE "Resumo" ADD COLUMN     "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "esclarecida" "Esclarecidas" NOT NULL,
ADD COLUMN     "observacoes" TEXT NOT NULL,
ADD COLUMN     "temas" TEXT[];
