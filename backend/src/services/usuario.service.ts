import bcrypt from "bcryptjs"; // para encriptar passwords
import { prisma } from "../config/database"; // ligação à base de dados
import type { CriarUsuarioInput, AtualizarUsuarioInput } from "../validators/usuario.validator"; // tipos de entrada

/**
 * ADMIN — lista todos os utilizadores do sistema.
 * Não devolve a senhaHash, por segurança (nunca sai da base de dados).
 */
export async function listarUsuarios() {
  return prisma.usuario.findMany({
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      ativo: true,
      telefone: true,
      dataCriacao: true,
      // senhaHash NÃO é seleccionada — nunca sai da base de dados
    },
    orderBy: { dataCriacao: "desc" }, // mais recente primeiro
  });
}

/**
 * ADMIN — cria um novo utilizador (funcionário, gerente ou admin).
 * Clientes registam-se sozinhos pela rota pública de registo,
 * por isso esta função nunca cria perfil CLIENTE.
 */
export async function criarUsuario(dados: CriarUsuarioInput) {
  // 1. Verifica se já existe um utilizador com este email
  const emailJaExiste = await prisma.usuario.findUnique({
    where: { email: dados.email },
  });

  if (emailJaExiste) {
    throw new Error("Este email já está registado.");
  }

  // 2. Encripta a password antes de guardar
  const senhaHash = await bcrypt.hash(dados.senha, 12);

  // 3. Cria o utilizador
  const novoUsuario = await prisma.usuario.create({
    data: {
      nome: dados.nome,
      email: dados.email,
      senhaHash,
      perfil: dados.perfil,
      ativo: true,
    },
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      ativo: true,
      dataCriacao: true,
      // senhaHash não é devolvida
    },
  });

  return novoUsuario;
}

/**
 * ADMIN — actualiza dados de um utilizador existente.
 */
export async function atualizarUsuario(id: number, dados: AtualizarUsuarioInput) {
  // se o email estiver a ser alterado, confirma que o novo não está em uso por outro utilizador
  if (dados.email) {
    const emailEmUso = await prisma.usuario.findFirst({
      where: { email: dados.email, NOT: { id } }, // procura noutro utilizador que não este
    });

    if (emailEmUso) {
      throw new Error("Este email já está em uso por outro utilizador.");
    }
  }

  const usuarioAtualizado = await prisma.usuario.update({
    where: { id },
    data: dados,
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      ativo: true,
      telefone: true,
      endereco: true,
    },
  });

  return usuarioAtualizado;
}

/**
 * ADMIN — desactiva a conta de um utilizador (nunca apagamos,
 * para preservar o histórico de empréstimos, pagamentos, etc.
 * associados a esse utilizador).
 */
export async function desativarUsuario(id: number) {
  const usuarioDesativado = await prisma.usuario.update({
    where: { id },
    data: { ativo: false },
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      ativo: true,
    },
  });

  return usuarioDesativado;
}

/**
 * ADMIN — reactiva uma conta previamente desactivada.
 */
export async function reativarUsuario(id: number) {
  const usuarioReativado = await prisma.usuario.update({
    where: { id },
    data: { ativo: true },
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      ativo: true,
    },
  });

  return usuarioReativado;
}