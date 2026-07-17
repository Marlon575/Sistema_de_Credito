-- CreateTable
CREATE TABLE "historico_tipos_emprestimo" (
    "id" SERIAL NOT NULL,
    "tipoEmprestimoId" INTEGER NOT NULL,
    "adminId" INTEGER NOT NULL,
    "adminNome" TEXT NOT NULL,
    "campoAlterado" TEXT NOT NULL,
    "valorAnterior" TEXT NOT NULL,
    "valorNovo" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_tipos_emprestimo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "historico_tipos_emprestimo" ADD CONSTRAINT "historico_tipos_emprestimo_tipoEmprestimoId_fkey" FOREIGN KEY ("tipoEmprestimoId") REFERENCES "tipos_emprestimo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
