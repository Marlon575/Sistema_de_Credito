import { calcularSimulacao } from "../services/emprestimo.service"; // função a testar

// "describe" agrupa testes relacionados, com um nome descritivo
describe("calcularSimulacao (método Price/Francês)", () => {

  // cada "test" (ou "it") é um caso de teste individual
  test("calcula correctamente a prestação mensal para um empréstimo simples", () => {
    // Arrange (preparar): valores de entrada conhecidos
    const valor = 100000; // 100.000 MT
    const prazo = 12; // 12 meses
    const taxaMensal = 1.667; // 1.667% ao mês

    // Act (agir): chama a função a testar
    const resultado = calcularSimulacao(valor, prazo, taxaMensal);

    // Assert (verificar): confirma que o resultado é o esperado
    // Usamos toBeCloseTo em vez de toBe porque cálculos com
    // decimais podem ter pequenas diferenças de arredondamento
    expect(resultado.valorParcela).toBeCloseTo(9263.64, 1); // 1 casa decimal de tolerância
    expect(resultado.valorTotal).toBeCloseTo(111163.7, 1);
    expect(resultado.totalJuros).toBeCloseTo(11163.7, 1);
  });

  test("a tabela de amortização tem exactamente o número de linhas igual ao prazo", () => {
    const resultado = calcularSimulacao(50000, 6, 1.25);

    expect(resultado.tabelaAmortizacao).toHaveLength(6); // 6 meses = 6 linhas
  });

  test("o saldo devedor final da última parcela deve ser zero (ou muito próximo)", () => {
    const resultado = calcularSimulacao(200000, 24, 1.417);
    const ultimaLinha = resultado.tabelaAmortizacao[resultado.tabelaAmortizacao.length - 1];

    // no fim do empréstimo, a dívida deve estar totalmente paga
    expect(ultimaLinha?.saldoDevedorFinal).toBeCloseTo(0, 1);
  });

  test("o número da parcela na tabela de amortização é sequencial, começando em 1", () => {
    const resultado = calcularSimulacao(30000, 3, 1.667);

    expect(resultado.tabelaAmortizacao[0]?.numeroParcela).toBe(1);
    expect(resultado.tabelaAmortizacao[1]?.numeroParcela).toBe(2);
    expect(resultado.tabelaAmortizacao[2]?.numeroParcela).toBe(3);
  });

  test("a soma de todas as parcelas deve ser igual ao valor total", () => {
    const resultado = calcularSimulacao(80000, 10, 1.5);

    const somaParcelas = resultado.tabelaAmortizacao.reduce(
      (soma, linha) => soma + linha.valorParcela,
      0
    );

    expect(somaParcelas).toBeCloseTo(resultado.valorTotal, 0); // tolerância de arredondamento
  });
});