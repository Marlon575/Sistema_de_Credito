// Usuario.ts — Interface que descreve os dados de um utilizador
export type Perfil = "ADMIN" | "GERENTE" | "FUNCIONARIO" | "CLIENTE";


export interface Usuario {
    id: number;
    nome: string;
    email: string;
    perfil: Perfil
}


export interface UsuarioCompleto extends Usuario{
    ativo: boolean;
    telefone?: string;
    endereco?: string;
    bi?: string;
    rendimentoMensal?: number;
    tipoEmprego?: string
    emprego?: string
    dataCriacao: string; //texto ISO
}