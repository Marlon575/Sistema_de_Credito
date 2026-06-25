// ================================================================
// js/landing.js
// Toda a lógica interactiva da Landing Page SPA
// Depende de js/db.js carregado antes
// ================================================================


// ----------------------------------------------------------------
// VARIÁVEL GLOBAL DO SIMULADOR
// Guarda qual tipo de empréstimo está seleccionado
// ----------------------------------------------------------------
var tipoActual = 1;


// ================================================================
// BLOCO 1: NAVBAR DINÂMICA
// Muda o estilo da navbar ao fazer scroll
// ================================================================

function iniciarNavbar() {

  // Selecciona o elemento da navbar
  var navbar = document.getElementById('navbar');

  // "window.addEventListener('scroll', ...)" executa a função
  // sempre que o utilizador faz scroll na página
  window.addEventListener('scroll', function() {

    // "window.scrollY" devolve quantos pixels o utilizador já scrollou
    if (window.scrollY > 80) {

      // Após 80px de scroll: navbar fica sólida (branca)
      navbar.classList.remove('transparente');
      navbar.classList.add('solida');

    } else {

      // Antes de 80px: navbar fica transparente sobre o hero
      navbar.classList.remove('solida');
      navbar.classList.add('transparente');
    }
  });
}


// ================================================================
// BLOCO 2: SCROLL SUAVE PARA SECÇÕES
// Quando se clica num link da navbar, a página desliza suavemente
// ================================================================

function iniciarScrollSuave() {

  // Selecciona todos os links que começam com "#" (âncoras internas)
  var links = document.querySelectorAll('a[href^="#"]');

  // Para cada link, adiciona um listener de clique
  links.forEach(function(link) {
    link.addEventListener('click', function(evento) {

      // "preventDefault()" impede o comportamento padrão do link
      // (que seria saltar abruptamente para o elemento)
      evento.preventDefault();

      // Lê o destino do link (ex: "#tipos-credito")
      var destino = this.getAttribute('href');

      // Encontra o elemento com esse id na página
      var elemento = document.querySelector(destino);

      if (elemento) {
        // "scrollIntoView" faz scroll suave até ao elemento
        elemento.scrollIntoView({
          behavior: 'smooth',  /* Scroll animado */
          block: 'start'       /* Alinha o topo do elemento com o topo da janela */
        });
      }
    });
  });
}


// ================================================================
// BLOCO 3: SIMULADOR DE CRÉDITO
// Calcula a prestação em tempo real ao mover os sliders
// ================================================================

function iniciarSimulador() {

  // Liga os eventos dos botões de aba
  var abas = document.querySelectorAll('.aba-sim');
  abas.forEach(function(aba) {
    aba.addEventListener('click', function() {
      // Lê o tipo do atributo data-tipo do botão clicado
      mudarTipoSimulador(parseInt(this.getAttribute('data-tipo')));
    });
  });

  // Liga os eventos dos sliders
  var sliderValor = document.getElementById('slider-valor');
  var sliderPrazo = document.getElementById('slider-prazo');

  if (sliderValor) sliderValor.addEventListener('input', actualizarSimulador);
  if (sliderPrazo) sliderPrazo.addEventListener('input', actualizarSimulador);

  // Calcula os valores iniciais ao carregar a página
  actualizarSimulador();
}

// Muda o tipo de empréstimo seleccionado no simulador
function mudarTipoSimulador(tipoId) {
  tipoActual = tipoId;

  // Remove "activa" de todas as abas
  document.querySelectorAll('.aba-sim').forEach(function(a) {
    a.classList.remove('activa');
  });

  // Adiciona "activa" à aba clicada
  document.querySelector('.aba-sim[data-tipo="' + tipoId + '"]')
    .classList.add('activa');

  // Busca os limites deste tipo na base de dados
  var tipo = getTipoEmprestimoPorId(tipoId);
  if (!tipo) return;

  var sliderValor = document.getElementById('slider-valor');
  var sliderPrazo = document.getElementById('slider-prazo');

  // Actualiza os limites dos sliders conforme o tipo escolhido
  sliderValor.min = tipo.valorMinimo;
  sliderValor.max = tipo.valorMaximo;
  sliderPrazo.min = tipo.prazoMinimo;
  sliderPrazo.max = tipo.prazoMaximo;

  // Ajusta os valores se estiverem fora dos novos limites
  if (parseFloat(sliderValor.value) < tipo.valorMinimo)
    sliderValor.value = tipo.valorMinimo;
  if (parseFloat(sliderValor.value) > tipo.valorMaximo)
    sliderValor.value = tipo.valorMaximo;
  if (parseInt(sliderPrazo.value) < tipo.prazoMinimo)
    sliderPrazo.value = tipo.prazoMinimo;
  if (parseInt(sliderPrazo.value) > tipo.prazoMaximo)
    sliderPrazo.value = tipo.prazoMaximo;

  // Actualiza o texto do prazo máximo
  var txtPrazoMax = document.getElementById('txt-prazo-max');
  if (txtPrazoMax) txtPrazoMax.textContent = 'Máx: ' + tipo.prazoMaximo + ' meses';

  // Recalcula com os novos valores
  actualizarSimulador();
}

// Recalcula os resultados do simulador
function actualizarSimulador() {
  var sliderValor = document.getElementById('slider-valor');
  var sliderPrazo = document.getElementById('slider-prazo');

  if (!sliderValor || !sliderPrazo) return;

  var valor = parseFloat(sliderValor.value);
  var prazo = parseInt(sliderPrazo.value);
  var tipo  = getTipoEmprestimoPorId(tipoActual);

  if (!tipo) return;

  // Actualiza os textos dos sliders
  var txtValor = document.getElementById('txt-valor');
  var txtPrazo = document.getElementById('txt-prazo');
  if (txtValor) txtValor.textContent = formatarMoeda(valor) + ' MT';
  if (txtPrazo) txtPrazo.textContent = prazo + ' meses';

  // Calcula usando o método Price (função do db.js)
  var calculo = calcularEmprestimo(valor, tipo.taxaMensal, prazo);

  // Actualiza os resultados na interface
  var campos = {
    'res-montante':    formatarMoeda(valor) + ' MT',
    'res-taxa-mensal': tipo.taxaMensal + '%',
    'res-taxa-nominal':tipo.taxaNominal + '% ao ano',
    'res-parcela':     formatarMoeda(calculo.parcela) + ' MT',
    'res-total':       formatarMoeda(calculo.total) + ' MT',
    'res-juros':       formatarMoeda(calculo.juros) + ' MT'
  };

  // Percorre cada campo e actualiza o texto se o elemento existir
  Object.keys(campos).forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.textContent = campos[id];
  });
}


// ================================================================
// BLOCO 4: ABAS DE INFORMAÇÕES IMPORTANTES
// Alterna entre Documentos, Requisitos e Taxas
// ================================================================

function iniciarAbasInfo() {
  var abas = document.querySelectorAll('.info-aba');

  abas.forEach(function(aba) {
    aba.addEventListener('click', function() {

      // Remove "activa" de todas as abas
      abas.forEach(function(a) { a.classList.remove('activa'); });

      // Esconde todos os painéis
      document.querySelectorAll('.info-painel').forEach(function(p) {
        p.classList.remove('activo');
      });

      // Activa esta aba
      this.classList.add('activa');

      // Lê qual painel deve mostrar (atributo data-painel)
      var painelId = this.getAttribute('data-painel');
      var painel = document.getElementById(painelId);
      if (painel) painel.classList.add('activo');
    });
  });
}


// ================================================================
// BLOCO 5: FAQ ACORDEÃO
// Abre e fecha as respostas ao clicar nas perguntas
// ================================================================

function iniciarFaq() {
  var perguntas = document.querySelectorAll('.faq-pergunta');

  perguntas.forEach(function(pergunta) {
    pergunta.addEventListener('click', function() {

      // Encontra o item pai (que contém pergunta + resposta)
      var item = this.closest('.faq-item');

      // Verifica se já está aberto
      var estaAberto = item.classList.contains('aberto');

      // Fecha TODOS os itens primeiro
      document.querySelectorAll('.faq-item').forEach(function(i) {
        i.classList.remove('aberto');
      });

      // Se não estava aberto, abre este
      // (se já estava aberto, o clique fecha — toggle)
      if (!estaAberto) {
        item.classList.add('aberto');
      }
    });
  });
}


// ================================================================
// BLOCO 6: FORMULÁRIO DE CONTACTO
// Valida e simula o envio da mensagem
// ================================================================

function iniciarFormContacto() {
  var form = document.getElementById('form-contacto');

  if (!form) return;

  form.addEventListener('submit', function(evento) {

    // Impede o envio real do formulário (que recarregaria a página)
    evento.preventDefault();

    // Lê os valores dos campos
    var nome    = document.getElementById('cont-nome').value.trim();
    var email   = document.getElementById('cont-email').value.trim();
    var assunto = document.getElementById('cont-assunto').value.trim();
    var msg     = document.getElementById('cont-msg').value.trim();

    // Validação básica
    if (!nome || !email || !assunto || !msg) {
      mostrarMensagemLanding('msg-contacto', 'Por favor preencha todos os campos.', 'erro');
      return;
    }

    // Simula o envio (em produção ligaria a uma API real)
    var btnEnviar = form.querySelector('button[type="submit"]');
    btnEnviar.disabled = true;
    btnEnviar.textContent = 'A enviar...';

    // "setTimeout" simula um delay de rede (1.5 segundos)
    setTimeout(function() {
      mostrarMensagemLanding('msg-contacto', 'Mensagem enviada com sucesso! Responderemos em breve.', 'sucesso');
      form.reset();   /* Limpa todos os campos do formulário */
      btnEnviar.disabled = false;
      btnEnviar.innerHTML = '<i class="ti ti-send"></i> Enviar Mensagem';
    }, 1500);
  });
}


// ================================================================
// BLOCO 7: ANIMAÇÕES AO FAZER SCROLL (Intersection Observer)
// Elementos aparecem suavemente quando entram no ecrã
// ================================================================

function iniciarAnimacoes() {

  // "IntersectionObserver" observa quando elementos ficam visíveis no ecrã
  var observer = new IntersectionObserver(function(entradas) {

    entradas.forEach(function(entrada) {
      // Se o elemento ficou visível
      if (entrada.isIntersecting) {
        entrada.target.classList.add('visivel');
        // Para de observar depois de animar (não repete)
        observer.unobserve(entrada.target);
      }
    });

  }, {
    threshold: 0.1   /* Activa quando 10% do elemento está visível */
  });

  // Observa todos os elementos com a classe "animar"
  document.querySelectorAll('.animar').forEach(function(el) {
    observer.observe(el);
  });
}


// ================================================================
// BLOCO 8: UTILITÁRIO DE MENSAGENS
// Mostra feedback ao utilizador
// ================================================================

function mostrarMensagemLanding(elementoId, texto, tipo) {
  var el = document.getElementById(elementoId);
  if (!el) return;

  var estilos = {
    erro:    { bg: 'var(--perigo-clara)',  cor: 'var(--perigo)'  },
    sucesso: { bg: 'var(--sucesso-clara)', cor: 'var(--sucesso)' },
    aviso:   { bg: 'var(--aviso-clara)',   cor: 'var(--aviso)'   }
  };

  var estilo = estilos[tipo] || estilos.aviso;

  el.style.display     = 'block';
  el.style.padding     = '12px 16px';
  el.style.borderRadius= '8px';
  el.style.fontSize    = '0.875rem';
  el.style.fontWeight  = '500';
  el.style.background  = estilo.bg;
  el.style.color       = estilo.cor;
  el.style.marginTop   = '12px';
  el.textContent       = texto;

  // Esconde automaticamente após 6 segundos
  setTimeout(function() { el.style.display = 'none'; }, 6000);
}


// ================================================================
// INICIALIZAÇÃO GERAL
// Corre quando a página termina de carregar completamente
// ================================================================

document.addEventListener('DOMContentLoaded', function() {

  // Inicia todos os módulos da página
  iniciarNavbar();        /* Navbar que muda ao fazer scroll */
  iniciarScrollSuave();   /* Links de navegação suaves */
  iniciarSimulador();     /* Calculadora de crédito */
  iniciarAbasInfo();      /* Abas de informações */
  iniciarFaq();           /* Perguntas frequentes */
  iniciarFormContacto();  /* Formulário de contacto */
  iniciarAnimacoes();     /* Elementos que aparecem ao fazer scroll */

  // Abre o primeiro FAQ por padrão (para mostrar como funciona)
  var primeirFaq = document.querySelector('.faq-item');
  if (primeirFaq) primeirFaq.classList.add('aberto');
});