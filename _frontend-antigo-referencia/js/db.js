// ================================================================
// js/db.js — BASE DE DADOS LOCAL (localStorage)
// ================================================================
// O localStorage é um "cofre" do navegador onde podemos guardar
// dados em texto. Os dados ficam guardados mesmo depois de fechar
// o navegador. Cada entrada tem uma "chave" e um "valor".
// ================================================================


// ----------------------------------------------------------------
// SECÇÃO 1: INICIALIZAÇÃO
// ----------------------------------------------------------------
// Esta função cria todos os dados iniciais do sistema.
// É executada automaticamente quando a página carrega.

function inicializarDB() {

  // --- UTILIZADORES ---
  // Verifica se já existem utilizadores guardados.
  // Se não existirem (primeiro uso), cria os 4 utilizadores padrão.
  if (!localStorage.getItem('usuarios')) {

    const usuariosPadrao = [
      {
        id: 1,
        nome: 'Super Admin',
        email: 'admin@credito.co.mz',
        senha: 'admin123',
        perfil: 'admin',         // Perfil 4: gere tudo
        ativo: true,
        dataCriacao: new Date().toISOString()
      },
      {
        id: 2,
        nome: 'Carlos Machava',
        email: 'funcionario@credito.co.mz',
        senha: 'func123',
        perfil: 'funcionario',   // Perfil 2: analisa e encaminha
        ativo: true,
        dataCriacao: new Date().toISOString()
      },
      {
        id: 3,
        nome: 'Ana Sitoe',
        email: 'gerente@credito.co.mz',
        senha: 'ger123',
        perfil: 'gerente',       // Perfil 3: aprova ou reprova
        ativo: true,
        dataCriacao: new Date().toISOString()
      },
      {
        id: 4,
        nome: 'Cliente Demo',
        email: 'cliente@demo.com',
        senha: 'cli123',
        perfil: 'cliente',       // Perfil 1: pede empréstimo
        ativo: true,
        bi: '123456789A',
        telefone: '84 000 0000',
        endereco: 'Maputo, Mozambique',
        rendimentoMensal: 45000,
        dataCriacao: new Date().toISOString()
      }
    ];

    // Converte o array para texto e guarda no localStorage.
    localStorage.setItem('usuarios', JSON.stringify(usuariosPadrao));
  }


  // --- TIPOS DE EMPRÉSTIMO ---
  // Cada tipo tem a sua própria taxa de juro mensal e nominal.
  // Estas taxas são usadas no simulador de crédito.
  if (!localStorage.getItem('tiposEmprestimo')) {

    const tipos = [
      {
        id: 1,
        nome: 'Consumo',
        descricao: 'Para compras pessoais, electrodomésticos, viagens, etc.',
        taxaMensal: 1.667,       // Taxa de juro mensal em % (igual ao BCI)
        taxaNominal: 20,         // Taxa nominal anual em %
        prazoMinimo: 6,          // Mínimo de meses para pagar
        prazoMaximo: 60,         // Máximo de meses para pagar
        valorMinimo: 25000,      // Valor mínimo em MT
        valorMaximo: 2000000,    // Valor máximo em MT
        icone: 'ti-shopping-cart'
      },
      {
        id: 2,
        nome: 'Investimento',
        descricao: 'Para negócios, expansão de empresa, equipamentos.',
        taxaMensal: 1.417,
        taxaNominal: 17,
        prazoMinimo: 12,
        prazoMaximo: 84,
        valorMinimo: 50000,
        valorMaximo: 10000000,
        icone: 'ti-building-store'
      },
      {
        id: 3,
        nome: 'Funcionário Público e Privado',
        descricao: 'Crédito especial com desconto automático no salário.',
        taxaMensal: 1.250,
        taxaNominal: 15,
        prazoMinimo: 6,
        prazoMaximo: 72,
        valorMinimo: 10000,
        valorMaximo: 1500000,
        icone: 'ti-id-badge'
      }
    ];

    localStorage.setItem('tiposEmprestimo', JSON.stringify(tipos));
  }


  // --- EMPRÉSTIMOS ---
  // Lista de todos os pedidos feitos pelos clientes.
  // Começa vazia — será preenchida pelo uso do sistema.
  if (!localStorage.getItem('emprestimos')) {
    localStorage.setItem('emprestimos', JSON.stringify([]));
  }


  // --- PAGAMENTOS ---
  // Registo de cada parcela paga por cada empréstimo.
  if (!localStorage.getItem('pagamentos')) {
    localStorage.setItem('pagamentos', JSON.stringify([]));
  }


  // --- NOTIFICAÇÕES ---
  // Mensagens que aparecem para cada utilizador.
  if (!localStorage.getItem('notificacoes')) {
    localStorage.setItem('notificacoes', JSON.stringify([]));
  }
}


// ----------------------------------------------------------------
// SECÇÃO 2: FUNÇÕES GENÉRICAS (usadas por todas as outras)
// ----------------------------------------------------------------

// Lê qualquer tabela da base de dados pelo nome da chave.
// "chave" pode ser: 'usuarios', 'emprestimos', 'pagamentos', etc.
function lerTabela(chave) {
  // JSON.parse converte o texto guardado de volta para array/objecto.
  // O "|| []" garante que retorna um array vazio se não encontrar nada.
  return JSON.parse(localStorage.getItem(chave)) || [];
}

// Guarda qualquer tabela na base de dados.
function guardarTabela(chave, dados) {
  localStorage.setItem(chave, JSON.stringify(dados));
}

// Gera um novo ID único para qualquer tabela.
// Percorre a lista, pega todos os IDs existentes e devolve o maior + 1.
function gerarId(lista) {
  if (lista.length === 0) return 1; // Se a lista está vazia, começa do 1
  return Math.max(...lista.map(item => item.id)) + 1;
}


// ----------------------------------------------------------------
// SECÇÃO 3: UTILIZADORES
// ----------------------------------------------------------------

function getUsuarios() {
  return lerTabela('usuarios');
}

// Busca um utilizador pelo seu email (usado no login).
function getUsuarioPorEmail(email) {
  return getUsuarios().find(u => u.email === email);
}

// Busca um utilizador pelo seu ID.
function getUsuarioPorId(id) {
  return getUsuarios().find(u => u.id === id);
}

// Cria um novo utilizador (usado pelo admin).
function criarUsuario(dados) {
  const usuarios = getUsuarios();
  const novo = {
    id: gerarId(usuarios),
    ativo: true,
    dataCriacao: new Date().toISOString(),
    ...dados   // Copia nome, email, senha, perfil, etc.
  };
  usuarios.push(novo);
  guardarTabela('usuarios', usuarios);
  return novo;
}

// Actualiza os dados de um utilizador existente.
function atualizarUsuario(id, alteracoes) {
  const usuarios = getUsuarios();
  const indice = usuarios.findIndex(u => u.id === id);
  if (indice !== -1) {
    // Mantém os dados antigos e sobrescreve apenas os que mudaram.
    usuarios[indice] = { ...usuarios[indice], ...alteracoes };
    guardarTabela('usuarios', usuarios);
    return usuarios[indice];
  }
  return null;
}

// Remove (desactiva) um utilizador — não apaga, apenas marca ativo: false.
// Isto é uma boa prática: nunca apagar dados, apenas desactivar.
function desativarUsuario(id) {
  return atualizarUsuario(id, { ativo: false });
}


// ----------------------------------------------------------------
// SECÇÃO 4: EMPRÉSTIMOS
// ----------------------------------------------------------------

function getEmprestimos() {
  return lerTabela('emprestimos');
}

// Busca apenas os empréstimos de um cliente específico.
function getEmprestimosPorCliente(clienteId) {
  return getEmprestimos().filter(e => e.clienteId === clienteId);
}

// Busca empréstimos por estado (pendente, em_analise, aprovado, etc).
function getEmprestimosPorStatus(status) {
  return getEmprestimos().filter(e => e.status === status);
}

// Cria um novo pedido de empréstimo.
function criarEmprestimo(dados) {
  const emprestimos = getEmprestimos();

  // Calcula automaticamente os valores financeiros.
  const calculo = calcularEmprestimo(
    parseFloat(dados.valor),
    parseFloat(dados.taxaMensal),
    parseInt(dados.prazo)
  );

  const novo = {
    id: gerarId(emprestimos),
    status: 'pendente',              // Estado inicial: aguarda o funcionário
    dataPedido: new Date().toISOString(),
    dataAtualizacao: new Date().toISOString(),
    valorParcela: calculo.parcela,   // Valor de cada prestação mensal
    valorTotal: calculo.total,       // Total a pagar com juros
    totalJuros: calculo.juros,       // Valor só dos juros
    parcelasPagas: 0,                // Começa com zero pagamentos
    historico: [                     // Registo de todas as acções
      {
        data: new Date().toISOString(),
        acao: 'Pedido submetido pelo cliente',
        autor: dados.clienteNome
      }
    ],
    ...dados
  };

  emprestimos.push(novo);
  guardarTabela('emprestimos', emprestimos);

  // Cria uma notificação para o funcionário saber que há novo pedido.
  criarNotificacao({
    para: 'funcionario',        // Destinatário do perfil funcionário
    titulo: 'Novo pedido de crédito',
    mensagem: `${dados.clienteNome} submeteu um pedido de ${formatarMoeda(dados.valor)} MT`,
    emprestimoId: novo.id,
    lida: false
  });

  return novo;
}

// Actualiza o estado de um empréstimo e adiciona ao histórico.
function atualizarEmprestimo(id, alteracoes, acaoHistorico, autorAcao) {
  const emprestimos = getEmprestimos();
  const indice = emprestimos.findIndex(e => e.id === id);

  if (indice !== -1) {
    const emprestimo = emprestimos[indice];

    // Adiciona esta acção ao histórico de acções do empréstimo.
    const novoHistorico = [
      ...emprestimo.historico,   // Mantém o histórico anterior
      {
        data: new Date().toISOString(),
        acao: acaoHistorico,
        autor: autorAcao
      }
    ];

    emprestimos[indice] = {
      ...emprestimo,
      ...alteracoes,
      historico: novoHistorico,
      dataAtualizacao: new Date().toISOString()
    };

    guardarTabela('emprestimos', emprestimos);
    return emprestimos[indice];
  }
  return null;
}


// ----------------------------------------------------------------
// SECÇÃO 5: PAGAMENTOS
// ----------------------------------------------------------------

function getPagamentos() {
  return lerTabela('pagamentos');
}

// Busca todos os pagamentos de um empréstimo específico.
function getPagamentosPorEmprestimo(emprestimoId) {
  return getPagamentos().filter(p => p.emprestimoId === emprestimoId);
}

// Regista o pagamento de uma parcela.
function registarPagamento(emprestimoId, valorPago, registadoPor) {
  const pagamentos = getPagamentos();
  const emprestimo = getEmprestimos().find(e => e.id === emprestimoId);

  if (!emprestimo) return null;

  const novo = {
    id: gerarId(pagamentos),
    emprestimoId,
    valorPago,
    numeroParcela: emprestimo.parcelasPagas + 1, // Qual parcela está a pagar
    dataPagamento: new Date().toISOString(),
    registadoPor   // Nome do funcionário que registou
  };

  pagamentos.push(novo);
  guardarTabela('pagamentos', pagamentos);

  // Actualiza o contador de parcelas pagas no empréstimo.
  const novasParcelas = emprestimo.parcelasPagas + 1;
  const quitado = novasParcelas >= emprestimo.prazo;

  atualizarEmprestimo(
    emprestimoId,
    {
      parcelasPagas: novasParcelas,
      status: quitado ? 'quitado' : 'ativo'
    },
    `Parcela ${novasParcelas} paga: ${formatarMoeda(valorPago)} MT`,
    registadoPor
  );

  return novo;
}


// ----------------------------------------------------------------
// SECÇÃO 6: NOTIFICAÇÕES
// ----------------------------------------------------------------

function criarNotificacao(dados) {
  const notifs = lerTabela('notificacoes');
  const nova = {
    id: gerarId(notifs),
    data: new Date().toISOString(),
    ...dados
  };
  notifs.push(nova);
  guardarTabela('notificacoes', notifs);
}

// Busca notificações não lidas para um perfil específico.
function getNotificacoes(perfil) {
  return lerTabela('notificacoes')
    .filter(n => n.para === perfil && !n.lida)
    .reverse(); // Mais recentes primeiro
}

// Marca uma notificação como lida.
function marcarNotificacaoLida(id) {
  const notifs = lerTabela('notificacoes');
  const indice = notifs.findIndex(n => n.id === id);
  if (indice !== -1) {
    notifs[indice].lida = true;
    guardarTabela('notificacoes', notifs);
  }
}


// ----------------------------------------------------------------
// SECÇÃO 7: TIPOS DE EMPRÉSTIMO
// ----------------------------------------------------------------

function getTiposEmprestimo() {
  return lerTabela('tiposEmprestimo');
}

function getTipoEmprestimoPorId(id) {
  return getTiposEmprestimo().find(t => t.id === id);
}


// ----------------------------------------------------------------
// SECÇÃO 8: CÁLCULOS FINANCEIROS (Método Price/Francês)
// ----------------------------------------------------------------
// O método Price é usado pelos bancos reais.
// A prestação é sempre igual todos os meses.
// Cada mês paga-se menos juros e mais capital.

function calcularEmprestimo(valor, taxaMensal, prazo) {
  // Converte a taxa percentual para decimal.
  // Ex: 1.667% → 0.01667
  const i = taxaMensal / 100;

  // Fórmula Price para calcular a prestação mensal constante:
  // PMT = PV × [i × (1+i)^n] / [(1+i)^n - 1]
  // Onde: PV = valor, i = taxa mensal, n = número de meses
  const fator = Math.pow(1 + i, prazo); // (1+i)^n
  const parcela = valor * (i * fator) / (fator - 1);

  const total = parcela * prazo;        // Total pago ao longo de todos os meses
  const juros = total - valor;          // Quanto se pagou só em juros

  return {
    parcela: parseFloat(parcela.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    juros: parseFloat(juros.toFixed(2))
  };
}

// Gera a tabela de amortização completa (mês a mês).
// Mostra para cada mês: parcela, juros pagos, capital pago, saldo restante.
function gerarTabelaAmortizacao(valor, taxaMensal, prazo) {
  const i = taxaMensal / 100;
  const fator = Math.pow(1 + i, prazo);
  const parcela = valor * (i * fator) / (fator - 1);

  const tabela = [];
  let saldo = valor; // Saldo devedor começa igual ao valor do empréstimo

  for (let mes = 1; mes <= prazo; mes++) {
    const jurosMes = saldo * i;              // Juros deste mês = saldo × taxa
    const capitalMes = parcela - jurosMes;  // Capital amortizado = parcela - juros
    saldo = saldo - capitalMes;             // Novo saldo = saldo anterior - capital pago

    tabela.push({
      mes,
      parcela: parseFloat(parcela.toFixed(2)),
      juros: parseFloat(jurosMes.toFixed(2)),
      capital: parseFloat(capitalMes.toFixed(2)),
      saldo: parseFloat(Math.max(0, saldo).toFixed(2)) // Nunca deixa ficar negativo
    });
  }

  return tabela;
}


// ----------------------------------------------------------------
// SECÇÃO 9: UTILITÁRIOS DE FORMATAÇÃO
// ----------------------------------------------------------------

// Formata um número como moeda moçambicana.
// Ex: 45000 → "45,000.00"
function formatarMoeda(valor) {
  return parseFloat(valor).toLocaleString('pt-MZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Formata uma data ISO para formato legível.
// Ex: "2024-01-15T10:30:00.000Z" → "15/01/2024"
function formatarData(dataISO) {
  return new Date(dataISO).toLocaleDateString('pt-MZ');
}

// Formata data e hora juntos.
function formatarDataHora(dataISO) {
  return new Date(dataISO).toLocaleString('pt-MZ');
}

// Calcula o score de crédito simples (0 a 100).
// Baseado na relação entre o rendimento mensal e o valor pedido.
function calcularScore(rendimentoMensal, valorPedido, prazo) {
  const parcela = calcularEmprestimo(valorPedido, 1.667, prazo).parcela;

  // Rácio: percentagem do salário que vai para a prestação.
  // Bancos normalmente aceitam até 40% do salário.
  const racio = (parcela / rendimentoMensal) * 100;

  if (racio <= 20) return { score: 90, nivel: 'Excelente', cor: 'success' };
  if (racio <= 30) return { score: 75, nivel: 'Bom', cor: 'success' };
  if (racio <= 40) return { score: 60, nivel: 'Aceitável', cor: 'warning' };
  if (racio <= 50) return { score: 40, nivel: 'Arriscado', cor: 'warning' };
  return { score: 20, nivel: 'Alto Risco', cor: 'danger' };
}


// ----------------------------------------------------------------
// EXECUÇÃO AUTOMÁTICA
// ----------------------------------------------------------------
// Esta linha executa "inicializarDB()" assim que o ficheiro carrega.
// Garante que os dados padrão existem antes de qualquer outra coisa.
inicializarDB();