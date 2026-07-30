import { Request, Response } from "express"; // tipos do Express
import * as documentoService from "../services/documento.service"; // lógica de negócio

/**
 * POST /api/documentos/upload/:emprestimoId
 * Recebe um ficheiro (via Multer, já processado antes deste controller
 * correr) e regista-o na base de dados, associado ao pedido de empréstimo.
 * O campo "tipo" (ex: "BI", "Comprovativo de Rendimento") vem no body.
 */
export async function upload(req: Request, res: Response): Promise<void> {
  const emprestimoId = Number(req.params["emprestimoId"]); // lê o id da URL
  const { tipo } = req.body as { tipo?: string };

  // req.file é preenchido pelo middleware Multer, que corre antes deste controller
  if (!req.file) {
    res.status(400).json({ erro: "Nenhum ficheiro foi enviado." });
    return;
  }

  if (!tipo) {
    res.status(400).json({ erro: "O tipo de documento é obrigatório (ex: BI, Comprovativo)." });
    return;
  }

  try {
    const documento = await documentoService.registarDocumento(
      emprestimoId,
      tipo,
      req.file.originalname, // nome original do ficheiro, tal como o cliente o enviou
      req.file.filename // nome gerado pelo Multer, guardado no disco
    );
    res.status(201).json(documento);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao registar documento.";
    res.status(400).json({ erro: mensagem });
  }
}

/**
 * GET /api/documentos/emprestimo/:emprestimoId
 * Lista todos os documentos associados a um pedido de empréstimo.
 */
export async function listar(req: Request, res: Response): Promise<void> {
  const emprestimoId = Number(req.params["emprestimoId"]);

  try {
    const documentos = await documentoService.listarDocumentos(emprestimoId);
    res.status(200).json(documentos);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao listar documentos.";
    res.status(500).json({ erro: mensagem });
  }
}

/**
 * GET /api/documentos/:id/download
 * Serve o ficheiro para download. Rota protegida — só utilizadores
 * autenticados podem descarregar documentos (nunca ficam públicos).
 */
export async function download(req: Request, res: Response): Promise<void> {
  const id = Number(req.params["id"]);

  try {
    const { documento, caminhoCompleto } = await documentoService.buscarDocumentoParaDownload(id);
    res.download(caminhoCompleto, documento.nomeOriginal); // envia o ficheiro com o nome original
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao obter documento.";
    res.status(404).json({ erro: mensagem });
  }
}