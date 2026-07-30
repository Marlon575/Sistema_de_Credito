import multer from "multer"; // biblioteca para lidar com upload de ficheiros
import path from "path"; // utilitário do Node para lidar com caminhos de ficheiros
import fs from "fs"; // utilitário do Node para lidar com o sistema de ficheiros

// pasta onde os documentos enviados vão ser guardados
const PASTA_UPLOADS = path.join(__dirname, "../../uploads");

// garante que a pasta existe (caso alguém a tenha apagado por engano)
if (!fs.existsSync(PASTA_UPLOADS)) {
  fs.mkdirSync(PASTA_UPLOADS, { recursive: true });
}

// configuração de onde e como guardar os ficheiros
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, PASTA_UPLOADS); // todos os ficheiros vão para a pasta uploads/
  },
  filename: (req, file, callback) => {
    // gera um nome único para evitar que dois uploads com o mesmo nome se sobreponham
    // ex: "1719999999999-123456789.pdf"
    const sufixoUnico = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extensao = path.extname(file.originalname); // ex: ".pdf", ".jpg"
    callback(null, `${sufixoUnico}${extensao}`);
  },
});

// filtro que só aceita os tipos de ficheiro permitidos
function filtroTipoFicheiro(
  req: Express.Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
): void {
  const tiposPermitidos = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

  if (tiposPermitidos.includes(file.mimetype)) {
    callback(null, true); // aceita o ficheiro
  } else {
    callback(new Error("Tipo de ficheiro não permitido. Só são aceites PDF, JPG e PNG."));
  }
}

// exporta o middleware configurado, pronto a usar nas rotas
export const upload = multer({
  storage,
  fileFilter: filtroTipoFicheiro,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo, em bytes
  },
});