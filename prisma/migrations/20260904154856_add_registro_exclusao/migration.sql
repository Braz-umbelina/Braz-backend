-- CreateEnum
CREATE TYPE "TipoExclusao" AS ENUM ('INDIVIDUAL', 'ANUAL');

-- CreateTable
CREATE TABLE "RegistroExclusao" (
    "id" TEXT NOT NULL,
    "tipo" "TipoExclusao" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "executadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistroExclusao_pkey" PRIMARY KEY ("id")
);
