// ================================================================
// js/gerente.js
// Lógica do Dashboard do Gerente de Relacionamento
// Depende de js/db.js e js/auth.js carregados antes
// ================================================================
// O gerente pode:
//   - Ver pedidos com status "em_analise"
//   - Ver os dados completos do cliente e do pedido
//   - Ver o score de crédito e as observações do funcionário
//   - APROVAR com um clique
//   - REJEITAR com motivo obrigatório
// ================================================================


var usuarioActual = null;
var filtroActual  = 'em_analise';
var pedidoAberto  = null;
var modoRejeicao  = false;   // Controla se o campo de motivo está visível


// ================================================================
// BLOCO 1: RESUMO DO TOPO
// ================================================================

function carregarResumo() {
  var todos     = getEmprestimos();
  var emAnalise = todos.filter(function(e) { return e.status === 'em_analise'; }).length;
  var aprovados = todos.filter(function(e) { return e.status === 'aprovado' || e.status === 'ativo' || e.status === 'quitado'; }).length;
  var rejeitados= todos.filter(function(e) { return e.status === 'rejeitado'; }).length;
  var total     = todos.filter(function(e) { return e.status !== 'pendente'; }).length;

  document.getElementById('resumo-em-analise').textContent = emAnalise;
  document.getElementById('resumo-aprovados').textContent  = aprovados;
  document.getElementById('resumo-rejeitados').textContent = rejeitados;
  document.getElementById('resumo-total').textContent      = total;
}


// ================================================================
// BLOCO 2: TABELA DE PEDIDOS
// ================================================================

function carregarTabela(termoPesquisa) {
  var tbody = document.getElementById('tabela-corpo');
  var todos = getEmprestimos();

  var lista = todos.filter(function(e) {
    if (filtroActual === 'todos') return e.status !== 'pendente';
    return e.status === filtroActual;
  });

  if (termoPesquisa && termoPesquisa.trim().length > 0) {
    var termo = termoPesquisa.trim().toLowerCase();
    lista = lista.filter(function(e) {
      return (
        e.clienteNome.toLowerCase().includes(termo) ||
        String(e.id).includes(termo)
      );
    });
  }

  lista.sort(function(a, b) {
    return new Date(b.dataAtualizacao) - new Date(a.dataAtualizacao);
  });

  if (lista.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8">' +
        '<div class="tabela-vazia">' +
          '<i class="ti ti-inbox"></i>' +
          '<p>Nenhum pedido encontrado para aprovação.</p>' +
        '</div>' +
      '</td></tr>';
    return;
  }

  tbody.innerHTML = '';

  lista.forEach(function(pedido) {
    var tr = document.createElement('tr');
    tr.className = 'linha-pedido';

    var iniciais = pedido.clienteNome
      .split(' ')
      .map(function(p) { return p[0]; })
      .join('')
      .substring(0, 2)
      .toUpperCase();

    var statusInfo = traduzirStatus(pedido.status);
    var score = null;
    var cliente = getUsuarioPorId(pedido.clienteId);
    if (cliente) {
      score = calcularScore(cliente.rendimentoMensal, pedido.valor, pedido.prazo);
    }

    tr.innerHTML =
      '<td>' +
        '<span style="font-family:var(--fonte-mono); font-size:0.8rem; color:var(--texto-suave)">' +
          '#' + String(pedido.id).padStart(5, '0') +
        '</span>' +
      '</td>' +
      '<td>' +
        '<div class="cliente-info">' +
          '<div class="cliente-avatar">' + iniciais + '</div>' +
          '<div class="cliente-nome">' + pedido.clienteNome + '</div>' +
        '</div>' +
      '</td>' +
      '<td>' + pedido.tipoNome + '</td>' +
      '<td style="font-family:var(--fonte-mono); font-weight:600">' +
        formatarMoeda(pedido.valor) + ' MT' +
      '</td>' +
      '<td>' + pedido.prazo + ' meses</td>' +
      '<td>' +
        (score ?
          '<span style="font-weight:700; color:var(--' + score.cor + ')">' +
            score.score + '/100' +
          '</span>'
          : '—'
        ) +
      '</td>' +
      '<td><span class="badge ' + statusInfo.classe + '">' + statusInfo.texto + '</span></td>' +
      '<td>' + formatarData(pedido.dataAtualizacao) + '</td>';

    tr.addEventListener('click', function() {
      abrirModalDecisao(pedido.id);
    });

    tbody.appendChild(tr);
  });
}

function traduzirStatus(status) {
  var mapa = {
    'pendente':   { texto: 'Pendente',   classe: 'badge-pendente'  },
    'em_analise': { texto: 'Em Análise', classe: 'badge-analise'   },
    'aprovado':   { texto: 'Aprovado',   classe: 'badge-aprovado'  },
    'rejeitado':  { texto: 'Rejeitado',  classe: 'badge-rejeitado' },
    'ativo':      { texto: 'Activo',     classe: 'badge-ativo'     },
    'quitado':    { texto: 'Quitado',    classe: 'badge-quitado'   }
  };
  return mapa[status] || { texto: status, classe: 'badge-pendente' };
}


// ================================================================
// BLOCO 3: MODAL DE DECISÃO
// ================================================================

function abrirModalDecisao(pedidoId) {
  pedidoAberto = getEmprestimos().find(function(e) { return e.id === pedidoId; });
  if (!pedidoAberto) return;

  modoRejeicao = false;

  var cliente = getUsuarioPorId(pedidoAberto.clienteId);

  // Cabeçalho
  document.getElementById('modal-pedido-id').textContent =
    '#' + String(pedidoAberto.id).padStart(5, '0');
  document.getElementById('modal-pedido-status').className =
    'badge ' + traduzirStatus(pedidoAberto.status).classe;
  document.getElementById('modal-pedido-status').textContent =
    traduzirStatus(pedidoAberto.status).texto;

  // Dados do cliente
  document.getElementById('modal-cli-nome').textContent =
    pedidoAberto.clienteNome;
  document.getElementById('modal-cli-bi').textContent =
    cliente ? (cliente.bi || '—') : '—';
  document.getElementById('modal-cli-telefone').textContent =
    cliente ? (cliente.telefone || '—') : '—';
  document.getElementById('modal-cli-rendimento').textContent =
    cliente ? formatarMoeda(cliente.rendimentoMensal) + ' MT' : '—';
  document.getElementById('modal-cli-emprego').textContent =
    cliente ? traduzirTipoEmprego(cliente.tipoEmprego) : '—';
  document.getElementById('modal-cli-endereco').textContent =
    cliente ? (cliente.endereco || '—') : '—';

  // Dados do pedido
  document.getElementById('modal-emp-tipo').textContent    = pedidoAberto.tipoNome;
  document.getElementById('modal-emp-valor').textContent   = formatarMoeda(pedidoAberto.valor) + ' MT';
  document.getElementById('modal-emp-prazo').textContent   = pedidoAberto.prazo + ' meses';
  document.getElementById('modal-emp-parcela').textContent = formatarMoeda(pedidoAberto.valorParcela) + ' MT';
  document.getElementById('modal-emp-total').textContent   = formatarMoeda(pedidoAberto.valorTotal) + ' MT';
  document.getElementById('modal-emp-juros').textContent   = formatarMoeda(pedidoAberto.totalJuros) + ' MT';

  // Score de crédito
  if (cliente) {
    var score = calcularScore(
      cliente.rendimentoMensal,
      pedidoAberto.valor,
      pedidoAberto.prazo
    );
    document.getElementById('modal-score-num').textContent   = score.score;
    document.getElementById('modal-score-nivel').textContent = score.nivel;
    document.getElementById('modal-score-barra').style.width = score.score + '%';
    document.getElementById('modal-score-barra').className   =
      'progresso-barra ' + score.cor;

    var racio = Math.round(
      (pedidoAberto.valorParcela / cliente.rendimentoMensal) * 100
    );
    document.getElementById('modal-score-desc').textContent =
      'Prestação representa ' + racio + '% do rendimento mensal.';
  }

  // Observações do funcionário
  var obsContainer = document.getElementById('obs-funcionario-container');
  if (pedidoAberto.observacoesFuncionario) {
    obsContainer.style.display = 'flex';
    document.getElementById('obs-funcionario-texto').textContent =
      pedidoAberto.observacoesFuncionario;
  } else {
    obsContainer.style.display = 'none';
  }

  // Funcionário que encaminhou
  if (pedidoAberto.funcionarioNome) {
    document.getElementById('obs-funcionario-nome').textContent =
      'Observações de ' + pedidoAberto.funcionarioNome;
  }

  // Botões de decisão — desactiva se já foi decidido
  var jaDedicido =
    pedidoAberto.status === 'aprovado' ||
    pedidoAberto.status === 'rejeitado' ||
    pedidoAberto.status === 'ativo'     ||
    pedidoAberto.status === 'quitado';

  document.getElementById('btn-aprovar').disabled  = jaDedicido;
  document.getElementById('btn-rejeitar').disabled = jaDedicido;

  // Esconde o campo de motivo e o botão de confirmar rejeição
  document.getElementById('campo-motivo').classList.remove('visivel');
  document.getElementById('btn-confirmar-rejeicao').classList.remove('visivel');
  document.getElementById('motivo-rejeicao').value = '';

  document.getElementById('modal-overlay').classList.add('visivel');
}

function fecharModal() {
  document.getElementById('modal-overlay').classList.remove('visivel');
  pedidoAberto = null;
  modoRejeicao = false;
}

function traduzirTipoEmprego(tipo) {
  var mapa = {
    'publico':    'Funcionário Público',
    'privado':    'Funcionário Privado',
    'empresario': 'Empresário / Autónomo',
    'outro':      'Outro'
  };
  return mapa[tipo] || '—';
}


// ================================================================
// BLOCO 4: APROVAÇÃO
// ================================================================

function aprovarPedido() {
  if (!pedidoAberto) return;

  var btn = document.getElementById('btn-aprovar');
  btn.disabled = true;
  btn.innerHTML =
    '<i class="ti ti-loader-2 icone-girando"></i> A aprovar...';

  setTimeout(function() {

    atualizarEmprestimo(
      pedidoAberto.id,
      {
        status: 'ativo',
        gerenteId:   usuarioActual.id,
        gerenteNome: usuarioActual.nome,
        dataDecisao: new Date().toISOString()
      },
      'Crédito aprovado pelo Gerente',
      usuarioActual.nome
    );

    // Notifica o cliente
    criarNotificacao({
      para:        'cliente',
      titulo:      'O seu crédito foi aprovado!',
      mensagem:
        'O seu pedido de ' +
        formatarMoeda(pedidoAberto.valor) +
        ' MT foi aprovado. O valor será disponibilizado em breve.',
      emprestimoId: pedidoAberto.id,
      lida:         false
    });

    btn.innerHTML       = '<i class="ti ti-check"></i> Aprovado!';
    btn.style.background = 'var(--sucesso)';

    setTimeout(function() {
      fecharModal();
      carregarResumo();
      carregarTabela(document.getElementById('input-pesquisa').value);
      btn.style.background = '';
    }, 1000);

  }, 800);
}


// ================================================================
// BLOCO 5: REJEIÇÃO (com motivo obrigatório)
// ================================================================

// Primeiro clique: mostra o campo de motivo
function iniciarRejeicao() {
  modoRejeicao = true;
  document.getElementById('campo-motivo').classList.add('visivel');
  document.getElementById('btn-confirmar-rejeicao').classList.add('visivel');
  document.getElementById('motivo-rejeicao').focus();
}

// Segundo clique: confirma a rejeição com o motivo escrito
function confirmarRejeicao() {
  var motivo = document.getElementById('motivo-rejeicao').value.trim();

  if (!motivo || motivo.length < 10) {
    document.getElementById('motivo-rejeicao').focus();
    alert('Por favor escreva um motivo com pelo menos 10 caracteres.');
    return;
  }

  var btn = document.getElementById('btn-confirmar-rejeicao');
  btn.disabled = true;
  btn.innerHTML =
    '<i class="ti ti-loader-2 icone-girando"></i> A processar...';

  setTimeout(function() {

    atualizarEmprestimo(
      pedidoAberto.id,
      {
        status:          'rejeitado',
        motivoRejeicao:  motivo,
        gerenteId:       usuarioActual.id,
        gerenteNome:     usuarioActual.nome,
        dataDecisao:     new Date().toISOString()
      },
      'Pedido rejeitado: ' + motivo,
      usuarioActual.nome
    );

    // Notifica o cliente com o motivo
    criarNotificacao({
      para:        'cliente',
      titulo:      'Pedido de crédito rejeitado',
      mensagem:    'O seu pedido foi rejeitado. Motivo: ' + motivo,
      emprestimoId: pedidoAberto.id,
      lida:         false
    });

    btn.innerHTML       = '<i class="ti ti-check"></i> Rejeitado';
    btn.style.background = 'var(--texto-suave)';

    setTimeout(function() {
      fecharModal();
      carregarResumo();
      carregarTabela(document.getElementById('input-pesquisa').value);
    }, 800);

  }, 800);
}


// ================================================================
// BLOCO 6: FILTROS, PESQUISA E NOTIFICAÇÕES
// ================================================================

function iniciarFiltros() {
  var botoes = document.querySelectorAll('.filtro-btn');
  botoes.forEach(function(botao) {
    botao.addEventListener('click', function() {
      botoes.forEach(function(b) { b.classList.remove('activo'); });
      this.classList.add('activo');
      filtroActual = this.getAttribute('data-filtro');
      carregarTabela(document.getElementById('input-pesquisa').value);
    });
  });
}

function iniciarPesquisa() {
  var input = document.getElementById('input-pesquisa');
  if (input) {
    input.addEventListener('input', function() {
      carregarTabela(this.value);
    });
  }
}

function carregarNotificacoes() {
  var notifs   = getNotificacoes('gerente');
  var contador = document.getElementById('notif-contador');
  var lista    = document.getElementById('lista-notificacoes');

  if (notifs.length > 0) {
    contador.textContent = notifs.length;
    contador.classList.remove('escondido');
  } else {
    contador.classList.add('escondido');
  }

  if (notifs.length === 0) {
    lista.innerHTML =
      '<div class="notif-item">' +
        '<div class="notif-texto">Sem notificações novas.</div>' +
      '</div>';
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

function iniciarPainelNotificacoes() {
  var botao  = document.getElementById('btn-notificacoes');
  var painel = document.getElementById('painel-notificacoes');

  botao.addEventListener('click', function(e) {
    e.stopPropagation();
    painel.classList.toggle('visivel');
  });

  document.addEventListener('click', function(e) {
    if (!painel.contains(e.target) && e.target !== botao) {
      painel.classList.remove('visivel');
    }
  });
}


// ================================================================
// INICIALIZAÇÃO
// ================================================================

document.addEventListener('DOMContentLoaded', function() {

  usuarioActual = exigirPerfil(['gerente']);
  if (!usuarioActual) return;

  mostrarInfoUsuario(
    document.getElementById('nome-usuario'),
    document.getElementById('perfil-usuario')
  );

  var iniciais = usuarioActual.nome
    .split(' ')
    .map(function(p) { return p[0]; })
    .join('')
    .substring(0, 2)
    .toUpperCase();
  document.getElementById('avatar-iniciais').textContent = iniciais;

  carregarResumo();
  carregarTabela('');
  carregarNotificacoes();

  iniciarFiltros();
  iniciarPesquisa();
  iniciarPainelNotificacoes();
  configurarBotaoLogout('#btn-logout');

  document.getElementById('btn-fechar-modal')
    .addEventListener('click', fecharModal);
  document.getElementById('btn-aprovar')
    .addEventListener('click', aprovarPedido);
  document.getElementById('btn-rejeitar')
    .addEventListener('click', iniciarRejeicao);
  document.getElementById('btn-confirmar-rejeicao')
    .addEventListener('click', confirmarRejeicao);

  document.getElementById('modal-overlay')
    .addEventListener('click', function(e) {
      if (e.target === this) fecharModal();
    });
});