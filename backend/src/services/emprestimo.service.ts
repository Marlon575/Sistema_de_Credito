import { prisma } from "../config/database"; // ligação à base de dados
import type { AtualizarTipoEmprestimoInput } from "../validators/emprestimo.validator"; // tipos de entrada

// -------------------------------------------------------------
// TIPOS DE CRÉDITO — consulta e gestão (Admin)
// -------------------------------------------------------------

/**
 * Lista todos os tipos de crédito disponíveis (Consumo, Investimento, etc.).
 * Usado pelo simulador (público) e pelo painel do admin.
 */
export async function listarTiposEmprestimo() {
  return prisma.tipoEmprestimo.findMany({
    orderBy: { id: "asc" }, // mantém sempre a mesma ordem (Consumo, Investimento, Funcionário)
  });
}

/**
 * Busca um único tipo de crédito pelo seu id.
 * Lança erro se não existir.
 */
export async function buscarTipoEmprestimo(id: number) {
  const tipo = await prisma.tipoEmprestimo.findUnique({ where: { id } });

  if (!tipo) {
    throw new Error("Tipo de empréstimo não encontrado.");
  }

  return tipo;
}

/**
 * ADMIN — actualiza taxas, prazos ou valores de um tipo de crédito.
 * Regista automaticamente cada campo alterado no histórico, para
 * sabermos sempre quem alterou o quê e quando.
 *
 * @param id - id do tipo de crédito a alterar
 * @param dados - campos a actualizar (só os que vierem preenchidos)
 * @param adminId - id do admin que está a fazer a alteração
 * @param adminNome - nome do admin (guardado no histórico)
 */
export async function atualizarTipoEmprestimo(
  id: number,
  dados: AtualizarTipoEmprestimoInput,
  adminId: number,
  adminNome: string
) {
  // 1. Busca o tipo actual, para comparar valores antigos com novos
  const tipoAtual = await buscarTipoEmprestimo(id); // lança erro se não existir

  // 2. Regra de negócio: se só um dos dois lados do intervalo vier
  // (ex: só prazoMax, sem prazoMin), validamos contra o valor já guardado
  const novoPrazoMin = dados.prazoMin ?? tipoAtual.prazoMin;
  const novoPrazoMax = dados.prazoMax ?? tipoAtual.prazoMax;
  if (novoPrazoMin > novoPrazoMax) {
    throw new Error("O prazo mínimo não pode ser maior que o prazo máximo.");
  }

  const novoValorMin = dados.valorMin ?? tipoAtual.valorMin;
  const novoValorMax = dados.valorMax ?? tipoAtual.valorMax;
  if (novoValorMin > novoValorMax) {
    throw new Error("O valor mínimo não pode ser maior que o valor máximo.");
  }

  // 3. Descobre quais campos realmente mudaram, para registar no histórico
  // (assim não criamos entradas de histórico "vazias" para campos que não mudaram)
  const registosHistorico: {
    tipoEmprestimoId: number;
    adminId: number;
    adminNome: string;
    campoAlterado: string;
    valorAnterior: string;
    valorNovo: string;
  }[] = [];

  const camposParaComparar = [
    "taxaMensal",
    "taxaNominal",
    "prazoMin",
    "prazoMax",
    "valorMin",
    "valorMax",
  ] as const;

  for (const campo of camposParaComparar) {
    const valorNovo = dados[campo];
    if (valorNovo !== undefined && valorNovo !== tipoAtual[campo]) {
      registosHistorico.push({
        tipoEmprestimoId: id,
        adminId,
        adminNome,
        campoAlterado: campo,
        valorAnterior: String(tipoAtual[campo]), // convertido para texto (histórico guarda tudo como string)
        valorNovo: String(valorNovo),
      });
    }
  }

  // 4. Actualiza o tipo de crédito e cria os registos de histórico,
  // tudo numa única transacção — ou tudo funciona, ou nada é gravado
  // (evita ficarmos com dados a meio, se algo falhar no meio do processo)
  const [tipoAtualizado] = await prisma.$transaction([
    prisma.tipoEmprestimo.update({
      where: { id },
      data: dados,
    }),
    ...registosHistorico.map((registo) =>
      prisma.historicoTipoEmprestimo.create({ data: registo })
    ),
  ]);

  return tipoAtualizado;
}

/**
 * ADMIN — lista o histórico de alterações de um tipo de crédito.
 * Mostra quem alterou, o quê, e quando.
 */
export async function listarHistoricoTipoEmprestimo(tipoEmprestimoId: number) {
  return prisma.historicoTipoEmprestimo.findMany({
    where: { tipoEmprestimoId },
    orderBy: { data: "desc" }, // mais recente primeiro
  });
}

// -------------------------------------------------------------
// CÁLCULO FINANCEIRO — método Price/Francês
// -------------------------------------------------------------

// o que devolvemos ao simular um empréstimo
export interface ResultadoSimulacao {
  valorParcela: number; // valor de cada prestação mensal
  valorTotal: number; // valor total a pagar no fim
  totalJuros: number; // total de juros pagos
  tabelaAmortizacao: {
    numeroParcela: number;
    saldoDevedorInicial: number;
    juros: number;
    amortizacao: number; // parte da prestação que reduz a dívida
    valorParcela: number;
    saldoDevedorFinal: number;
  }[];
}

/**
 * Calcula uma simulação de empréstimo pelo método Price/Francês
 * (prestações fixas, com juros decrescentes e amortização crescente).
 *
 * @param valor - valor pedido, em MT
 * @param prazo - prazo em meses
 * @param taxaMensal - taxa de juro mensal, em percentagem (ex: 1.667 para 1.667%)
 */
export function calcularSimulacao(
  valor: number,
  prazo: number,
  taxaMensal: number
): ResultadoSimulacao {
  const i = taxaMensal / 100; // converte percentagem para decimal (ex: 1.667% → 0.01667)

  // fórmula do método Price: PMT = PV * [i * (1+i)^n] / [(1+i)^n - 1]
  const fator = Math.pow(1 + i, prazo);
  const valorParcela = (valor * i * fator) / (fator - 1);

  // gera a tabela de amortização, mês a mês
  const tabelaAmortizacao: ResultadoSimulacao["tabelaAmortizacao"] = [];
  let saldoDevedor = valor;

  for (let mes = 1; mes <= prazo; mes++) {
    const juros = saldoDevedor * i; // juros deste mês, sobre o saldo actual
    const amortizacao = valorParcela - juros; // parte que efectivamente reduz a dívida
    const saldoDevedorFinal = saldoDevedor - amortizacao;

    tabelaAmortizacao.push({
      numeroParcela: mes,
      saldoDevedorInicial: arredondar(saldoDevedor),
      juros: arredondar(juros),
      amortizacao: arredondar(amortizacao),
      valorParcela: arredondar(valorParcela),
      saldoDevedorFinal: arredondar(Math.max(0, saldoDevedorFinal)), // evita -0.01 por arredondamentos
    });

    saldoDevedor = saldoDevedorFinal;
  }

  const valorTotal = valorParcela * prazo;
  const totalJuros = valorTotal - valor;

  return {
    valorParcela: arredondar(valorParcela),
    valorTotal: arredondar(valorTotal),
    totalJuros: arredondar(totalJuros),
    tabelaAmortizacao,
  };
}

/**
 * Arredonda um valor para 2 casas decimais (padrão monetário).
 */
function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}




// -------------------------------------------------------------
// PEDIDOS DE EMPRÉSTIMO — ciclo de vida completo
// -------------------------------------------------------------

/**
 * CLIENTE — cria um novo pedido de empréstimo.
 * Valida se o valor e o prazo estão dentro dos limites definidos
 * pelo admin para o tipo de crédito escolhido, calcula a simulação
 * financeira, e grava o pedido com status PENDENTE.
 */

export async function criarEmprestimo(
  clienteId: number,
  tipoId: number,
  valor: number,
  prazo: number
) {
  // 1. Busca o tipo de crédito escolhido (lança erro se não existir)
  const tipo = await buscarTipoEmprestimo(tipoId);

  // 2. Valida se o valor está dentro do intervalo permitido
  if (valor < tipo.valorMin || valor > tipo.valorMax) {
    throw new Error(
      `O valor deve estar entre ${tipo.valorMin} e ${tipo.valorMax} MT para este tipo de crédito.`
    );
  }

  // 3. Valida se o prazo está dentro do intervalo permitido
  if (prazo < tipo.prazoMin || prazo > tipo.prazoMax) {
    throw new Error(
      `O prazo deve estar entre ${tipo.prazoMin} e ${tipo.prazoMax} meses para este tipo de crédito.`
    );
  }

  // 4. Calcula a simulação financeira com as taxas actuais do tipo
  const simulacao = calcularSimulacao(valor, prazo, tipo.taxaMensal);

  // 5. Usamos $transaction com uma função (não um array), porque
  // precisamos do id do empréstimo recém-criado antes de criar
  // o registo de histórico — isso só é possível com uma função,
  // já que um array de operações não permite usar o resultado
  // de uma operação anterior dentro da mesma transacção.
  const emprestimo = await prisma.$transaction(async (tx) => {
    const novoEmprestimo = await tx.emprestimo.create({
      data: {
        clienteId,
        tipoId,
        valor,
        prazo,
        taxaMensal: tipo.taxaMensal, // copiamos a taxa actual, para não mudar se o admin alterar depois
        taxaNominal: tipo.taxaNominal,
        valorParcela: simulacao.valorParcela,
        valorTotal: simulacao.valorTotal,
        totalJuros: simulacao.totalJuros,
        status: "PENDENTE",
      },
    });

    await tx.historicoEmprestimo.create({
      data: {
        emprestimoId: novoEmprestimo.id, // agora já temos o id real
        acao: "Pedido criado",
        autor: "Cliente",
      },
    });

    return novoEmprestimo;
  });

  return emprestimo;
}

/**
 * FUNCIONÁRIO — encaminha um pedido pendente ao gerente, com observações.
 * Muda o status para EM_ANALISE.
 */
export async function encaminharEmprestimo(
  emprestimoId: number,
  observacoes: string,
  funcionarioId: number,
  funcionarioNome: string
) {
  const emprestimo = await prisma.emprestimo.findUnique({ where: { id: emprestimoId } });

  if (!emprestimo) {
    throw new Error("Pedido de empréstimo não encontrado.");
  }

  if (emprestimo.status !== "PENDENTE") {
    throw new Error("Só é possível encaminhar pedidos com estado PENDENTE.");
  }

  const [emprestimoAtualizado] = await prisma.$transaction([
    prisma.emprestimo.update({
      where: { id: emprestimoId },
      data: {
        status: "EM_ANALISE",
        observacoesFuncionario: observacoes,
        funcionarioId,
        funcionarioNome,
      },
    }),
    prisma.historicoEmprestimo.create({
      data: {
        emprestimoId,
        acao: "Encaminhado ao gerente",
        autor: funcionarioNome,
      },
    }),
    prisma.notificacao.create({
      data: {
        usuarioId: emprestimo.clienteId,
        emprestimoId,
        titulo: "Pedido em análise",
        mensagem: "O seu pedido de crédito foi encaminhado para aprovação do gerente.",
      },
    }),
  ]);

  return emprestimoAtualizado;
}

/**
 * GERENTE — aprova um pedido em análise.
 */
export async function aprovarEmprestimo(
  emprestimoId: number,
  gerenteId: number,
  gerenteNome: string
) {
  const emprestimo = await prisma.emprestimo.findUnique({ where: { id: emprestimoId } });

  if (!emprestimo) {
    throw new Error("Pedido de empréstimo não encontrado.");
  }

  if (emprestimo.status !== "EM_ANALISE") {
    throw new Error("Só é possível aprovar pedidos com estado EM_ANALISE.");
  }

  const [emprestimoAtualizado] = await prisma.$transaction([
    prisma.emprestimo.update({
      where: { id: emprestimoId },
      data: {
        status: "APROVADO",
        gerenteId,
        gerenteNome,
        dataDecisao: new Date(),
      },
    }),
    prisma.historicoEmprestimo.create({
      data: {
        emprestimoId,
        acao: "Pedido aprovado",
        autor: gerenteNome,
      },
    }),
    prisma.notificacao.create({
      data: {
        usuarioId: emprestimo.clienteId,
        emprestimoId,
        titulo: "Pedido aprovado!",
        mensagem: "Parabéns! O seu pedido de crédito foi aprovado.",
      },
    }),
  ]);

  return emprestimoAtualizado;
}

/**
 * GERENTE — rejeita um pedido em análise, com motivo obrigatório.
 */
export async function rejeitarEmprestimo(
  emprestimoId: number,
  motivo: string,
  gerenteId: number,
  gerenteNome: string
) {
  const emprestimo = await prisma.emprestimo.findUnique({ where: { id: emprestimoId } });

  if (!emprestimo) {
    throw new Error("Pedido de empréstimo não encontrado.");
  }

  if (emprestimo.status !== "EM_ANALISE") {
    throw new Error("Só é possível rejeitar pedidos com estado EM_ANALISE.");
  }

  const [emprestimoAtualizado] = await prisma.$transaction([
    prisma.emprestimo.update({
      where: { id: emprestimoId },
      data: {
        status: "REJEITADO",
        motivoRejeicao: motivo,
        gerenteId,
        gerenteNome,
        dataDecisao: new Date(),
      },
    }),
    prisma.historicoEmprestimo.create({
      data: {
        emprestimoId,
        acao: `Pedido rejeitado: ${motivo}`,
        autor: gerenteNome,
      },
    }),
    prisma.notificacao.create({
      data: {
        usuarioId: emprestimo.clienteId,
        emprestimoId,
        titulo: "Pedido rejeitado",
        mensagem: `O seu pedido foi rejeitado. Motivo: ${motivo}`,
      },
    }),
  ]);

  return emprestimoAtualizado;
}

/**
 * Lista pedidos de empréstimo, filtrados de acordo com o perfil
 * de quem consulta:
 *   - CLIENTE: só vê os seus próprios pedidos
 *   - FUNCIONARIO/GERENTE/ADMIN: vê todos os pedidos
 */
export async function listarEmprestimos(usuarioId: number, perfil: string) {
  const filtro = perfil === "CLIENTE" ? { clienteId: usuarioId } : {};

  return prisma.emprestimo.findMany({
    where: filtro,
    include: {
      cliente: { select: { id: true, nome: true, email: true } }, // dados básicos do cliente
      tipo: true, // dados do tipo de crédito
    },
    orderBy: { dataPedido: "desc" }, // mais recente primeiro
  });
}

/**
 * Busca um único pedido de empréstimo, com todos os detalhes
 * (documentos, pagamentos, histórico).
 */
export async function buscarEmprestimo(id: number) {
  const emprestimo = await prisma.emprestimo.findUnique({
    where: { id },
    include: {
      cliente: { select: { id: true, nome: true, email: true, bi: true, telefone: true } },
      tipo: true,
      documentos: true,
      pagamentos: { orderBy: { numeroParcela: "asc" } },
      historico: { orderBy: { data: "asc" } },
    },
  });

  if (!emprestimo) {
    throw new Error("Pedido de empréstimo não encontrado.");
  }

  return emprestimo;
}