import { login } from "../../services/auth.service";
import { ErroApi } from "../../services/api.service";
import type { Usuario } from "../../models/Usuario";

const ROTAS_POR_PERFIL: Record<Usuario["perfil"], string> = {
    ADMIN: "/admin/dashboard.html",
    GERENTE: "/gerente/dashboard.html",
    FUNCIONARIO: "/funcionario/dashboard.html",
    CLIENTE: "/cliente/dashboard.html",
};

export async function fazerLogin(email: string, senha: string): Promise<string> {
  // validação simples do lado do cliente, antes de chamar a API
    if (!email.trim() || !senha.trim()) {
    throw new Error("Preenche o email e a senha.");
    }

    try {
    const usuario = await login(email, senha);
    return ROTAS_POR_PERFIL[usuario.perfil];
    } catch (erro) {
    // traduzimos erros técnicos da API para mensagens amigáveis
    if (erro instanceof ErroApi) {
        if (erro.status === 401) {
        throw new Error("Email ou senha incorrectos.");
        }
        throw new Error(erro.message);
    }
    throw new Error("Não foi possível ligar ao servidor. Tenta novamente.");
    }
}