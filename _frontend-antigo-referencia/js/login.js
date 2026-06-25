// ================================================================
// js/login.js
// Lógica da página de login
// Depende de js/db.js e js/auth.js carregados antes
// ================================================================


// ----------------------------------------------------------------
// CREDENCIAIS DE DEMONSTRAÇÃO
// Usadas para preencher automaticamente o formulário nos testes
// ----------------------------------------------------------------
var credenciaisDemo = [
  {
    perfil: 'Admin',
    email: 'admin@credito.co.mz',
    senha: 'admin123'
  },
  {
    perfil: 'Funcionário',
    email: 'funcionario@credito.co.mz',
    senha: 'func123'
  },
  {
    perfil: 'Gerente',
    email: 'gerente@credito.co.mz',
    senha: 'ger123'
  },
  {
    perfil: 'Cliente',
    email: 'cliente@demo.com',
    senha: 'cli123'
  }
];


// ----------------------------------------------------------------
// FUNÇÃO: preencherCredencial
// Preenche o formulário automaticamente ao clicar num botão demo
// Parâmetros:
//   email — email da credencial de demonstração
//   senha — senha da credencial de demonstração
// ----------------------------------------------------------------
function preencherCredencial(email, senha) {
  document.getElementById('login-email').value = email;
  document.getElementById('login-senha').value = senha;

  // Remove os estilos de erro se existirem
  document.getElementById('login-email').classList.remove('erro');
  document.getElementById('login-senha').classList.remove('erro');

  // Esconde o alerta de erro se estiver visível
  esconderAlerta();

  // Foca no botão de submit para o utilizador ver que está pronto
  document.getElementById('btn-login').focus();
}


// ----------------------------------------------------------------
// FUNÇÃO: mostrarAlerta
// Mostra uma mensagem de erro ou sucesso no formulário
// ----------------------------------------------------------------
function mostrarAlerta(mensagem, tipo) {
  var alerta = document.getElementById('login-alerta');
  if (!alerta) return;

  // Remove classes anteriores
  alerta.className = 'auth-alerta';

  // Define o ícone conforme o tipo
  var icone = tipo === 'erro' ? 'ti-alert-circle' : 'ti-check';

  // Define o HTML do alerta com ícone e mensagem
  alerta.innerHTML = '<i class="ti ' + icone + '"></i>' + mensagem;

  // Adiciona a classe do tipo (erro ou sucesso) e mostra
  alerta.classList.add(tipo);
}

// Esconde o alerta
function esconderAlerta() {
  var alerta = document.getElementById('login-alerta');
  if (alerta) alerta.className = 'auth-alerta';
}


// ----------------------------------------------------------------
// FUNÇÃO: toggleSenha
// Alterna entre mostrar e esconder a senha no input
// ----------------------------------------------------------------
function toggleSenha() {
  var input  = document.getElementById('login-senha');
  var botao  = document.getElementById('btn-mostrar-senha');
  var icone  = botao.querySelector('i');

  if (input.type === 'password') {
    // Mostra a senha
    input.type = 'text';
    icone.className = 'ti ti-eye-off'; /* Ícone de "esconder" */
  } else {
    // Esconde a senha
    input.type = 'password';
    icone.className = 'ti ti-eye';     /* Ícone de "mostrar" */
  }
}


// ----------------------------------------------------------------
// FUNÇÃO: submeterLogin
// Executada quando o utilizador clica em "Entrar"
// ----------------------------------------------------------------
function submeterLogin(evento) {

  // Impede o formulário de recarregar a página
  evento.preventDefault();

  // Lê os valores dos campos
  var email = document.getElementById('login-email').value.trim();
  var senha = document.getElementById('login-senha').value;

  // Remove erros anteriores
  document.getElementById('login-email').classList.remove('erro');
  document.getElementById('login-senha').classList.remove('erro');
  esconderAlerta();

  // Validação: verifica se o email foi preenchido
  if (!email) {
    document.getElementById('login-email').classList.add('erro');
    mostrarAlerta('Por favor insira o seu email.', 'erro');
    document.getElementById('login-email').focus();
    return; /* Sai da função sem continuar */
  }

  // Validação: verifica se a senha foi preenchida
  if (!senha) {
    document.getElementById('login-senha').classList.add('erro');
    mostrarAlerta('Por favor insira a sua senha.', 'erro');
    document.getElementById('login-senha').focus();
    return;
  }

  // Activa o estado de carregamento no botão
  var btn = document.getElementById('btn-login');
  btn.classList.add('carregando');
  btn.innerHTML = '<i class="ti ti-loader-2" style="animation:spin 1s linear infinite"></i> A verificar...';

  // Simula um pequeno delay de rede (500ms) para parecer mais real
  setTimeout(function() {

    // Chama a função de login do auth.js
    var resultado = fazerLogin(email, senha);

    if (resultado.sucesso) {

      // Login bem sucedido: mostra mensagem e redireciona
      btn.innerHTML = '<i class="ti ti-check"></i> Sucesso!';
      btn.style.background = 'var(--sucesso)';

      mostrarAlerta('Login efectuado com sucesso! A redirecionar...', 'sucesso');

      // Aguarda 800ms e redireciona para a página correcta do perfil
      setTimeout(function() {
        redirecionarParaPerfil(resultado.usuario.perfil);
      }, 800);

    } else {

      // Login falhado: mostra a mensagem de erro
      btn.classList.remove('carregando');
      btn.innerHTML = '<i class="ti ti-login"></i> Entrar';

      // Marca os campos com erro
      document.getElementById('login-email').classList.add('erro');
      document.getElementById('login-senha').classList.add('erro');

      // Mostra a mensagem de erro
      mostrarAlerta(resultado.mensagem, 'erro');

      // Limpa a senha para o utilizador tentar novamente
      document.getElementById('login-senha').value = '';
      document.getElementById('login-senha').focus();
    }

  }, 500);
}


// ----------------------------------------------------------------
// INICIALIZAÇÃO
// Corre quando a página termina de carregar
// ----------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {

  // Se o utilizador já está logado, redireciona directamente
  if (estaLogado()) {
    redirecionarParaPerfil(getSessao().perfil);
    return; /* Sai sem executar o resto */
  }

  // Liga o formulário ao evento de submit
  var form = document.getElementById('form-login');
  if (form) {
    form.addEventListener('submit', submeterLogin);
  }

  // Liga o botão de mostrar/esconder senha
  var btnSenha = document.getElementById('btn-mostrar-senha');
  if (btnSenha) {
    btnSenha.addEventListener('click', toggleSenha);
  }

  // Gera os botões de demonstração dinamicamente
  var containerDemo = document.getElementById('demo-credenciais');
  if (containerDemo) {

    // Percorre a lista de credenciais e cria um botão para cada uma
    credenciaisDemo.forEach(function(cred) {

      var item = document.createElement('div');
      item.className = 'auth-demo-item';

      // "innerHTML" define o HTML interno do elemento
      item.innerHTML =
        '<span class="auth-demo-perfil">' + cred.perfil + '</span>' +
        '<button class="auth-demo-btn" type="button">' +
          'Usar este' +
        '</button>';

      // Liga o botão à função de preencher
      item.querySelector('button').addEventListener('click', function() {
        preencherCredencial(cred.email, cred.senha);
      });

      containerDemo.appendChild(item); /* Adiciona ao ecrã */
    });
  }

  // Remove o efeito de carregamento no botão se existir
  var btn = document.getElementById('btn-login');
  if (btn) {
    btn.innerHTML = '<i class="ti ti-login"></i> Entrar';
  }
});