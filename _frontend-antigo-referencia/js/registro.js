// ================================================================
// js/registro.js
// Lógica da página de registo de novo cliente
// Depende de js/db.js e js/auth.js carregados antes
// ================================================================


// ----------------------------------------------------------------
// FUNÇÃO: mostrarAlertaRegistro
// Mostra mensagem de erro ou sucesso no formulário de registo
// ----------------------------------------------------------------
function mostrarAlertaRegistro(mensagem, tipo) {
  var alerta = document.getElementById('registro-alerta');
  if (!alerta) return;

  alerta.className = 'auth-alerta';
  var icone = tipo === 'erro' ? 'ti-alert-circle' : 'ti-check';
  alerta.innerHTML = '<i class="ti ' + icone + '"></i>' + mensagem;
  alerta.classList.add(tipo);

  // Faz scroll até ao alerta para garantir que o utilizador o vê
  alerta.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function esconderAlertaRegistro() {
  var alerta = document.getElementById('registro-alerta');
  if (alerta) alerta.className = 'auth-alerta';
}


// ----------------------------------------------------------------
// FUNÇÃO: toggleSenhaRegistro
// Mostra/esconde a senha em qualquer campo de senha do formulário
// Parâmetro: inputId — id do input a alternar
//            botaoId — id do botão clicado
// ----------------------------------------------------------------
function toggleSenhaRegistro(inputId, botaoId) {
  var input = document.getElementById(inputId);
  var botao = document.getElementById(botaoId);
  var icone = botao.querySelector('i');

  if (input.type === 'password') {
    input.type = 'text';
    icone.className = 'ti ti-eye-off';
  } else {
    input.type = 'password';
    icone.className = 'ti ti-eye';
  }
}


// ----------------------------------------------------------------
// FUNÇÃO: marcarErro / limparErro
// Adiciona ou remove o estilo visual de erro num campo
// ----------------------------------------------------------------
function marcarErro(inputId) {
  var el = document.getElementById(inputId);
  if (el) el.classList.add('erro');
}

function limparErro(inputId) {
  var el = document.getElementById(inputId);
  if (el) el.classList.remove('erro');
}

// Limpa os erros de todos os campos do formulário
function limparTodosErros() {
  var campos = [
    'reg-nome', 'reg-email', 'reg-bi', 'reg-telefone',
    'reg-rendimento', 'reg-emprego', 'reg-senha', 'reg-confirmar-senha'
  ];
  campos.forEach(function(id) { limparErro(id); });
  esconderAlertaRegistro();
}


// ----------------------------------------------------------------
// FUNÇÃO: validarFormulario
// Verifica todos os campos antes de enviar
// Retorna { valido: true/false, mensagem: '...' }
// ----------------------------------------------------------------
function validarFormulario(dados) {

  // Nome — pelo menos 3 caracteres
  if (!dados.nome || dados.nome.trim().length < 3) {
    marcarErro('reg-nome');
    return { valido: false, mensagem: 'O nome deve ter pelo menos 3 caracteres.', campo: 'reg-nome' };
  }

  // Email — formato básico válido
  // Esta expressão regular verifica se tem "texto@texto.texto"
  var formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!dados.email || !formatoEmail.test(dados.email)) {
    marcarErro('reg-email');
    return { valido: false, mensagem: 'Insira um email válido.', campo: 'reg-email' };
  }

  // BI — pelo menos 8 caracteres
  if (!dados.bi || dados.bi.trim().length < 8) {
    marcarErro('reg-bi');
    return { valido: false, mensagem: 'Número de BI inválido.', campo: 'reg-bi' };
  }

  // Telefone — obrigatório
  if (!dados.telefone || dados.telefone.trim().length < 9) {
    marcarErro('reg-telefone');
    return { valido: false, mensagem: 'Insira um número de telefone válido.', campo: 'reg-telefone' };
  }

  // Rendimento mensal — deve ser maior que zero
  if (!dados.rendimentoMensal || parseFloat(dados.rendimentoMensal) <= 0) {
    marcarErro('reg-rendimento');
    return { valido: false, mensagem: 'Insira o seu rendimento mensal.', campo: 'reg-rendimento' };
  }

  // Tipo de emprego — deve estar seleccionado
  if (!dados.tipoEmprego) {
    marcarErro('reg-emprego');
    return { valido: false, mensagem: 'Seleccione o seu tipo de emprego.', campo: 'reg-emprego' };
  }

  // Senha — pelo menos 6 caracteres
  if (!dados.senha || dados.senha.length < 6) {
    marcarErro('reg-senha');
    return { valido: false, mensagem: 'A senha deve ter pelo menos 6 caracteres.', campo: 'reg-senha' };
  }

  // Confirmação de senha — deve ser igual à senha
  if (dados.senha !== dados.confirmarSenha) {
    marcarErro('reg-confirmar-senha');
    return { valido: false, mensagem: 'As senhas não coincidem.', campo: 'reg-confirmar-senha' };
  }

  // Termos — checkbox deve estar marcado
  if (!dados.aceitaTermos) {
    return { valido: false, mensagem: 'Deve aceitar os Termos e Condições para continuar.', campo: null };
  }

  // Tudo válido
  return { valido: true };
}


// ----------------------------------------------------------------
// FUNÇÃO: actualizarForcaSenha
// Mostra visualmente se a senha é fraca, média ou forte
// ----------------------------------------------------------------
function actualizarForcaSenha() {
  var senha = document.getElementById('reg-senha').value;
  var barra = document.getElementById('forca-senha-barra');
  var texto = document.getElementById('forca-senha-texto');

  if (!senha) {
    barra.style.width = '0%';
    texto.textContent = '';
    return;
  }

  // Calcula uma pontuação simples baseada em critérios
  var pontos = 0;
  if (senha.length >= 6)  pontos++;          /* Tamanho mínimo */
  if (senha.length >= 10) pontos++;          /* Tamanho bom */
  if (/[A-Z]/.test(senha)) pontos++;         /* Tem maiúscula */
  if (/[0-9]/.test(senha)) pontos++;         /* Tem número */
  if (/[^A-Za-z0-9]/.test(senha)) pontos++;  /* Tem símbolo */

  // Define a cor e o texto conforme a pontuação
  if (pontos <= 2) {
    barra.style.width = '33%';
    barra.style.background = 'var(--perigo)';
    texto.textContent = 'Senha fraca';
    texto.style.color = 'var(--perigo)';
  } else if (pontos <= 3) {
    barra.style.width = '66%';
    barra.style.background = 'var(--aviso)';
    texto.textContent = 'Senha média';
    texto.style.color = 'var(--aviso)';
  } else {
    barra.style.width = '100%';
    barra.style.background = 'var(--sucesso)';
    texto.textContent = 'Senha forte';
    texto.style.color = 'var(--sucesso)';
  }
}


// ----------------------------------------------------------------
// FUNÇÃO: submeterRegistro
// Executada quando o utilizador submete o formulário
// ----------------------------------------------------------------
function submeterRegistro(evento) {

  evento.preventDefault(); // Impede o recarregamento da página

  limparTodosErros(); // Limpa erros de submissões anteriores

  // Recolhe todos os dados do formulário num único objecto
  var dados = {
    nome:            document.getElementById('reg-nome').value,
    email:           document.getElementById('reg-email').value,
    bi:              document.getElementById('reg-bi').value,
    telefone:        document.getElementById('reg-telefone').value,
    endereco:        document.getElementById('reg-endereco').value,
    rendimentoMensal:document.getElementById('reg-rendimento').value,
    emprego:         document.getElementById('reg-empresa').value,
    tipoEmprego:     document.getElementById('reg-emprego').value,
    senha:           document.getElementById('reg-senha').value,
    confirmarSenha:  document.getElementById('reg-confirmar-senha').value,
    aceitaTermos:    document.getElementById('reg-termos').checked
  };

  // Valida os dados antes de continuar
  var validacao = validarFormulario(dados);

  if (!validacao.valido) {
    mostrarAlertaRegistro(validacao.mensagem, 'erro');
    // Se houver um campo específico com erro, foca nele
    if (validacao.campo) {
      document.getElementById(validacao.campo).focus();
    }
    return; // Sai sem submeter
  }

  // Activa o estado de carregamento no botão
  var btn = document.getElementById('btn-registro');
  btn.classList.add('carregando');
  btn.innerHTML = '<i class="ti ti-loader-2" style="animation:spin 1s linear infinite"></i> A criar conta...';

  // Simula um pequeno delay de rede
  setTimeout(function() {

    // Chama a função de registo do auth.js
    var resultado = registarCliente(dados);

    if (resultado.sucesso) {

      btn.innerHTML = '<i class="ti ti-check"></i> Conta criada!';
      btn.style.background = 'var(--sucesso)';

      mostrarAlertaRegistro(
        'Conta criada com sucesso! A redirecionar para o seu painel...',
        'sucesso'
      );

      // Redireciona para o dashboard do cliente após 1 segundo
      setTimeout(function() {
        window.location.href = 'cliente/dashboard.html';
      }, 1000);

    } else {

      // Mostra o erro (ex: email já registado)
      btn.classList.remove('carregando');
      btn.innerHTML = '<i class="ti ti-user-plus"></i> Criar Conta';

      mostrarAlertaRegistro(resultado.mensagem, 'erro');

      // Se o erro for de email duplicado, marca o campo
      if (resultado.mensagem.indexOf('email') !== -1) {
        marcarErro('reg-email');
        document.getElementById('reg-email').focus();
      }
    }

  }, 600);
}


// ----------------------------------------------------------------
// INICIALIZAÇÃO
// ----------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {

  // Se já está logado, redirecciona directamente
  if (estaLogado()) {
    redirecionarParaPerfil(getSessao().perfil);
    return;
  }

  // Liga o formulário ao submit
  var form = document.getElementById('form-registro');
  if (form) form.addEventListener('submit', submeterRegistro);

  // Liga os botões de mostrar/esconder senha
  document.getElementById('btn-mostrar-senha-1')
    .addEventListener('click', function() {
      toggleSenhaRegistro('reg-senha', 'btn-mostrar-senha-1');
    });

  document.getElementById('btn-mostrar-senha-2')
    .addEventListener('click', function() {
      toggleSenhaRegistro('reg-confirmar-senha', 'btn-mostrar-senha-2');
    });

  // Liga o indicador de força da senha — actualiza a cada tecla
  document.getElementById('reg-senha')
    .addEventListener('input', actualizarForcaSenha);

  // Limpa o erro de um campo assim que o utilizador volta a escrever nele
  var todosOsCampos = document.querySelectorAll('.auth-input');
  todosOsCampos.forEach(function(campo) {
    campo.addEventListener('input', function() {
      this.classList.remove('erro');
    });
  });
});