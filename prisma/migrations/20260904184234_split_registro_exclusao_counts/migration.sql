/*
  Warnings:

  - You are about to drop the column `quantidade` on the `RegistroExclusao` table. All the data in the column will be lost.
  - Added the required column `alunosExcluidos` to the `RegistroExclusao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `aulasExcluidas` to the `RegistroExclusao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `relatoriosExcluidos` to the `RegistroExclusao` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RegistroExclusao" DROP COLUMN "quantidade",
ADD COLUMN     "alunosExcluidos" INTEGER NOT NULL,
ADD COLUMN     "aulasExcluidas" INTEGER NOT NULL,
ADD COLUMN     "relatoriosExcluidos" INTEGER NOT NULL;
