/*
  Warnings:

  - You are about to drop the `Resumo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Resumo" DROP CONSTRAINT "Resumo_alunoId_fkey";

-- DropForeignKey
ALTER TABLE "Resumo" DROP CONSTRAINT "Resumo_aulaId_fkey";

-- DropTable
DROP TABLE "Resumo";

-- CreateTable
CREATE TABLE "Relatorio" (
    "id" TEXT NOT NULL,
    "temas" TEXT[],
    "esclarecida" "Esclarecidas" NOT NULL,
    "observacoes" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aulaId" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,

    CONSTRAINT "Relatorio_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Relatorio" ADD CONSTRAINT "Relatorio_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "Aula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relatorio" ADD CONSTRAINT "Relatorio_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
