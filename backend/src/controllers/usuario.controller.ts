import { Request, Response } from "express"; // tipos do Express
import { criarUsuarioSchema, atualizarUsuarioSchema } from "../validators/usuario.validator"; // schemas de validação
import * as usuarioService from "../services/usuario.service"; // lógica de negócio

/**
 * GET /api/usuarios
 * ADMIN — lista todos os utilizadores do sistema.
 */
export async function listar(req: Request, res: Response): Promise<void> {
  try {
    const usuarios = await usuarioService.listarUsuarios();
    res.status(200).json(usuarios);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao listar utilizadores.";
    res.status(500).json({ erro: mensagem });
  }
}

/**
 * POST /api/usuarios
 * ADMIN — cria um novo utilizador (funcionário, gerente ou admin).
 */
export async function criar(req: Request, res: Response): Promise<void> {
  const validacao = criarUsuarioSchema.safeParse(req.body);
  if (!validacao.success) {
    res.status(400).json({ erro: "Dados inválidos.", detalhes: validacao.error.flatten() });
    return;
  }

  try {
    const novoUsuario = await usuarioService.criarUsuario(validacao.data);
    res.status(201).json(novoUsuario);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao criar utilizador.";
    res.status(400).json({ erro: mensagem });
  }
}

/**
 * PATCH /api/usuarios/:id
 * ADMIN — actualiza dados de um utilizador existente.
 */
export async function atualizar(req: Request, res: Response): Promise<void> {
  const id = Number(req.params["id"]); // lê o id da URL

  const validacao = atualizarUsuarioSchema.safeParse(req.body);
  if (!validacao.success) {
    res.status(400).json({ erro: "Dados inválidos.", detalhes: validacao.error.flatten() });
    return;
  }

  try {
    const usuarioAtualizado = await usuarioService.atualizarUsuario(id, validacao.data);
    res.status(200).json(usuarioAtualizado);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao actualizar utilizador.";
    res.status(400).json({ erro: mensagem });
  }
}

/**
 * PATCH /api/usuarios/:id/desativar
 * ADMIN — desactiva a conta de um utilizador.
 */
export async function desativar(req: Request, res: Response): Promise<void> {
  const id = Number(req.params["id"]);

  try {
    const usuarioDesativado = await usuarioService.desativarUsuario(id);
    res.status(200).json(usuarioDesativado);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao desactivar utilizador.";
    res.status(400).json({ erro: mensagem });
  }
}

/**
 * PATCH /api/usuarios/:id/reativar
 * ADMIN — reactiva a conta de um utilizador previamente desactivada.
 */
export async function reativar(req: Request, res: Response): Promise<void> {
  const id = Number(req.params["id"]);

  try {
    const usuarioReativado = await usuarioService.reativarUsuario(id);
    res.status(200).json(usuarioReativado);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao reactivar utilizador.";
    res.status(400).json({ erro: mensagem });
  }
}