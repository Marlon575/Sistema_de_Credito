import { Request, Response } from "express"; // tipos do Express
import * as notificacaoService from "../services/notificacao.service"; // lógica de negócio

/**
 * GET /api/notificacoes
 * Lista as notificações do utilizador autenticado.
 */
export async function listar(req: Request, res: Response): Promise<void> {
  try {
    const usuarioId = req.usuarioId as number; // vem do middleware "autenticar"
    const notificacoes = await notificacaoService.listarNotificacoes(usuarioId);
    res.status(200).json(notificacoes);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao listar notificações.";
    res.status(500).json({ erro: mensagem });
  }
}

/**
 * PATCH /api/notificacoes/:id/lida
 * Marca uma notificação como lida.
 */
export async function marcarLida(req: Request, res: Response): Promise<void> {
  const id = Number(req.params["id"]);

  try {
    const usuarioId = req.usuarioId as number;
    const notificacao = await notificacaoService.marcarComoLida(id, usuarioId);
    res.status(200).json(notificacao);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao marcar notificação como lida.";
    res.status(400).json({ erro: mensagem });
  }
}

/**
 * GET /api/notificacoes/contagem
 * Devolve quantas notificações por ler o utilizador tem.
 */
export async function contarNaoLidas(req: Request, res: Response): Promise<void> {
  try {
    const usuarioId = req.usuarioId as number;
    const total = await notificacaoService.contarNaoLidas(usuarioId);
    res.status(200).json({ total });
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao contar notificações.";
    res.status(500).json({ erro: mensagem });
  }
}