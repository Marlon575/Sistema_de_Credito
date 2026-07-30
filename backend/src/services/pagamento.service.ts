import { prisma } from "../config/database"; // ligação à base de dados
import type { RegistarPagamentoInput } from "../validators/pagamento.validator"; // tipos de entrada

/**
 * Regista o pagamento de uma prestação de um empréstimo.
 * Actualiza também o contador de parcelas pagas no empréstimo,
 * e, se todas as parcelas tiverem sido pagas, muda o status
 * do empréstimo para QUITADO.
 */
export async function registarPagamento(
  dados: RegistarPagamentoInput,
  registadoPor: string
) {
  const emprestimo = await prisma.emprestimo.findUnique({ where: { id: dados.emprestimoId } });

  if (!emprestimo) {
    throw new Error("Pedido de empréstimo não encontrado.");
  }

  if (emprestimo.status !== "ATIVO" && emprestimo.status !== "APROVADO") {
    throw new Error("Só é possível registar pagamentos em empréstimos activos ou aprovados.");
  }

  // confirma que esta parcela específica ainda não foi paga (evita duplicados)
  const pagamentoExistente = await prisma.pagamento.findFirst({
    where: { emprestimoId: dados.emprestimoId, numeroParcela: dados.numeroParcela },
  });

  if (pagamentoExistente) {
    throw new Error(`A parcela número ${dados.numeroParcela} já foi paga anteriormente.`);
  }

  // usamos uma transacção porque envolve 3 operações relacionadas:
  // criar o pagamento, actualizar o empréstimo, e criar o registo de histórico
  const novoPagamento = await prisma.$transaction(async (tx) => {
    const pagamento = await tx.pagamento.create({
      data: {
        emprestimoId: dados.emprestimoId,
        valorPago: dados.valorPago,
        numeroParcela: dados.numeroParcela,
        registadoPor,
      },
    });

    const novasParcelasPagas = emprestimo.parcelasPagas + 1;
    const quitado = novasParcelasPagas >= emprestimo.prazo; // se pagou todas as prestações previstas

    await tx.emprestimo.update({
      where: { id: dados.emprestimoId },
      data: {
        parcelasPagas: novasParcelasPagas,
        status: quitado ? "QUITADO" : "ATIVO", // muda para ATIVO na primeira prestação, ou QUITADO se for a última
      },
    });

    await tx.historicoEmprestimo.create({
      data: {
        emprestimoId: dados.emprestimoId,
        acao: quitado
          ? `Pagamento da parcela ${dados.numeroParcela} registado — empréstimo quitado`
          : `Pagamento da parcela ${dados.numeroParcela} registado`,
        autor: registadoPor,
      },
    });

    return pagamento;
  });

  return novoPagamento;
}

/**
 * Lista todos os pagamentos de um empréstimo, ordenados por número
 * de parcela (1ª, 2ª, 3ª...).
 */
export async function listarPagamentos(emprestimoId: number) {
  return prisma.pagamento.findMany({
    where: { emprestimoId },
    orderBy: { numeroParcela: "asc" },
  });
}