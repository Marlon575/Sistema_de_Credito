-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('ADMIN', 'GERENTE', 'FUNCIONARIO', 'CLIENTE');

-- CreateEnum
CREATE TYPE "StatusEmprestimo" AS ENUM ('PENDENTE', 'EM_ANALISE', 'APROVADO', 'REJEITADO', 'ATIVO', 'QUITADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "perfil" "Perfil" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "bi" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "rendimentoMensal" DOUBLE PRECISION,
    "tipoEmprego" TEXT,
    "emprego" TEXT,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_emprestimo" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "taxaMensal" DOUBLE PRECISION NOT NULL,
    "taxaNominal" DOUBLE PRECISION NOT NULL,
    "prazoMin" INTEGER NOT NULL,
    "prazoMax" INTEGER NOT NULL,
    "valorMin" DOUBLE PRECISION NOT NULL,
    "valorMax" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "tipos_emprestimo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emprestimos" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "tipoId" INTEGER NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "prazo" INTEGER NOT NULL,
    "taxaMensal" DOUBLE PRECISION NOT NULL,
    "taxaNominal" DOUBLE PRECISION NOT NULL,
    "valorParcela" DOUBLE PRECISION NOT NULL,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "totalJuros" DOUBLE PRECISION NOT NULL,
    "status" "StatusEmprestimo" NOT NULL DEFAULT 'PENDENTE',
    "motivoRejeicao" TEXT,
    "observacoesFuncionario" TEXT,
    "funcionarioId" INTEGER,
    "funcionarioNome" TEXT,
    "gerenteId" INTEGER,
    "gerenteNome" TEXT,
    "parcelasPagas" INTEGER NOT NULL DEFAULT 0,
    "dataPedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,
    "dataDecisao" TIMESTAMP(3),

    CONSTRAINT "emprestimos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" SERIAL NOT NULL,
    "emprestimoId" INTEGER NOT NULL,
    "valorPago" DOUBLE PRECISION NOT NULL,
    "numeroParcela" INTEGER NOT NULL,
    "dataPagamento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registadoPor" TEXT NOT NULL,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" SERIAL NOT NULL,
    "emprestimoId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "nomeOriginal" TEXT NOT NULL,
    "caminho" TEXT NOT NULL,
    "dataUpload" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_emprestimos" (
    "id" SERIAL NOT NULL,
    "emprestimoId" INTEGER NOT NULL,
    "acao" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_emprestimos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "emprestimoId" INTEGER,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "criado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- AddForeignKey
ALTER TABLE "emprestimos" ADD CONSTRAINT "emprestimos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emprestimos" ADD CONSTRAINT "emprestimos_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES "tipos_emprestimo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_emprestimoId_fkey" FOREIGN KEY ("emprestimoId") REFERENCES "emprestimos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_emprestimoId_fkey" FOREIGN KEY ("emprestimoId") REFERENCES "emprestimos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_emprestimos" ADD CONSTRAINT "historico_emprestimos_emprestimoId_fkey" FOREIGN KEY ("emprestimoId") REFERENCES "emprestimos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_emprestimoId_fkey" FOREIGN KEY ("emprestimoId") REFERENCES "emprestimos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
