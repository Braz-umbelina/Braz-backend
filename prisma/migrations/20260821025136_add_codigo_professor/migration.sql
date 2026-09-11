/*
  Warnings:

  - A unique constraint covering the columns `[codigo]` on the table `Professor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `codigo` to the `Professor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Professor" ADD COLUMN     "codigo" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Professor_codigo_key" ON "Professor"("codigo");
