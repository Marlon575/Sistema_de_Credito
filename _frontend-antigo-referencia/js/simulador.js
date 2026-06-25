// ================================================================
// js/simulador.js
// Lógica do wizard de simulação e pedido de crédito (3 etapas)
// Depende de js/db.js e js/auth.js carregados antes
// ================================================================
// Etapa 1: Tipo de crédito + Valor + Prazo
// Etapa 2: Confirmação dos dados pessoais (vindos do registo)
// Etapa 3: Documentos + Confirmação final
// ================================================================


// ----------------------------------------------------------------
// VARIÁVEIS GLOBAIS DO WIZARD
// ----------------------------------------------------------------
var etapaActual = 1;        // Etapa em que o utilizador está agora
var tipoSeleccionado = 1;   // Tipo de crédito escolhido (1, 2 ou 3)
var usuarioActual = null;   // Utilizador logado
var documentosAnexados = {  // Guarda os nomes dos ficheiros "anexados"
  bi: null,
  rendimento: null,
  extracto: null,
  residencia: null
};


// ================================================================
// BLOCO 1: NAVEGAÇÃO ENTRE ETAPAS
// ================================================================

// Avança para a etapa seguinte, validando a etapa actual primeiro
function avancarEtapa() {

  // Valida a etapa actual antes de deixar avançar
  if (etapaActual === 1 && !validarEtapa1()) return;
  if (etapaActual === 2 && !validarEtapa2()) return;

  if (etapaActual < 3) {
    etapaActual++;
    mostrarEtapa(etapaActual);
  }
}

// Volta para a etapa anterior
function voltarEtapa() {
  if (etapaActual > 1) {
    etapaActual--;
    mostrarEtapa(etapaActual);
  }
}

// Mostra a etapa indicada e esconde as outras
function mostrarEtapa(numero) {

  // Esconde todas as etapas
  document.querySelectorAll('.etapa-form').forEach(function(etapa) {
    etapa.classList.remove('activa');
  });

  // Mostra apenas a etapa pedida
  document.getElementById('etapa-' + numero).classList.add('activa');

  // Actualiza visualmente o indicador de progresso (wizard de números)
  atualizarIndicadorWizard(numero);

  // Se chegou à etapa 2, preenche os dados pessoais automaticamente
  if (numero === 2) {
    preencherDadosPessoais();
  }

  // Se chegou à etapa 3, actualiza o resumo final
  if (numero === 3) {
    atualizarResumoFinal();
  }

  // Faz scroll para o topo do formulário (caso a página tenha scroll)
  document.getElementById('topo-formulario').scrollIntoView({ behavior: 'smooth' });
}

// Actualiza os círculos numerados e linhas do topo do wizard
function atualizarIndicadorWizard(numero) {

  for (var i = 1; i <= 3; i++) {
    var passo = document.getElementById('wizard-passo-' + i);
    passo.classList.remove('activo', 'concluido');

    if (i < numero) {
      passo.classList.add('concluido');     // Etapas já passadas
    } else if (i === numero) {
      passo.classList.add('activo');        // Etapa actual
    }
  }

  // Actualiza as linhas conectoras entre os números
  for (var j = 1; j <= 2; j++) {
    var linha = document.getElementById('wizard-linha-' + j);
    if (j < numero) {
      linha.classList.add('completa');
    } else {
      linha.classList.remove('completa');
    }
  }
}


// ================================================================
// BLOCO 2: ETAPA 1 — Tipo de crédito, valor e prazo
// ================================================================

// Chamada quando o utilizador clica num card de tipo de crédito
function seleccionarTipo(tipoId) {
  tipoSeleccionado = tipoId;

  // Remove a selecção visual de todos os cards
  document.querySelectorAll('.opcao-tipo-card').forEach(function(card) {
    card.classList.remove('seleccionado');
  });

  // Marca o card clicado como seleccionado
  document.querySelector('.opcao-tipo-card[data-tipo="' + tipoId + '"]')
    .classList.add('seleccionado');

  // Busca os limites deste tipo
  var tipo = getTipoEmprestimoPorId(tipoId);
  if (!tipo) return;

  // Actualiza os limites dos sliders
  var sliderValor = document.getElementById('sim-valor');
  var sliderPrazo = document.getElementById('sim-prazo');

  sliderValor.min = tipo.valorMinimo;
  sliderValor.max = tipo.valorMaximo;
  sliderPrazo.min = tipo.prazoMinimo;
  sliderPrazo.max = tipo.prazoMaximo;

  // Ajusta os valores se estiverem fora dos novos limites
  if (parseFloat(sliderValor.value) < tipo.valorMinimo) sliderValor.value = tipo.valorMinimo;
  if (parseFloat(sliderValor.value) > tipo.valorMaximo) sliderValor.value = tipo.valorMaximo;
  if (parseInt(sliderPrazo.value) < tipo.prazoMinimo) sliderPrazo.value = tipo.prazoMinimo;
  if (parseInt(sliderPrazo.value) > tipo.prazoMaximo) sliderPrazo.value = tipo.prazoMaximo;

  // Actualiza os textos dos limites na interface
  document.getElementById('sim-valor-min').textContent = formatarMoeda(tipo.valorMinimo) + ' MT';
  document.getElementById('sim-valor-max').textContent = formatarMoeda(tipo.valorMaximo) + ' MT';
  document.getElementById('sim-prazo-min').textContent = tipo.prazoMinimo + ' meses';
  document.getElementById('sim-prazo-max').textContent = tipo.prazoMaximo + ' meses';

  // Recalcula o resultado
  atualizarCalculoSimulacao();
}

// Recalcula os valores sempre que o slider de valor ou prazo muda
function atualizarCalculoSimulacao() {

  var valor = parseFloat(document.getElementById('sim-valor').value);
  var prazo = parseInt(document.getElementById('sim-prazo').value);
  var tipo  = getTipoEmprestimoPorId(tipoSeleccionado);

  if (!tipo) return;

  // Actualiza os textos dos sliders
  document.getElementById('sim-valor-texto').textContent = formatarMoeda(valor) + ' MT';
  document.getElementById('sim-prazo-texto').textContent = prazo + ' meses';

  // Calcula usando o método Price
  var calculo = calcularEmprestimo(valor, tipo.taxaMensal, prazo);

  // Actualiza o card de resultado (lado direito)
  document.getElementById('res-prestacao').textContent = formatarMoeda(calculo.parcela) + ' MT';
  document.getElementById('res-valor-pedido').textContent = formatarMoeda(valor) + ' MT';
  document.getElementById('res-total-pagar').textContent = formatarMoeda(calculo.total) + ' MT';
  document.getElementById('res-total-juros').textContent = formatarMoeda(calculo.juros) + ' MT';
  document.getElementById('res-taxa-mensal').textContent = tipo.taxaMensal + '%';
  document.getElementById('res-taxa-nominal').textContent = tipo.taxaNominal + '%';
  document.getElementById('res-prazo').textContent = prazo + ' meses';

  // Calcula e mostra o score de crédito baseado no rendimento do cliente
  atualizarScore(valor, prazo);
}

// Calcula o score de crédito e actualiza a barra visual
function atualizarScore(valor, prazo) {

  var resultado = calcularScore(usuarioActual.rendimentoMensal, valor, prazo);

  var scoreCard  = document.getElementById('score-card');
  var scoreNivel = document.getElementById('score-nivel');
  var scoreNum   = document.getElementById('score-numero');
  var scoreBarra = document.getElementById('score-barra');

  scoreNivel.textContent = resultado.nivel;
  scoreNum.textContent = resultado.score + '/100';
  scoreBarra.style.width = resultado.score + '%';

  // Remove classes de cor anteriores e adiciona a nova
  scoreBarra.className = 'progresso-barra ' + resultado.cor;
  scoreNivel.style.color = 'var(--' + resultado.cor + ')';
}

// Valida se a etapa 1 está completa antes de avançar
function validarEtapa1() {
  if (!tipoSeleccionado) {
    alert('Por favor seleccione um tipo de crédito.');
    return false;
  }
  return true;
}


// ================================================================
// BLOCO 3: ETAPA 2 — Confirmação dos dados pessoais
// ================================================================

// Preenche os campos de dados pessoais com a informação do registo
// Estes campos são apenas de leitura (não editáveis)
function preencherDadosPessoais() {
  document.getElementById('dados-nome').textContent = usuarioActual.nome;
  document.getElementById('dados-email').textContent = usuarioActual.email;
  document.getElementById('dados-bi').textContent = usuarioActual.bi || '—';
  document.getElementById('dados-telefone').textContent = usuarioActual.telefone || '—';
  document.getElementById('dados-endereco').textContent = usuarioActual.endereco || '—';
  document.getElementById('dados-rendimento').textContent =
    formatarMoeda(usuarioActual.rendimentoMensal) + ' MT';
  document.getElementById('dados-emprego').textContent =
    traduzirTipoEmprego(usuarioActual.tipoEmprego);
  document.getElementById('dados-empresa').textContent = usuarioActual.emprego || '—';
}

// Traduz o código do tipo de emprego para texto legível
function traduzirTipoEmprego(tipo) {
  var mapa = {
    'publico':    'Funcionário Público',
    'privado':    'Funcionário Privado',
    'empresario': 'Empresário / Autónomo',
    'outro':      'Outro'
  };
  return mapa[tipo] || 'Não especificado';
}

// Valida a etapa 2 — confirma que o utilizador reviu os dados
function validarEtapa2() {
  var confirmou = document.getElementById('confirmar-dados').checked;
  if (!confirmou) {
    alert('Por favor confirme que os seus dados estão correctos.');
    return false;
  }
  return true;
}


// ================================================================
// BLOCO 4: ETAPA 3 — Upload de documentos (simulado)
// ================================================================

// Liga os eventos de clique nos cards de upload
function iniciarUploads() {

  var mapaCards = {
    'upload-bi':         'bi',
    'upload-rendimento': 'rendimento',
    'upload-extracto':   'extracto',
    'upload-residencia': 'residencia'
  };

  // Para cada card de upload, liga o input de ficheiro escondido
  Object.keys(mapaCards).forEach(function(cardId) {
    var card  = document.getElementById(cardId);
    var input = card.querySelector('input[type="file"]');
    var chave = mapaCards[cardId];

    // Ao clicar no card, abre o selector de ficheiros
    card.addEventListener('click', function() {
      input.click();
    });

    // Quando um ficheiro é seleccionado
    input.addEventListener('change', function() {
      if (this.files.length > 0) {
        var nomeFicheiro = this.files[0].name;
        documentosAnexados[chave] = nomeFicheiro;

        // Actualiza visualmente o card para mostrar que foi preenchido
        card.classList.add('preenchido');
        card.querySelector('.upload-icone').className = 'ti ti-circle-check upload-icone';
        card.querySelector('.upload-nome-ficheiro').textContent = nomeFicheiro;
      }
    });
  });
}

// Valida se todos os documentos obrigatórios foram anexados
function validarDocumentos() {
  var obrigatorios = ['bi', 'rendimento'];   // Estes dois são sempre obrigatórios

  for (var i = 0; i < obrigatorios.length; i++) {
    if (!documentosAnexados[obrigatorios[i]]) {
      return false;
    }
  }
  return true;
}

// Actualiza o resumo final mostrado na etapa 3 antes de submeter
function atualizarResumoFinal() {

  var valor = parseFloat(document.getElementById('sim-valor').value);
  var prazo = parseInt(document.getElementById('sim-prazo').value);
  var tipo  = getTipoEmprestimoPorId(tipoSeleccionado);
  var calculo = calcularEmprestimo(valor, tipo.taxaMensal, prazo);

  document.getElementById('resumo-tipo').textContent = tipo.nome;
  document.getElementById('resumo-valor').textContent = formatarMoeda(valor) + ' MT';
  document.getElementById('resumo-prazo').textContent = prazo + ' meses';
  document.getElementById('resumo-prestacao').textContent = formatarMoeda(calculo.parcela) + ' MT';
  document.getElementById('resumo-total').textContent = formatarMoeda(calculo.total) + ' MT';
}


// ================================================================
// BLOCO 5: SUBMISSÃO FINAL DO PEDIDO
// ================================================================

function submeterPedido() {

  // Valida se aceitou os termos finais
  var aceitouTermos = document.getElementById('aceitar-termos-final').checked;
  if (!aceitouTermos) {
    alert('Deve aceitar os termos para submeter o pedido.');
    return;
  }

  // Valida se anexou os documentos obrigatórios
  if (!validarDocumentos()) {
    alert('Por favor anexe pelo menos o BI e o comprovativo de rendimento.');
    return;
  }

  // Recolhe todos os dados necessários
  var valor = parseFloat(document.getElementById('sim-valor').value);
  var prazo = parseInt(document.getElementById('sim-prazo').value);
  var tipo  = getTipoEmprestimoPorId(tipoSeleccionado);

  // Activa o estado de carregamento no botão
  var btn = document.getElementById('btn-submeter');
  btn.disabled = true;
  btn.innerHTML = '<i class="ti ti-loader-2 icone-girando"></i> A submeter pedido...';

  // Simula um pequeno delay de processamento
  setTimeout(function() {

    // Cria o empréstimo na base de dados (função do db.js)
    var novoEmprestimo = criarEmprestimo({
      clienteId: usuarioActual.id,
      clienteNome: usuarioActual.nome,
      tipoId: tipo.id,
      tipoNome: tipo.nome,
      valor: valor,
      prazo: prazo,
      taxaMensal: tipo.taxaMensal,
      taxaNominal: tipo.taxaNominal,
      documentos: documentosAnexados
    });

    // Mostra a tela de sucesso
    mostrarTelaSucesso(novoEmprestimo);

  }, 1200);
}

// Mostra a etapa final de sucesso com o número do pedido
function mostrarTelaSucesso(emprestimo) {

  // Esconde todo o wizard
  document.getElementById('wizard-container').style.display = 'none';

  // Mostra a tela de sucesso
  var telaSucesso = document.getElementById('tela-sucesso');
  telaSucesso.style.display = 'block';

  // Preenche o número do pedido criado
  document.getElementById('sucesso-numero-pedido').textContent =
    '#' + String(emprestimo.id).padStart(5, '0');
}


// ================================================================
// INICIALIZAÇÃO
// ================================================================

document.addEventListener('DOMContentLoaded', function() {

  // Protege a página: só clientes
  usuarioActual = exigirPerfil(['cliente']);
  if (!usuarioActual) return;

  // Mostra info do utilizador na sidebar
  mostrarInfoUsuario(
    document.getElementById('nome-usuario'),
    document.getElementById('perfil-usuario')
  );

  var iniciais = usuarioActual.nome.split(' ').map(function(p) { return p[0]; }).join('').substring(0, 2);
  document.getElementById('avatar-iniciais').textContent = iniciais.toUpperCase();

  // Liga os cards de selecção de tipo de crédito
  document.querySelectorAll('.opcao-tipo-card').forEach(function(card) {
    card.addEventListener('click', function() {
      seleccionarTipo(parseInt(this.getAttribute('data-tipo')));
    });
  });

  // Liga os sliders
  document.getElementById('sim-valor').addEventListener('input', atualizarCalculoSimulacao);
  document.getElementById('sim-prazo').addEventListener('input', atualizarCalculoSimulacao);

  // Liga os botões de navegação do wizard
  document.getElementById('btn-avancar-1').addEventListener('click', avancarEtapa);
  document.getElementById('btn-avancar-2').addEventListener('click', avancarEtapa);
  document.getElementById('btn-voltar-2').addEventListener('click', voltarEtapa);
  document.getElementById('btn-voltar-3').addEventListener('click', voltarEtapa);
  document.getElementById('btn-submeter').addEventListener('click', submeterPedido);

  // Inicia a lógica de upload de documentos
  iniciarUploads();

  // Liga o botão de logout
  configurarBotaoLogout('#btn-logout');

  // Selecciona o tipo 1 (Consumo) por padrão ao carregar a página
  seleccionarTipo(1);
});