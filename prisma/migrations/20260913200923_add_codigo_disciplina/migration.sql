/*
  Warnings:

  - A unique constraint covering the columns `[codigo]` on the table `Disciplina` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `codigo` to the `Disciplina` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Disciplina" ADD COLUMN     "codigo" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Disciplina_codigo_key" ON "Disciplina"("codigo");
