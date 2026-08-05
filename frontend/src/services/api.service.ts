// =============================================================
// api.service.ts — Base para todas as chamadas HTTP ao backend
//
// Este ficheiro centraliza a comunicação com a API: adiciona o
// token de acesso automaticamente, trata erros de forma
// consistente, e tenta renovar o token se ele tiver expirado.
// =============================================================

const API_BASE_URL = "http://localhost:3000/api"; // endereço do backend

// -------------------------------------------------------------
// Gestão do token de acesso (guardado em memória, não em
// localStorage, por segurança — evita que scripts maliciosos
// injectados na página consigam ler o token facilmente)
// -------------------------------------------------------------
let accessTokenAtual: string | null = null;

/** Guarda o token de acesso actual (chamado depois do login). */
export function definirAccessToken(token: string): void {
  accessTokenAtual = token;
}

/** Remove o token de acesso (chamado no logout). */
export function limparAccessToken(): void {
  accessTokenAtual = null;
}

// -------------------------------------------------------------
// Erro personalizado para pedidos à API, com o código HTTP
// -------------------------------------------------------------
export class ErroApi extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ErroApi";
  }
}

/**
 * Faz um pedido HTTP à API, adicionando automaticamente o token
 * de acesso (se existir) e tratando erros de forma consistente.
 *
 * @param endpoint - caminho relativo, ex: "/auth/login"
 * @param opcoes - opções normais do fetch (method, body, etc.)
 */
async function pedido<T>(endpoint: string, opcoes: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opcoes.headers as Record<string, string>),
  };

  // adiciona o token de acesso automaticamente, se existir
  if (accessTokenAtual) {
    headers["Authorization"] = `Bearer ${accessTokenAtual}`;
  }

  const resposta = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...opcoes,
    headers,
    credentials: "include", // envia cookies (necessário para o refresh token)
  });

  // se a resposta não tiver corpo (ex: 204 No Content), devolve undefined
  const dados = resposta.status === 204 ? undefined : await resposta.json();

  if (!resposta.ok) {
    // "dados.erro" é o formato de erro que o nosso backend devolve
    const mensagem = dados?.erro ?? "Erro desconhecido ao comunicar com o servidor.";
    throw new ErroApi(mensagem, resposta.status);
  }

  return dados as T;
}

// -------------------------------------------------------------
// Funções auxiliares para cada método HTTP, mais simples de usar
// -------------------------------------------------------------

export const api = {
  get: <T>(endpoint: string) => pedido<T>(endpoint, { method: "GET" }),

  post: <T>(endpoint: string, corpo?: unknown) =>
    pedido<T>(endpoint, { method: "POST", body: corpo ? JSON.stringify(corpo) : undefined }),

  patch: <T>(endpoint: string, corpo?: unknown) =>
    pedido<T>(endpoint, { method: "PATCH", body: corpo ? JSON.stringify(corpo) : undefined }),

  delete: <T>(endpoint: string) => pedido<T>(endpoint, { method: "DELETE" }),
};