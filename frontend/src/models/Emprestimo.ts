// Emprestimo.ts — Interfaces relacionadas com pedidos de crédito

export type StatusEmprestimo =
| "PENDENTE" | "EM_ANALISE" | "APROVADO" | "REJEITADO" | "ATIVO" | "QUITADO";


// Um tipo de crédito (Consumo, Investimento, Funcionário Público/Privado).
export interface TipoEmprestimo{
    id: number;
    nome: string;
    descricao: string;
    taxaMensal: number;
    taxaNominal: number;
    prazoMin: number;
    prazoMax: number;
    valorMin: number;
    valorMax: number;
}


// Um pedido de empréstimo, com todos os dados principais.
export interface Emprestimo{
    id: number;
    clienteId: number;
    tipoId: number;
    valor: number;
    prazo: number;
    taxaMensal: number;
    taxaNominal: number;
    valorParcela: number;
    valorTotal: number;
    totalJuros: number;
    status: StatusEmprestimo;
    motivoRejeicao?: string;
    observacoesFuncionario?: string;
    funcionarioNome?: string;
    gerenteNome?: string;
    parcelasPagas: number;
    dataPedido: string;
    dataDecisao?: string;

    cliente?: { id:number; nome:string; email:string};
    tipo?: TipoEmprestimo;
}

// Uma linha da tabela de amortização (usado no simulador).
export interface LinhaAmortizacao{
    numeroParcela: number;
    saldoDevedorInicial: number;
    juros: number;
    amortizacao: number;
    valorParcela:number;
    saldoDevedorFinal: number;
}

// Resultado de uma simulação de crédito (sem criar pedido).
export interface ResultadoSimulacao{
    valorParcela: number;
    valorTotal: number;
    totalJuros: number;
    tabelaAmortizacao: LinhaAmortizacao[];
}