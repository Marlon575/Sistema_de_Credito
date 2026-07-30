import { Request, Response } from "express"; // tipos do Express
import { prisma } from "../config/database"; // para buscar o nome real do utilizador autenticado
import { registarPagamentoSchema } from "../validators/pagamento.validator"; // schema de validação
import * as pagamentoService from "../services/pagamento.service"; // lógica de negócio

/**
 * Busca o nome do utilizador autenticado, para registar quem
 * efectivamente processou o pagamento no sistema.
 */
async function buscarNomeUsuario(usuarioId: number): Promise<string> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { nome: true },
  });
  return usuario?.nome ?? "Utilizador desconhecido";
}

/**
 * POST /api/pagamentos
 * Regista o pagamento de uma prestação.
 */
export async function registar(req: Request, res: Response): Promise<void> {
  const validacao = registarPagamentoSchema.safeParse(req.body);
  if (!validacao.success) {
    res.status(400).json({ erro: "Dados inválidos.", detalhes: validacao.error.flatten() });
    return;
  }

  try {
    const usuarioId = req.usuarioId as number; // vem do middleware "autenticar"
    const nomeUsuario = await buscarNomeUsuario(usuarioId);

    const pagamento = await pagamentoService.registarPagamento(validacao.data, nomeUsuario);
    res.status(201).json(pagamento);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao registar pagamento.";
    res.status(400).json({ erro: mensagem });
  }
}

/**
 * GET /api/pagamentos/emprestimo/:emprestimoId
 * Lista os pagamentos de um empréstimo específico.
 */
export async function listar(req: Request, res: Response): Promise<void> {
  const emprestimoId = Number(req.params["emprestimoId"]);

  try {
    const pagamentos = await pagamentoService.listarPagamentos(emprestimoId);
    res.status(200).json(pagamentos);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao listar pagamentos.";
    res.status(500).json({ erro: mensagem });
  }
}