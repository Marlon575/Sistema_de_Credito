import { Request, Response } from "express"; // tipos do Express
import { prisma } from "../config/database"; // para buscar o nome real do utilizador autenticado
import {
  criarEmprestimoSchema,
  encaminharEmprestimoSchema,
  rejeitarEmprestimoSchema,
  atualizarTipoEmprestimoSchema,
} from "../validators/emprestimo.validator"; // schemas de validação
import * as emprestimoService from "../services/emprestimo.service"; // lógica de negócio

/**
 * Busca o nome do utilizador autenticado, a partir do seu id.
 * Usado para registar o nome real (não só o id) no histórico
 * de acções (ex: "Encaminhado por Maria Silva", não "Funcionário #4").
 */
async function buscarNomeUsuario(usuarioId: number): Promise<string> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { nome: true }, // só precisamos do nome, não do resto dos dados
  });
  return usuario?.nome ?? "Utilizador desconhecido"; // fallback caso o utilizador tenha sido apagado
}

// -------------------------------------------------------------
// TIPOS DE CRÉDITO
// -------------------------------------------------------------

/**
 * GET /api/tipos-emprestimo
 * Lista todos os tipos de crédito. Rota pública (usada no simulador).
 */
export async function listarTipos(req: Request, res: Response): Promise<void> {
  try {
    const tipos = await emprestimoService.listarTiposEmprestimo();
    res.status(200).json(tipos);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao listar tipos de crédito.";
    res.status(500).json({ erro: mensagem });
  }
}

/**
 * PATCH /api/tipos-emprestimo/:id
 * ADMIN — actualiza taxas, prazos ou valores de um tipo de crédito.
 */
export async function atualizarTipo(req: Request, res: Response): Promise<void> {
  const id = Number(req.params["id"]); // lê o id da URL

  const validacao = atualizarTipoEmprestimoSchema.safeParse(req.body);
  if (!validacao.success) {
    res.status(400).json({ erro: "Dados inválidos.", detalhes: validacao.error.flatten() });
    return;
  }

  try {
    const adminId = req.usuarioId as number; // vem do middleware "autenticar"
    const adminNome = await buscarNomeUsuario(adminId);
    const tipoAtualizado = await emprestimoService.atualizarTipoEmprestimo(
      id,
      validacao.data,
      adminId,
      adminNome
    );
    res.status(200).json(tipoAtualizado);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao actualizar tipo de crédito.";
    res.status(400).json({ erro: mensagem });
  }
}

/**
 * GET /api/tipos-emprestimo/:id/historico
 * ADMIN — lista o histórico de alterações de um tipo de crédito.
 */
export async function historicoTipo(req: Request, res: Response): Promise<void> {
  const tipoId = Number(req.params["id"]);

  try {
    const historico = await emprestimoService.listarHistoricoTipoEmprestimo(tipoId);
    res.status(200).json(historico);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao listar histórico.";
    res.status(500).json({ erro: mensagem });
  }
}

// -------------------------------------------------------------
// SIMULAÇÃO (sem criar pedido)
// -------------------------------------------------------------

/**
 * POST /api/emprestimos/simular
 * Calcula a simulação financeira sem criar nenhum pedido.
 * Usado pelo simulador em tempo real na landing page.
 */
export async function simular(req: Request, res: Response): Promise<void> {
  try {
    const { tipoId, valor, prazo } = req.body as { tipoId: number; valor: number; prazo: number };

    const tipo = await emprestimoService.buscarTipoEmprestimo(tipoId);

    if (valor < tipo.valorMin || valor > tipo.valorMax) {
      res.status(400).json({ erro: `O valor deve estar entre ${tipo.valorMin} e ${tipo.valorMax} MT.` });
      return;
    }

    if (prazo < tipo.prazoMin || prazo > tipo.prazoMax) {
      res.status(400).json({ erro: `O prazo deve estar entre ${tipo.prazoMin} e ${tipo.prazoMax} meses.` });
      return;
    }

    const resultado = emprestimoService.calcularSimulacao(valor, prazo, tipo.taxaMensal);
    res.status(200).json(resultado);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao simular empréstimo.";
    res.status(400).json({ erro: mensagem });
  }
}

// -------------------------------------------------------------
// PEDIDOS DE EMPRÉSTIMO
// -------------------------------------------------------------

/**
 * POST /api/emprestimos
 * CLIENTE — cria um novo pedido de crédito.
 */
export async function criar(req: Request, res: Response): Promise<void> {
  const validacao = criarEmprestimoSchema.safeParse(req.body);
  if (!validacao.success) {
    res.status(400).json({ erro: "Dados inválidos.", detalhes: validacao.error.flatten() });
    return;
  }

  try {
    const clienteId = req.usuarioId as number; // vem do middleware "autenticar"
    const { tipoId, valor, prazo } = validacao.data;

    const emprestimo = await emprestimoService.criarEmprestimo(clienteId, tipoId, valor, prazo);
    res.status(201).json(emprestimo);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao criar pedido de crédito.";
    res.status(400).json({ erro: mensagem });
  }
}

/**
 * GET /api/emprestimos
 * Lista pedidos, filtrados pelo perfil de quem consulta.
 */
export async function listar(req: Request, res: Response): Promise<void> {
  try {
    const usuarioId = req.usuarioId as number;
    const perfil = req.usuarioPerfil as string;

    const emprestimos = await emprestimoService.listarEmprestimos(usuarioId, perfil);
    res.status(200).json(emprestimos);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao listar pedidos.";
    res.status(500).json({ erro: mensagem });
  }
}

/**
 * GET /api/emprestimos/:id
 * Busca o detalhe completo de um pedido.
 */
export async function buscar(req: Request, res: Response): Promise<void> {
  const id = Number(req.params["id"]);

  try {
    const emprestimo = await emprestimoService.buscarEmprestimo(id);
    res.status(200).json(emprestimo);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Pedido não encontrado.";
    res.status(404).json({ erro: mensagem });
  }
}

/**
 * PATCH /api/emprestimos/:id/encaminhar
 * FUNCIONÁRIO — encaminha um pedido pendente ao gerente.
 */
export async function encaminhar(req: Request, res: Response): Promise<void> {
  const id = Number(req.params["id"]);

  const validacao = encaminharEmprestimoSchema.safeParse(req.body);
  if (!validacao.success) {
    res.status(400).json({ erro: "Dados inválidos.", detalhes: validacao.error.flatten() });
    return;
  }

  try {
    const funcionarioId = req.usuarioId as number;
    const funcionarioNome = await buscarNomeUsuario(funcionarioId);
    const emprestimo = await emprestimoService.encaminharEmprestimo(
      id,
      validacao.data.observacoes,
      funcionarioId,
      funcionarioNome
    );
    res.status(200).json(emprestimo);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao encaminhar pedido.";
    res.status(400).json({ erro: mensagem });
  }
}

/**
 * PATCH /api/emprestimos/:id/aprovar
 * GERENTE — aprova um pedido em análise.
 */
export async function aprovar(req: Request, res: Response): Promise<void> {
  const id = Number(req.params["id"]);

  try {
    const gerenteId = req.usuarioId as number;
    const gerenteNome = await buscarNomeUsuario(gerenteId);
    const emprestimo = await emprestimoService.aprovarEmprestimo(
      id,
      gerenteId,
      gerenteNome
    );
    res.status(200).json(emprestimo);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao aprovar pedido.";
    res.status(400).json({ erro: mensagem });
  }
}

/**
 * PATCH /api/emprestimos/:id/rejeitar
 * GERENTE — rejeita um pedido em análise, com motivo obrigatório.
 */
export async function rejeitar(req: Request, res: Response): Promise<void> {
  const id = Number(req.params["id"]);

  const validacao = rejeitarEmprestimoSchema.safeParse(req.body);
  if (!validacao.success) {
    res.status(400).json({ erro: "Dados inválidos.", detalhes: validacao.error.flatten() });
    return;
    
  }

  try {
    const gerenteId = req.usuarioId as number;
    const gerenteNome = await buscarNomeUsuario(gerenteId);
    const emprestimo = await emprestimoService.rejeitarEmprestimo(
      id,
      validacao.data.motivo,
      gerenteId,
      gerenteNome
    );
    res.status(200).json(emprestimo);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao rejeitar pedido.";
    res.status(400).json({ erro: mensagem });
  }
}