/*
  Warnings:

  - A unique constraint covering the columns `[aulaId,alunoId]` on the table `Relatorio` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Relatorio_aulaId_alunoId_key" ON "Relatorio"("aulaId", "alunoId");
