import { prisma } from "../config/database"; // ligação à base de dados

/**
 * Lista as notificações de um utilizador, mais recentes primeiro.
 */
export async function listarNotificacoes(usuarioId: number) {
  return prisma.notificacao.findMany({
    where: { usuarioId },
    orderBy: { data: "desc" },
  });
}

/**
 * Marca uma notificação como lida.
 * Verifica que a notificação pertence mesmo ao utilizador que pede
 * (para um utilizador não conseguir marcar notificações de outro).
 */
export async function marcarComoLida(notificacaoId: number, usuarioId: number) {
  const notificacao = await prisma.notificacao.findUnique({ where: { id: notificacaoId } });

  if (!notificacao) {
    throw new Error("Notificação não encontrada.");
  }

  if (notificacao.usuarioId !== usuarioId) {
    throw new Error("Não tem permissão para alterar esta notificação.");
  }

  return prisma.notificacao.update({
    where: { id: notificacaoId },
    data: { lida: true },
  });
}

/**
 * Conta quantas notificações por ler um utilizador tem.
 * Útil para mostrar um "badge" com o número no frontend.
 */
export async function contarNaoLidas(usuarioId: number): Promise<number> {
  return prisma.notificacao.count({
    where: { usuarioId, lida: false },
  });
}