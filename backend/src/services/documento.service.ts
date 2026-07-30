import path from "path"; // utilitário do Node para lidar com caminhos de ficheiros
import fs from "fs"; // utilitário do Node para lidar com o sistema de ficheiros
import { prisma } from "../config/database"; // ligação à base de dados

/**
 * Regista um documento na base de dados, associado a um pedido de
 * empréstimo. O ficheiro em si já foi guardado no disco pelo Multer;
 * aqui só guardamos a referência (caminho, nome original, tipo).
 */
export async function registarDocumento(
  emprestimoId: number,
  tipo: string,
  nomeOriginal: string,
  caminho: string
) {
  // confirma que o pedido de empréstimo existe antes de associar o documento
  const emprestimo = await prisma.emprestimo.findUnique({ where: { id: emprestimoId } });

  if (!emprestimo) {
    throw new Error("Pedido de empréstimo não encontrado.");
  }

  return prisma.documento.create({
    data: {
      emprestimoId,
      tipo,
      nomeOriginal,
      caminho,
    },
  });
}

/**
 * Lista todos os documentos associados a um pedido de empréstimo.
 */
export async function listarDocumentos(emprestimoId: number) {
  return prisma.documento.findMany({
    where: { emprestimoId },
    orderBy: { dataUpload: "asc" },
  });
}

/**
 * Busca um documento pelo id, e confirma que o ficheiro ainda
 * existe fisicamente no disco antes de o devolver para download.
 */
export async function buscarDocumentoParaDownload(documentoId: number) {
  const documento = await prisma.documento.findUnique({ where: { id: documentoId } });

  if (!documento) {
    throw new Error("Documento não encontrado.");
  }

  const caminhoCompleto = path.join(__dirname, "../../uploads", path.basename(documento.caminho));

  if (!fs.existsSync(caminhoCompleto)) {
    throw new Error("Ficheiro não encontrado no servidor.");
  }

  return { documento, caminhoCompleto };
}