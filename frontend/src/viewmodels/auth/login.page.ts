// =============================================================
// login.page.ts — Liga o HTML da página de login ao ViewModel
//
// Este ficheiro "vive" na página (é carregado pelo <script> no
// login.html) e faz a ponte: escuta eventos do DOM (cliques,
// submissão do formulário) e chama as funções do ViewModel.
// =============================================================

import { fazerLogin } from "./login.viewmodel";

// -------------------------------------------------------------
// Referências aos elementos do DOM que vamos usar
// -------------------------------------------------------------
const form = document.getElementById("form-login") as HTMLFormElement;
const inputEmail = document.getElementById("login-email") as HTMLInputElement;
const inputSenha = document.getElementById("login-senha") as HTMLInputElement;
const btnLogin = document.getElementById("btn-login") as HTMLButtonElement;
const btnMostrarSenha = document.getElementById("btn-mostrar-senha") as HTMLButtonElement;
const divAlerta = document.getElementById("login-alerta") as HTMLDivElement;

// -------------------------------------------------------------
// Mostrar/ocultar a senha ao clicar no ícone do olho
// -------------------------------------------------------------
btnMostrarSenha.addEventListener("click", () => {
  const tipoAtual = inputSenha.type;
  inputSenha.type = tipoAtual === "password" ? "text" : "password";

  // troca o ícone entre "olho aberto" e "olho fechado"
  const icone = btnMostrarSenha.querySelector("i");
  if (icone) {
    icone.className = tipoAtual === "password" ? "ti ti-eye-off" : "ti ti-eye";
  }
});

// -------------------------------------------------------------
// Mostra uma mensagem de erro na caixa de alerta
// -------------------------------------------------------------
function mostrarErro(mensagem: string): void {
  divAlerta.textContent = mensagem;
  divAlerta.classList.add("visivel", "erro");
}

function limparErro(): void {
  divAlerta.textContent = "";
  divAlerta.classList.remove("visivel", "erro");
}

// -------------------------------------------------------------
// Submissão do formulário
// -------------------------------------------------------------
form.addEventListener("submit", async (evento) => {
  evento.preventDefault(); // impede o comportamento padrão (recarregar a página)
  limparErro();

  // desactiva o botão enquanto processa, para evitar duplo clique
  btnLogin.disabled = true;
  btnLogin.textContent = "A entrar...";

  try {
    const urlDestino = await fazerLogin(inputEmail.value, inputSenha.value);
    window.location.href = urlDestino; // redirecciona para o dashboard certo
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao fazer login.";
    mostrarErro(mensagem);
    btnLogin.disabled = false;
    btnLogin.innerHTML = `<i class="ti ti-login"></i> Entrar`;
  }
});