// ================================================================
// js/cliente.js
// Lógica do Dashboard do Cliente
// Depende de js/db.js e js/auth.js carregados antes
// ================================================================


// ----------------------------------------------------------------
// VARIÁVEL GLOBAL
// Guarda o filtro de status actualmente seleccionado na lista
// ----------------------------------------------------------------
var filtroActual = 'todos';

// Guarda o usuário logado (preenchido na inicialização)
var usuarioActual = null;


// ================================================================
// BLOCO 1: CARREGAMENTO DO RESUMO (cards do topo)
// ================================================================

function carregarResumo() {

  // Busca todos os empréstimos deste cliente
  var meusEmprestimos = getEmprestimosPorCliente(usuarioActual.id);

  // Conta quantos estão em cada estado
  var pendentes = meusEmprestimos.filter(function(e) {
    return e.status === 'pendente' || e.status === 'em_analise';
  }).length;

  var activos = meusEmprestimos.filter(function(e) {
    return e.status === 'ativo';
  }).length;

  var quitados = meusEmprestimos.filter(function(e) {
    return e.status === 'quitado';
  }).length;

  // Soma o valor total em dívida (empréstimos activos)
  var totalDivida = meusEmprestimos
    .filter(function(e) { return e.status === 'ativo'; })
    .reduce(function(soma, e) {
      // Calcula quanto ainda falta pagar: parcelas restantes × valor da parcela
      var parcelasRestantes = e.prazo - e.parcelasPagas;
      return soma + (parcelasRestantes * e.valorParcela);
    }, 0);

  // Actualiza os textos no HTML
  document.getElementById('resumo-pendentes').textContent = pendentes;
  document.getElementById('resumo-activos').textContent = activos;
  document.getElementById('resumo-quitados').textContent = quitados;
  document.getElementById('resumo-divida').textContent = formatarMoeda(totalDivida) + ' MT';
}


// ================================================================
// BLOCO 2: LISTA DE EMPRÉSTIMOS
// ================================================================

function carregarListaEmprestimos() {

  var container = document.getElementById('lista-emprestimos');
  var meusEmprestimos = getEmprestimosPorCliente(usuarioActual.id);

  // Aplica o filtro seleccionado
  if (filtroActual !== 'todos') {
    meusEmprestimos = meusEmprestimos.filter(function(e) {
      return e.status === filtroActual;
    });
  }

  // Ordena do mais recente para o mais antigo
  meusEmprestimos.sort(function(a, b) {
    return new Date(b.dataPedido) - new Date(a.dataPedido);
  });

  // Se não há empréstimos, mostra o estado vazio
  if (meusEmprestimos.length === 0) {
    container.innerHTML =
      '<div class="lista-vazia">' +
        '<i class="ti ti-file-off"></i>' +
        '<h3>Nenhum pedido encontrado</h3>' +
        '<p>Ainda não tem pedidos de crédito com este estado.</p>' +
        '<a href="simulador.html" class="btn btn-primario">' +
          '<i class="ti ti-plus"></i> Pedir Crédito' +
        '</a>' +
      '</div>';
    return;
  }

  // Limpa o container antes de adicionar os novos cards
  container.innerHTML = '';

  // Cria um card HTML para cada empréstimo
  meusEmprestimos.forEach(function(emprestimo) {
    container.appendChild(criarCardEmprestimo(emprestimo));
  });
}


// Cria o elemento HTML de um card de empréstimo
// Retorna o elemento já construído (não uma string)
function criarCardEmprestimo(emprestimo) {

  // Cria o elemento <div> principal do card
  var card = document.createElement('div');
  card.className = 'emprestimo-card';

  // Traduz o status para um texto e classe de badge legíveis
  var statusInfo = traduzirStatus(emprestimo.status);

  // Calcula a percentagem de pagamento (para a barra de progresso)
  var percentagem = Math.round((emprestimo.parcelasPagas / emprestimo.prazo) * 100);

  // Monta o HTML interno do card usando os dados do empréstimo
  card.innerHTML =
    '<div class="emprestimo-topo">' +
      '<div>' +
        '<div class="emprestimo-tipo-nome">' + emprestimo.tipoNome + '</div>' +
        '<div class="emprestimo-id">Pedido #' + String(emprestimo.id).padStart(5, '0') + '</div>' +
      '</div>' +
      '<span class="badge ' + statusInfo.classe + '">' + statusInfo.texto + '</span>' +
    '</div>' +

    '<div class="emprestimo-dados">' +
      '<div>' +
        '<div class="emprestimo-dado-label">Valor pedido</div>' +
        '<div class="emprestimo-dado-valor">' + formatarMoeda(emprestimo.valor) + ' MT</div>' +
      '</div>' +
      '<div>' +
        '<div class="emprestimo-dado-label">Prestação mensal</div>' +
        '<div class="emprestimo-dado-valor">' + formatarMoeda(emprestimo.valorParcela) + ' MT</div>' +
      '</div>' +
      '<div>' +
        '<div class="emprestimo-dado-label">Prazo</div>' +
        '<div class="emprestimo-dado-valor">' + emprestimo.prazo + ' meses</div>' +
      '</div>' +
      '<div>' +
        '<div class="emprestimo-dado-label">Data do pedido</div>' +
        '<div class="emprestimo-dado-valor">' + formatarData(emprestimo.dataPedido) + '</div>' +
      '</div>' +
    '</div>' +

    // Só mostra a barra de progresso se o empréstimo já estiver activo
    (emprestimo.status === 'ativo' || emprestimo.status === 'quitado' ?
      '<div class="emprestimo-progresso">' +
        '<div class="progresso-label-linha">' +
          '<span>' + emprestimo.parcelasPagas + ' de ' + emprestimo.prazo + ' parcelas pagas</span>' +
          '<span>' + percentagem + '%</span>' +
        '</div>' +
        '<div class="progresso-wrapper">' +
          '<div class="progresso-barra sucesso" style="width:' + percentagem + '%"></div>' +
        '</div>' +
      '</div>'
      : ''
    ) +

    '<div class="emprestimo-rodape">' +
      '<button class="btn btn-secundario btn-sm btn-detalhes" data-id="' + emprestimo.id + '">' +
        '<i class="ti ti-eye"></i> Ver Detalhes' +
      '</button>' +
    '</div>';

  // Liga o botão de detalhes deste card específico
  card.querySelector('.btn-detalhes').addEventListener('click', function() {
    abrirModalDetalhes(emprestimo.id);
  });

  return card;
}


// Converte o status técnico (ex: "em_analise") num texto e cor amigáveis
function traduzirStatus(status) {
  var mapa = {
    'pendente':   { texto: 'Pendente',    classe: 'badge-pendente'  },
    'em_analise': { texto: 'Em Análise',  classe: 'badge-analise'   },
    'aprovado':   { texto: 'Aprovado',    classe: 'badge-aprovado'  },
    'rejeitado':  { texto: 'Rejeitado',   classe: 'badge-rejeitado' },
    'ativo':      { texto: 'Activo',      classe: 'badge-ativo'     },
    'quitado':    { texto: 'Quitado',     classe: 'badge-quitado'   }
  };
  return mapa[status] || { texto: status, classe: 'badge-pendente' };
}


// ================================================================
// BLOCO 3: FILTROS DE STATUS
// ================================================================

function iniciarFiltros() {
  var botoes = document.querySelectorAll('.filtro-btn');

  botoes.forEach(function(botao) {
    botao.addEventListener('click', function() {

      // Remove "activo" de todos os botões
      botoes.forEach(function(b) { b.classList.remove('activo'); });

      // Activa o botão clicado
      this.classList.add('activo');

      // Actualiza o filtro e recarrega a lista
      filtroActual = this.getAttribute('data-filtro');
      carregarListaEmprestimos();
    });
  });
}


// ================================================================
// BLOCO 4: MODAL DE DETALHES DO EMPRÉSTIMO
// ================================================================

function abrirModalDetalhes(emprestimoId) {

  var emprestimo = getEmprestimos().find(function(e) { return e.id === emprestimoId; });
  if (!emprestimo) return;

  // Preenche o resumo no topo do modal
  document.getElementById('modal-tipo-nome').textContent = emprestimo.tipoNome;
  document.getElementById('modal-status').className = 'badge ' + traduzirStatus(emprestimo.status).classe;
  document.getElementById('modal-status').textContent = traduzirStatus(emprestimo.status).texto;

  document.getElementById('modal-valor').textContent = formatarMoeda(emprestimo.valor) + ' MT';
  document.getElementById('modal-parcela').textContent = formatarMoeda(emprestimo.valorParcela) + ' MT';
  document.getElementById('modal-total').textContent = formatarMoeda(emprestimo.valorTotal) + ' MT';

  // Gera a tabela de amortização completa
  var tabela = gerarTabelaAmortizacao(emprestimo.valor, emprestimo.taxaMensal, emprestimo.prazo);
  var corpoTabela = document.getElementById('tabela-amortizacao-corpo');
  corpoTabela.innerHTML = '';

  tabela.forEach(function(linha) {
    var tr = document.createElement('tr');

    // Marca visualmente as parcelas já pagas
    var jaPaga = linha.mes <= emprestimo.parcelasPagas;

    tr.innerHTML =
      '<td>' + linha.mes + (jaPaga ? ' <i class="ti ti-check texto-sucesso"></i>' : '') + '</td>' +
      '<td>' + formatarMoeda(linha.parcela) + '</td>' +
      '<td>' + formatarMoeda(linha.juros) + '</td>' +
      '<td>' + formatarMoeda(linha.capital) + '</td>' +
      '<td>' + formatarMoeda(linha.saldo) + '</td>';

    corpoTabela.appendChild(tr);
  });

  // Preenche o histórico de acções
  var containerHistorico = document.getElementById('historico-lista');
  containerHistorico.innerHTML = '';

  // Mostra do mais recente para o mais antigo
  var historicoOrdenado = emprestimo.historico.slice().reverse();

  historicoOrdenado.forEach(function(item) {
    var div = document.createElement('div');
    div.className = 'historico-item';
    div.innerHTML =
      '<div class="historico-ponto"></div>' +
      '<div>' +
        '<div class="historico-acao">' + item.acao + '</div>' +
        '<div class="historico-meta">' + item.autor + ' · ' + formatarDataHora(item.data) + '</div>' +
      '</div>';
    containerHistorico.appendChild(div);
  });

  // Mostra o modal
  document.getElementById('modal-overlay').classList.add('visivel');
}

function fecharModal() {
  document.getElementById('modal-overlay').classList.remove('visivel');
}


// Alterna entre as abas do modal (Amortização / Histórico)
function iniciarAbasModal() {
  var abas = document.querySelectorAll('.modal-aba');

  abas.forEach(function(aba) {
    aba.addEventListener('click', function() {

      abas.forEach(function(a) { a.classList.remove('activa'); });
      document.querySelectorAll('.modal-painel').forEach(function(p) {
        p.classList.remove('activo');
      });

      this.classList.add('activa');
      var painelId = this.getAttribute('data-painel');
      document.getElementById(painelId).classList.add('activo');
    });
  });
}


// ================================================================
// BLOCO 5: NOTIFICAÇÕES
// ================================================================

function carregarNotificacoes() {
  var notifs = getNotificacoes('cliente');
  var contador = document.getElementById('notif-contador');
  var lista = document.getElementById('lista-notificacoes');

  // Actualiza o número no badge do sino
  if (notifs.length > 0) {
    contador.textContent = notifs.length;
    contador.classList.remove('escondido');
  } else {
    contador.classList.add('escondido');
  }

  // Preenche a lista do painel dropdown
  if (notifs.length === 0) {
    lista.innerHTML = '<div class="notif-item"><div class="notif-texto">Sem notificações novas.</div></div>';
    return;
  }

  lista.innerHTML = '';
  notifs.forEach(function(n) {
    var item = document.createElement('div');
    item.className = 'notif-item';
    item.innerHTML =
      '<div class="notif-icone"><i class="ti ti-bell"></i></div>' +
      '<div>' +
        '<div class="notif-titulo">' + n.titulo + '</div>' +
        '<div class="notif-texto">' + n.mensagem + '</div>' +
        '<div class="notif-tempo">' + formatarDataHora(n.data) + '</div>' +
      '</div>';
    lista.appendChild(item);
  });
}

// Abre/fecha o painel de notificações
function iniciarPainelNotificacoes() {
  var botao = document.getElementById('btn-notificacoes');
  var painel = document.getElementById('painel-notificacoes');

  botao.addEventListener('click', function(evento) {
    evento.stopPropagation(); // Evita que o clique feche o painel imediatamente
    painel.classList.toggle('visivel');
  });

  // Fecha o painel se clicar fora dele
  document.addEventListener('click', function(evento) {
    if (!painel.contains(evento.target) && evento.target !== botao) {
      painel.classList.remove('visivel');
    }
  });
}


// ================================================================
// INICIALIZAÇÃO GERAL
// ================================================================

document.addEventListener('DOMContentLoaded', function() {

  // Protege a página: só clientes podem acessar
  usuarioActual = exigirPerfil(['cliente']);
  if (!usuarioActual) return; // Já foi redireccionado se não tiver permissão

  // Mostra o nome do utilizador no cabeçalho/sidebar
  mostrarInfoUsuario(
    document.getElementById('nome-usuario'),
    document.getElementById('perfil-usuario')
  );

  // Mostra as iniciais no avatar
  var iniciais = usuarioActual.nome.split(' ').map(function(p) { return p[0]; }).join('').substring(0, 2);
  document.getElementById('avatar-iniciais').textContent = iniciais.toUpperCase();

  // Carrega todos os dados do dashboard
  carregarResumo();
  carregarListaEmprestimos();
  carregarNotificacoes();

  // Liga os módulos interactivos
  iniciarFiltros();
  iniciarAbasModal();
  iniciarPainelNotificacoes();
  configurarBotaoLogout('#btn-logout');

  // Liga o botão de fechar modal
  document.getElementById('btn-fechar-modal').addEventListener('click', fecharModal);

  // Fecha o modal se clicar fora dele (no overlay escuro)
  document.getElementById('modal-overlay').addEventListener('click', function(evento) {
    if (evento.target === this) fecharModal();
  });
});