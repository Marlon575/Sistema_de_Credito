// ================================================================
// js/funcionario.js
// Lógica do Dashboard do Funcionário
// Depende de js/db.js e js/auth.js carregados antes
// ================================================================
// O funcionário pode:
//   - Ver todos os pedidos com status "pendente"
//   - Analisar os dados do cliente e do pedido
//   - Escrever observações
//   - Encaminhar para o Gerente (muda status para "em_analise")
//   - NÃO pode rejeitar pedidos
// ================================================================


// ----------------------------------------------------------------
// VARIÁVEIS GLOBAIS
// ----------------------------------------------------------------
var usuarioActual  = null;
var filtroActual   = 'pendente';   // Começa a mostrar os pendentes
var pedidoAberto   = null;         // Pedido actualmente no modal


// ================================================================
// BLOCO 1: RESUMO DO TOPO
// ================================================================

function carregarResumo() {
  var todos       = getEmprestimos();
  var pendentes   = todos.filter(function(e) { return e.status === 'pendente'; }).length;
  var emAnalise   = todos.filter(function(e) { return e.status === 'em_analise'; }).length;
  var aprovados   = todos.filter(function(e) { return e.status === 'aprovado'; }).length;
  var total       = todos.length;

  document.getElementById('resumo-pendentes').textContent  = pendentes;
  document.getElementById('resumo-em-analise').textContent = emAnalise;
  document.getElementById('resumo-aprovados').textContent  = aprovados;
  document.getElementById('resumo-total').textContent      = total;
}


// ================================================================
// BLOCO 2: TABELA DE PEDIDOS
// ================================================================

function carregarTabela(termoPesquisa) {
  var tbody = document.getElementById('tabela-corpo');
  var todos = getEmprestimos();

  // Aplica filtro de status
  var lista = todos.filter(function(e) {
    if (filtroActual === 'todos') return true;
    return e.status === filtroActual;
  });

  // Aplica pesquisa por nome ou ID se houver termo
  if (termoPesquisa && termoPesquisa.trim().length > 0) {
    var termo = termoPesquisa.trim().toLowerCase();
    lista = lista.filter(function(e) {
      return (
        e.clienteNome.toLowerCase().includes(termo) ||
        String(e.id).includes(termo)
      );
    });
  }

  // Ordena do mais recente para o mais antigo
  lista.sort(function(a, b) {
    return new Date(b.dataPedido) - new Date(a.dataPedido);
  });

  // Mostra estado vazio se não houver resultados
  if (lista.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7">' +
        '<div class="tabela-vazia">' +
          '<i class="ti ti-inbox"></i>' +
          '<p>Nenhum pedido encontrado.</p>' +
        '</div>' +
      '</td></tr>';
    return;
  }

  // Limpa e preenche a tabela
  tbody.innerHTML = '';

  lista.forEach(function(pedido) {
    var tr = document.createElement('tr');
    tr.className = 'linha-pedido';

    // Obtém as iniciais do cliente para o avatar
    var iniciais = pedido.clienteNome
      .split(' ')
      .map(function(p) { return p[0]; })
      .join('')
      .substring(0, 2)
      .toUpperCase();

    var statusInfo = traduzirStatus(pedido.status);

    tr.innerHTML =
      '<td>' +
        '<span style="font-family:var(--fonte-mono); font-size:0.8rem; color:var(--texto-suave)">' +
          '#' + String(pedido.id).padStart(5, '0') +
        '</span>' +
      '</td>' +
      '<td>' +
        '<div class="cliente-info">' +
          '<div class="cliente-avatar">' + iniciais + '</div>' +
          '<div>' +
            '<div class="cliente-nome">' + pedido.clienteNome + '</div>' +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td>' + pedido.tipoNome + '</td>' +
      '<td style="font-family:var(--fonte-mono); font-weight:600">' +
        formatarMoeda(pedido.valor) + ' MT' +
      '</td>' +
      '<td>' + pedido.prazo + ' meses</td>' +
      '<td><span class="badge ' + statusInfo.classe + '">' + statusInfo.texto + '</span></td>' +
      '<td>' + formatarData(pedido.dataPedido) + '</td>';

    // Ao clicar numa linha, abre o modal de análise
    tr.addEventListener('click', function() {
      abrirModalAnalise(pedido.id);
    });

    tbody.appendChild(tr);
  });
}

// Traduz o status técnico para texto e classe CSS
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
// BLOCO 3: MODAL DE ANÁLISE
// ================================================================

function abrirModalAnalise(pedidoId) {
  pedidoAberto = getEmprestimos().find(function(e) { return e.id === pedidoId; });
  if (!pedidoAberto) return;

  // Busca os dados do cliente
  var cliente = getUsuarioPorId(pedidoAberto.clienteId);

  // Preenche o cabeçalho do modal
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

  // Dados do empréstimo
  document.getElementById('modal-emp-tipo').textContent =
    pedidoAberto.tipoNome;
  document.getElementById('modal-emp-valor').textContent =
    formatarMoeda(pedidoAberto.valor) + ' MT';
  document.getElementById('modal-emp-prazo').textContent =
    pedidoAberto.prazo + ' meses';
  document.getElementById('modal-emp-parcela').textContent =
    formatarMoeda(pedidoAberto.valorParcela) + ' MT';
  document.getElementById('modal-emp-total').textContent =
    formatarMoeda(pedidoAberto.valorTotal) + ' MT';
  document.getElementById('modal-emp-juros').textContent =
    formatarMoeda(pedidoAberto.totalJuros) + ' MT';

  // Score de crédito
  if (cliente) {
    var score = calcularScore(
      cliente.rendimentoMensal,
      pedidoAberto.valor,
      pedidoAberto.prazo
    );
    document.getElementById('modal-score-num').textContent = score.score;
    document.getElementById('modal-score-nivel').textContent = score.nivel;
    document.getElementById('modal-score-barra').style.width = score.score + '%';
    document.getElementById('modal-score-barra').className =
      'progresso-barra ' + score.cor;

    // Descrição do score
    var racioPercent = Math.round(
      (pedidoAberto.valorParcela / cliente.rendimentoMensal) * 100
    );
    document.getElementById('modal-score-desc').textContent =
      'Prestação representa ' + racioPercent + '% do rendimento mensal.';
  }

  // Documentos anexados
  var containerDocs = document.getElementById('modal-documentos');
  containerDocs.innerHTML = '';

  if (pedidoAberto.documentos) {
    var nomesDocs = {
      bi:         'Bilhete de Identidade',
      rendimento: 'Comprovativo de Rendimento',
      extracto:   'Extracto Bancário',
      residencia: 'Comprovativo de Residência'
    };

    Object.keys(pedidoAberto.documentos).forEach(function(chave) {
      if (pedidoAberto.documentos[chave]) {
        var div = document.createElement('div');
        div.className = 'doc-item';
        div.innerHTML =
          '<i class="ti ti-file-check"></i>' +
          '<div>' +
            '<div style="font-weight:600; font-size:0.82rem">' +
              (nomesDocs[chave] || chave) +
            '</div>' +
            '<div style="font-size:0.72rem; color:var(--texto-suave)">' +
              pedidoAberto.documentos[chave] +
            '</div>' +
          '</div>';
        containerDocs.appendChild(div);
      }
    });
  } else {
    containerDocs.innerHTML =
      '<p style="font-size:0.82rem; color:var(--texto-suave)">Nenhum documento anexado.</p>';
  }

  // Mostra ou esconde o botão de encaminhar
  // Só pode encaminhar se o status for "pendente"
  var btnEncaminhar = document.getElementById('btn-encaminhar');
  if (pedidoAberto.status === 'pendente') {
    btnEncaminhar.disabled = false;
    btnEncaminhar.innerHTML =
      '<i class="ti ti-send"></i> Encaminhar para o Gerente';
  } else {
    btnEncaminhar.disabled = true;
    btnEncaminhar.innerHTML =
      '<i class="ti ti-check"></i> Já encaminhado';
  }

  // Limpa as observações anteriores
  document.getElementById('campo-observacoes').value = '';

  // Abre o modal
  document.getElementById('modal-overlay').classList.add('visivel');
}

function fecharModal() {
  document.getElementById('modal-overlay').classList.remove('visivel');
  pedidoAberto = null;
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
// BLOCO 4: ENCAMINHAR PARA O GERENTE
// ================================================================

function encaminharParaGerente() {
  if (!pedidoAberto) return;

  var observacoes = document.getElementById('campo-observacoes').value.trim();

  var btn = document.getElementById('btn-encaminhar');
  btn.disabled = true;
  btn.innerHTML =
    '<i class="ti ti-loader-2 icone-girando"></i> A encaminhar...';

  setTimeout(function() {

    // Actualiza o status do empréstimo para "em_analise"
    atualizarEmprestimo(
      pedidoAberto.id,
      {
        status: 'em_analise',
        observacoesFuncionario: observacoes,
        funcionarioId: usuarioActual.id,
        funcionarioNome: usuarioActual.nome
      },
      'Pedido analisado e encaminhado para o Gerente' +
        (observacoes ? ': ' + observacoes : ''),
      usuarioActual.nome
    );

    // Cria notificação para o gerente
    criarNotificacao({
      para: 'gerente',
      titulo: 'Novo pedido para aprovação',
      mensagem:
        pedidoAberto.clienteNome + ' — ' +
        formatarMoeda(pedidoAberto.valor) + ' MT (' +
        pedidoAberto.tipoNome + ')',
      emprestimoId: pedidoAberto.id,
      lida: false
    });

    // Actualiza a interface
    btn.innerHTML = '<i class="ti ti-check"></i> Encaminhado com Sucesso!';
    btn.style.background = 'var(--sucesso)';

    // Fecha o modal e recarrega os dados após 1 segundo
    setTimeout(function() {
      fecharModal();
      carregarResumo();
      carregarTabela(
        document.getElementById('input-pesquisa').value
      );
      btn.style.background = '';
    }, 1000);

  }, 800);
}


// ================================================================
// BLOCO 5: FILTROS E PESQUISA
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
  if (!input) return;

  // Pesquisa em tempo real enquanto o utilizador escreve
  input.addEventListener('input', function() {
    carregarTabela(this.value);
  });
}


// ================================================================
// BLOCO 6: NOTIFICAÇÕES
// ================================================================

function carregarNotificacoes() {
  var notifs   = getNotificacoes('funcionario');
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

  // Protege a página: só funcionários
  usuarioActual = exigirPerfil(['funcionario']);
  if (!usuarioActual) return;

  // Info do utilizador na sidebar
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

  // Carrega os dados
  carregarResumo();
  carregarTabela('');
  carregarNotificacoes();

  // Liga os módulos
  iniciarFiltros();
  iniciarPesquisa();
  iniciarPainelNotificacoes();
  configurarBotaoLogout('#btn-logout');

  // Liga os botões do modal
  document.getElementById('btn-fechar-modal')
    .addEventListener('click', fecharModal);

  document.getElementById('btn-encaminhar')
    .addEventListener('click', encaminharParaGerente);

  document.getElementById('modal-overlay')
    .addEventListener('click', function(e) {
      if (e.target === this) fecharModal();
    });
});