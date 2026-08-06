// auth.service.ts - Chamadas à API para com autenticação
import { api, definirAccessToken, limparAccessToken } from "./api.service";
import type { Usuario } from "../models/Usuario";


export interface RespostaAuth{
    accessToken: string;
    usuario: Usuario;
}

export async function login(email: string, senha: string): Promise<Usuario> {
    const resposta = await api.post<RespostaAuth>("/auth/login", {email,senha});
    definirAccessToken(resposta.accessToken);
    return resposta.usuario;
}

//Regista um novo cliente. Se for bem sucedido, o utilizador//fica automaticamente autenticado (tal como no login).
export async function registo(dados: {
    nome: string;
    email: string;
    senha: string;
    bi?: string;
    telefone?: string;
    endereco?: string;
    rendimentoMensal?: number;
    tipoEmprego?: string;
    emprego?: string;
}): Promise<Usuario> {
    const resposta = await api.post<RespostaAuth>("/auth/registro", dados);
    definirAccessToken(resposta.accessToken);
    return resposta.usuario;
}

export async function logout(): Promise<void>{
    await api.post("/auth/logout");
    limparAccessToken();
}

export async function tentarRenovarSessao():Promise<boolean> {
    try{
        const resposta = await api.post<{accessToken: string}>("/auth/refresh");
        definirAccessToken(resposta.accessToken);
        return true;
    } catch{
        return false;
    }
}

export async function obterUtilizadorAtual(): Promise<{ usuarioId: number; perfil: string}>{
    return api.get("/auth/me");
}