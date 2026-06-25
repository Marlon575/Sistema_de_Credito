// ================================================================
// js/admin.js
// Lógica do Dashboard do Administrador
// Depende de js/db.js e js/auth.js carregados antes
// ================================================================
// O admin pode:
//   - Ver resumo do sistema (totais)
//   - Criar utilizadores (funcionário, gerente, outro admin)
//   - Ver todos os utilizadores
//   - Desactivar/remover utilizadores
//   - Ver relatórios e estatísticas
// ================================================================


var usuarioActual    = null;
var perfilSeleccionado = 'funcionario';   // Perfil por omissão no modal
var utilizadorParaRemover = null;         // Guarda o utilizador a remover


// ================================================================
// BLOCO 1: RESUMO DO TOPO
// ================================================================

function carregarResumo() {
  var usuarios     = getUsuarios();
  var emprestimos  = getEmprestimos();

  var totalUsers   = usuarios.filter(function(u) { return u.ativo; }).length;
  var totalClientes= usuarios.filter(function(u) {
    return u.perfil === 'cliente' && u.ativo;
  }).length;
  var totalPedidos = emprestimos.length;
  var valorTotal   = emprestimos
    .filter(function(e) {
      return e.status === 'ativo' || e.status === 'aprovado';
    })
    .reduce(function(soma, e) { return soma + parseFloat(e.valor); }, 0);

  document.getElementById('resumo-users').textContent    = totalUsers;
  document.getElementById('resumo-clientes').textContent = totalClientes;
  document.getElementById('resumo-pedidos').textContent  = totalPedidos;
  document.getElementById('resumo-volume').textContent   =
    formatarMoeda(valorTotal) + ' MT';
}


// ================================================================
// BLOCO 2: LISTA DE UTILIZADORES
// ================================================================

function carregarUtilizadores() {
  var container = document.getElementById('lista-utilizadores');
  var usuarios  = getUsuarios();

  // Ordena: primeiro os activos, depois os inactivos
  usuarios.sort(function(a, b) {
    if (a.ativo && !b.ativo) return -1;
    if (!a.ativo && b.ativo) return 1;
    return 0;
  });

  container.innerHTML = '';

  usuarios.forEach(function(usuario) {
    var card = criarCardUtilizador(usuario);
    container.appendChild(card);
  });
}

// Cria o card HTML de um utilizador
function criarCardUtilizador(usuario) {
  var card = document.createElement('div');
  card.className = 'utilizador-card' + (usuario.ativo ? '' : ' inactivo');

  var iniciais = usuario.nome
    .split(' ')
    .map(function(p) { return p[0]; })
    .join('')
    .substring(0, 2)
    .toUpperCase();

  var perfilNomes = {
    'admin':       'Administrador',
    'funcionario': 'Funcionário',
    'gerente':     'Gerente',
    'cliente':     'Cliente'
  };

  var badgeClasses = {
    'admin':       'badge-admin',
    'funcionario': 'badge-analise',
    'gerente':     'badge-aprovado',
    'cliente':     'badge-pendente'
  };

  card.innerHTML =
    '<div class="utilizador-topo">' +
      '<div class="utilizador-avatar ' + usuario.perfil + '">' + iniciais + '</div>' +
      '<div style="flex:1">' +
        '<div class="utilizador-nome">' + usuario.nome + '</div>' +
        '<div class="utilizador-email">' + usuario.email + '</div>' +
      '</div>' +
      '<span class="badge ' + (badgeClasses[usuario.perfil] || 'badge-pendente') + '">' +
        (perfilNomes[usuario.perfil] || usuario.perfil) +
      '</span>' +
    '</div>' +

    '<div class="utilizador-meta">' +
      '<i class="ti ti-calendar"></i>' +
      'Criado em ' + formatarData(usuario.dataCriacao) +
    '</div>' +

    (usuario.rendimentoMensal ?
      '<div class="utilizador-meta">' +
        '<i class="ti ti-coin"></i>' +
        'Rendimento: ' + formatarMoeda(usuario.rendimentoMensal) + ' MT' +
      '</div>'
      : ''
    ) +

    '<div class="utilizador-acoes">' +
      (usuario.ativo ?
        '<button class="btn btn-perigo btn-sm btn-desativar" data-id="' + usuario.id + '">' +
          '<i class="ti ti-user-off"></i> Desactivar' +
        '</button>'
        :
        '<button class="btn btn-sucesso btn-sm btn-ativar" data-id="' + usuario.id + '">' +
          '<i class="ti ti-user-check"></i> Reactivar' +
        '</button>'
      ) +
    '</div>';

  // Liga os botões de desactivar/activar
  var btnDesativar = card.querySelector('.btn-desativar');
  var btnAtivar    = card.querySelector('.btn-ativar');

  if (btnDesativar) {
    btnDesativar.addEventListener('click', function() {
      utilizadorParaRemover = usuario;
      abrirModalConfirmar(usuario);
    });
  }

  if (btnAtivar) {
    btnAtivar.addEventListener('click', function() {
      atualizarUsuario(usuario.id, { ativo: true });
      carregarUtilizadores();
      carregarResumo();
    });
  }

  return card;
}


// ================================================================
// BLOCO 3: CRIAR UTILIZADOR
// ================================================================

function abrirModalCriar() {
  // Limpa o formulário
  document.getElementById('criar-nome').value  = '';
  document.getElementById('criar-email').value = '';
  document.getElementById('criar-senha').value = '';

  // Reseta a selecção de perfil para "funcionario"
  perfilSeleccionado = 'funcionario';
  document.querySelectorAll('.perfil-opcao').forEach(function(op) {
    op.classList.remove('seleccionado');
  });
  document.querySelector('.perfil-opcao[data-perfil="funcionario"]')
    .classList.add('seleccionado');

  esconderAlertaAdmin();
  document.getElementById('modal-criar').classList.add('visivel');
}

function fecharModalCriar() {
  document.getElementById('modal-criar').classList.remove('visivel');
}

function submeterCriarUtilizador() {
  var nome  = document.getElementById('criar-nome').value.trim();
  var email = document.getElementById('criar-email').value.trim();
  var senha = document.getElementById('criar-senha').value;

  esconderAlertaAdmin();

  // Validações básicas
  if (!nome || nome.length < 3) {
    mostrarAlertaAdmin('Nome deve ter pelo menos 3 caracteres.', 'erro');
    return;
  }

  var formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !formatoEmail.test(email)) {
    mostrarAlertaAdmin('Email inválido.', 'erro');
    return;
  }

  if (!senha || senha.length < 6) {
    mostrarAlertaAdmin('A senha deve ter pelo menos 6 caracteres.', 'erro');
    return;
  }

  // Verifica se o email já está em uso
  if (getUsuarioPorEmail(email)) {
    mostrarAlertaAdmin('Este email já está registado no sistema.', 'erro');
    return;
  }

  // Cria o utilizador
  criarUsuario({
    nome:   nome,
    email:  email.toLowerCase(),
    senha:  senha,
    perfil: perfilSeleccionado
  });

  mostrarAlertaAdmin('Utilizador criado com sucesso!', 'sucesso');

  // Fecha o modal e recarrega após 1 segundo
  setTimeout(function() {
    fecharModalCriar();
    carregarUtilizadores();
    carregarResumo();
  }, 1000);
}


// ================================================================
// BLOCO 4: CONFIRMAR REMOÇÃO
// ================================================================

function abrirModalConfirmar(usuario) {
  document.getElementById('confirmar-nome').textContent = usuario.nome;
  document.getElementById('modal-confirmar').classList.add('visivel');
}

function fecharModalConfirmar() {
  document.getElementById('modal-confirmar').classList.remove('visivel');
  utilizadorParaRemover = null;
}

function confirmarDesativar() {
  if (!utilizadorParaRemover) return;

  // Não permite desactivar o próprio utilizador logado
  if (utilizadorParaRemover.id === usuarioActual.id) {
    fecharModalConfirmar();
    alert('Não pode desactivar a sua própria conta.');
    return;
  }

  desativarUsuario(utilizadorParaRemover.id);

  fecharModalConfirmar();
  carregarUtilizadores();
  carregarResumo();
}


// ================================================================
// BLOCO 5: RELATÓRIOS
// ================================================================

function carregarRelatorios() {
  var emprestimos = getEmprestimos();
  var usuarios    = getUsuarios();

  // Relatório 1: Pedidos por status
  var statusCounts = {
    pendente:   0,
    em_analise: 0,
    aprovado:   0,
    rejeitado:  0,
    ativo:      0,
    quitado:    0
  };

  emprestimos.forEach(function(e) {
    if (statusCounts.hasOwnProperty(e.status)) {
      statusCounts[e.status]++;
    }
  });

  document.getElementById('rel-pendente').textContent   = statusCounts.pendente;
  document.getElementById('rel-analise').textContent    = statusCounts.em_analise;
  document.getElementById('rel-aprovado').textContent   = statusCounts.aprovado;
  document.getElementById('rel-rejeitado').textContent  = statusCounts.rejeitado;
  document.getElementById('rel-ativo').textContent      = statusCounts.ativo;
  document.getElementById('rel-quitado').textContent    = statusCounts.quitado;

  // Relatório 2: Volume por tipo de crédito
  var tipos = getTiposEmprestimo();
  var containerTipos = document.getElementById('rel-tipos');
  containerTipos.innerHTML = '';

  tipos.forEach(function(tipo) {
    var pedidosTipo = emprestimos.filter(function(e) {
      return e.tipoId === tipo.id;
    });
    var volumeTipo = pedidosTipo.reduce(function(soma, e) {
      return soma + parseFloat(e.valor);
    }, 0);

    var div = document.createElement('div');
    div.className = 'relatorio-linha';
    div.innerHTML =
      '<span class="relatorio-linha-label">' + tipo.nome + '</span>' +
      '<div style="text-align:right">' +
        '<div class="relatorio-linha-valor">' +
          pedidosTipo.length + ' pedidos' +
        '</div>' +
        '<div style="font-size:0.75rem; color:var(--texto-suave)">' +
          formatarMoeda(volumeTipo) + ' MT' +
        '</div>' +
      '</div>';
    containerTipos.appendChild(div);
  });

  // Relatório 3: Utilizadores por perfil
  var perfis = ['admin', 'gerente', 'funcionario', 'cliente'];
  var perfilNomes = {
    'admin':       'Administradores',
    'gerente':     'Gerentes',
    'funcionario': 'Funcionários',
    'cliente':     'Clientes'
  };

  var containerPerfis = document.getElementById('rel-perfis');
  containerPerfis.innerHTML = '';

  perfis.forEach(function(perfil) {
    var count = usuarios.filter(function(u) {
      return u.perfil === perfil && u.ativo;
    }).length;

    var div = document.createElement('div');
    div.className = 'relatorio-linha';
    div.innerHTML =
      '<span class="relatorio-linha-label">' +
        (perfilNomes[perfil] || perfil) +
      '</span>' +
      '<span class="relatorio-linha-valor">' + count + '</span>';
    containerPerfis.appendChild(div);
  });
}


// ================================================================
// BLOCO 6: ABAS
// ================================================================

function iniciarAbas() {
  var abas = document.querySelectorAll('.admin-aba');

  abas.forEach(function(aba) {
    aba.addEventListener('click', function() {
      abas.forEach(function(a) { a.classList.remove('activa'); });
      document.querySelectorAll('.admin-painel').forEach(function(p) {
        p.classList.remove('activo');
      });

      this.classList.add('activa');
      var painelId = this.getAttribute('data-painel');
      var painel   = document.getElementById(painelId);
      if (painel) painel.classList.add('activo');

      // Carrega os relatórios ao mudar para essa aba
      if (painelId === 'painel-relatorios') {
        carregarRelatorios();
      }
    });
  });
}


// ================================================================
// BLOCO 7: MENSAGENS DE ALERTA
// ================================================================

function mostrarAlertaAdmin(mensagem, tipo) {
  var alerta = document.getElementById('alerta-modal');
  if (!alerta) return;

  alerta.className = '';
  alerta.style.display  = 'block';
  alerta.style.padding  = '10px 14px';
  alerta.style.borderRadius = '8px';
  alerta.style.fontSize = '0.85rem';
  alerta.style.marginBottom = '16px';
  alerta.style.fontWeight = '500';

  if (tipo === 'erro') {
    alerta.style.background = 'var(--perigo-clara)';
    alerta.style.color      = 'var(--perigo)';
  } else {
    alerta.style.background = 'var(--sucesso-clara)';
    alerta.style.color      = 'var(--sucesso)';
  }

  alerta.textContent = mensagem;
}

function esconderAlertaAdmin() {
  var alerta = document.getElementById('alerta-modal');
  if (alerta) alerta.style.display = 'none';
}


// ================================================================
// INICIALIZAÇÃO
// ================================================================

document.addEventListener('DOMContentLoaded', function() {

  usuarioActual = exigirPerfil(['admin']);
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
  carregarUtilizadores();

  iniciarAbas();
  configurarBotaoLogout('#btn-logout');

  // Modal de criar utilizador
  document.getElementById('btn-criar-usuario')
    .addEventListener('click', abrirModalCriar);
  document.getElementById('btn-fechar-criar')
    .addEventListener('click', fecharModalCriar);
  document.getElementById('btn-submeter-criar')
    .addEventListener('click', submeterCriarUtilizador);

  // Modal de confirmar remoção
  document.getElementById('btn-fechar-confirmar')
    .addEventListener('click', fecharModalConfirmar);
  document.getElementById('btn-cancelar-remocao')
    .addEventListener('click', fecharModalConfirmar);
  document.getElementById('btn-confirmar-desativar')
    .addEventListener('click', confirmarDesativar);

  // Selecção de perfil no modal de criar
  document.querySelectorAll('.perfil-opcao').forEach(function(opcao) {
    opcao.addEventListener('click', function() {
      document.querySelectorAll('.perfil-opcao').forEach(function(o) {
        o.classList.remove('seleccionado');
      });
      this.classList.add('seleccionado');
      perfilSeleccionado = this.getAttribute('data-perfil');
    });
  });

  // Fecha modais ao clicar no overlay
  document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.remove('visivel');
      }
    });
  });
});