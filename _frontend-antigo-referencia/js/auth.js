// ================================================================
// js/auth.js — AUTENTICAÇÃO E CONTROLO DE SESSÃO
// ================================================================
// Este ficheiro é responsável por:
// 1. Fazer login (verificar email e senha)
// 2. Fazer logout (limpar a sessão)
// 3. Guardar quem está logado (sessão activa)
// 4. Proteger páginas (redirecionar se não tiver acesso)
// ================================================================
// IMPORTANTE: Este ficheiro deve ser carregado DEPOIS do db.js
// em todas as páginas HTML.
// ================================================================


// ----------------------------------------------------------------
// SECÇÃO 1: SESSÃO
// ----------------------------------------------------------------
// A "sessão" é um objecto guardado no sessionStorage que diz
// quem está logado neste momento.
// Diferença do localStorage:
//   - localStorage: dados ficam mesmo depois de fechar o navegador
//   - sessionStorage: dados apagam-se quando fecha o separador/navegador
// Isto é mais seguro para dados de login.

// Guarda o utilizador logado na sessão.
function guardarSessao(usuario) {
  // Não guardamos a senha na sessão por segurança.
  // O operador "delete" remove uma propriedade de um objecto.
  const sessaoSegura = { ...usuario }; // Copia o objecto
  delete sessaoSegura.senha;           // Remove a senha da cópia
  sessionStorage.setItem('sessao', JSON.stringify(sessaoSegura));
}

// Lê quem está logado actualmente.
function getSessao() {
  return JSON.parse(sessionStorage.getItem('sessao'));
}

// Verifica se há alguém logado.
// Retorna true (sim) ou false (não).
function estaLogado() {
  return getSessao() !== null;
}

// Apaga a sessão (logout).
function limparSessao() {
  sessionStorage.removeItem('sessao');
}


// ----------------------------------------------------------------
// SECÇÃO 2: LOGIN
// ----------------------------------------------------------------

// Tenta fazer login com email e senha.
// Retorna um objecto com { sucesso: true/false, mensagem, usuario }
function fazerLogin(email, senha) {

  // Validação básica: verifica se os campos não estão vazios.
  if (!email || !senha) {
    return { sucesso: false, mensagem: 'Por favor preencha todos os campos.' };
  }

  // Busca o utilizador com este email na base de dados.
  const usuario = getUsuarioPorEmail(email.trim().toLowerCase());

  // Se não encontrou nenhum utilizador com este email:
  if (!usuario) {
    return { sucesso: false, mensagem: 'Email ou senha incorrectos.' };
  }

  // Verifica se a senha está correcta.
  if (usuario.senha !== senha) {
    return { sucesso: false, mensagem: 'Email ou senha incorrectos.' };
  }

  // Verifica se a conta está activa.
  if (!usuario.ativo) {
    return { sucesso: false, mensagem: 'Esta conta foi desactivada. Contacte o administrador.' };
  }

  // Login bem sucedido: guarda a sessão.
  guardarSessao(usuario);

  return { sucesso: true, usuario };
}


// ----------------------------------------------------------------
// SECÇÃO 3: LOGOUT
// ----------------------------------------------------------------

function fazerLogout() {
  limparSessao();
  // Redireciona para a página de login.
  window.location.href = '/login.html';
}


// ----------------------------------------------------------------
// SECÇÃO 4: PROTECÇÃO DE PÁGINAS
// ----------------------------------------------------------------
// Estas funções são chamadas no início de cada página protegida.
// Se o utilizador não tiver permissão, é redirecionado.

// Verifica se o utilizador está logado.
// Se não estiver, manda para o login.
function exigirLogin() {
  if (!estaLogado()) {
    window.location.href = '/login.html';
    return null;
  }
  return getSessao();
}

// Verifica se o utilizador tem o perfil certo para esta página.
// "perfisPermitidos" é um array com os perfis que podem aceder.
// Ex: exigirPerfil(['admin']) — só o admin pode entrar
// Ex: exigirPerfil(['gerente', 'admin']) — gerente ou admin podem entrar
function exigirPerfil(perfisPermitidos) {
  const usuario = exigirLogin(); // Primeiro verifica se está logado

  if (!usuario) return null; // Se não está logado, já foi redirecionado

  // Verifica se o perfil do utilizador está na lista de permitidos.
  // "includes()" retorna true se o elemento estiver no array.
  if (!perfisPermitidos.includes(usuario.perfil)) {

    // Não tem permissão: redireciona para a página correcta do seu perfil.
    redirecionarParaPerfil(usuario.perfil);
    return null;
  }

  return usuario;
}

// Redireciona o utilizador para a página correcta do seu perfil.
function redirecionarParaPerfil(perfil) {
  const rotas = {
    'cliente':     '/cliente/dashboard.html',
    'funcionario': '/funcionario/dashboard.html',
    'gerente':     '/gerente/dashboard.html',
    'admin':       '/admin/dashboard.html'
  };

  // Vai para a rota do perfil, ou para o login se o perfil não existir.
  window.location.href = rotas[perfil] || '/login.html';
}


// ----------------------------------------------------------------
// SECÇÃO 5: REGISTO DE NOVO CLIENTE
// ----------------------------------------------------------------

// Cria uma nova conta de cliente (chamado na página registro.html).
function registarCliente(dados) {

  // Verifica se o email já está em uso.
  const existente = getUsuarioPorEmail(dados.email.trim().toLowerCase());
  if (existente) {
    return { sucesso: false, mensagem: 'Este email já está registado.' };
  }

  // Validações dos campos obrigatórios.
  if (!dados.nome || dados.nome.trim().length < 3) {
    return { sucesso: false, mensagem: 'Nome deve ter pelo menos 3 caracteres.' };
  }

  if (!dados.bi || dados.bi.trim().length < 8) {
    return { sucesso: false, mensagem: 'Número de BI inválido.' };
  }

  if (!dados.telefone) {
    return { sucesso: false, mensagem: 'Telefone é obrigatório.' };
  }

  if (!dados.rendimentoMensal || parseFloat(dados.rendimentoMensal) <= 0) {
    return { sucesso: false, mensagem: 'Rendimento mensal inválido.' };
  }

  if (dados.senha.length < 6) {
    return { sucesso: false, mensagem: 'A senha deve ter pelo menos 6 caracteres.' };
  }

  if (dados.senha !== dados.confirmarSenha) {
    return { sucesso: false, mensagem: 'As senhas não coincidem.' };
  }

  // Cria o utilizador com perfil de cliente.
  const novoUsuario = criarUsuario({
    nome: dados.nome.trim(),
    email: dados.email.trim().toLowerCase(),
    senha: dados.senha,
    perfil: 'cliente',
    bi: dados.bi.trim(),
    telefone: dados.telefone.trim(),
    endereco: dados.endereco ? dados.endereco.trim() : '',
    rendimentoMensal: parseFloat(dados.rendimentoMensal),
    emprego: dados.emprego ? dados.emprego.trim() : '',
    tipoEmprego: dados.tipoEmprego || 'privado'
  });

  // Faz login automático após o registo.
  guardarSessao(novoUsuario);

  return { sucesso: true, usuario: novoUsuario };
}


// ----------------------------------------------------------------
// SECÇÃO 6: UTILITÁRIOS DE INTERFACE
// ----------------------------------------------------------------

// Mostra o nome e perfil do utilizador no cabeçalho da página.
// Chama esta função em cada página após o login.
function mostrarInfoUsuario(elementoNome, elementoPerfil) {
  const usuario = getSessao();
  if (!usuario) return;

  // Traduz o perfil para português legível.
  const perfisNomes = {
    'cliente':     'Cliente',
    'funcionario': 'Funcionário',
    'gerente':     'Gerente de Relacionamento',
    'admin':       'Administrador'
  };

  // Actualiza o texto dos elementos HTML se existirem.
  if (elementoNome) elementoNome.textContent = usuario.nome;
  if (elementoPerfil) elementoPerfil.textContent = perfisNomes[usuario.perfil] || usuario.perfil;
}

// Adiciona o listener ao botão de logout.
// "selector" é o id ou classe do botão, ex: '#btn-logout'
function configurarBotaoLogout(selector) {
  const botao = document.querySelector(selector);
  if (botao) {
    // "addEventListener" diz ao botão: "quando clicarem em ti, executa fazerLogout"
    botao.addEventListener('click', fazerLogout);
  }
}

// Mostra uma mensagem de erro ou sucesso num elemento HTML.
// "tipo" pode ser: 'erro', 'sucesso', 'aviso'
function mostrarMensagem(elementoId, texto, tipo) {
  const el = document.getElementById(elementoId);
  if (!el) return;

  // Define a cor conforme o tipo de mensagem.
  const cores = {
    erro:    'var(--color-background-danger)',
    sucesso: 'var(--color-background-success)',
    aviso:   'var(--color-background-warning)'
  };

  const coresTexto = {
    erro:    'var(--color-text-danger)',
    sucesso: 'var(--color-text-success)',
    aviso:   'var(--color-text-warning)'
  };

  el.style.display = 'block';
  el.style.padding = '12px 16px';
  el.style.borderRadius = '8px';
  el.style.fontSize = '14px';
  el.style.background = cores[tipo] || cores.aviso;
  el.style.color = coresTexto[tipo] || coresTexto.aviso;
  el.textContent = texto;

  // Esconde a mensagem automaticamente após 5 segundos.
  // "setTimeout" executa uma função após X milissegundos.
  setTimeout(() => { el.style.display = 'none'; }, 5000);
}