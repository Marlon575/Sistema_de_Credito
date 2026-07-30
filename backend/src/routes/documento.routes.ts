import { Router } from "express"; // Router do Express para criar grupos de rotas
import * as documentoController from "../controllers/documento.controller"; // funções do controller
import { autenticar } from "../middlewares/auth.middleware"; // middleware de autenticação
import { upload } from "../middlewares/upload.middleware"; // middleware do Multer

const router = Router(); // cria um grupo de rotas para documentos

// POST /api/documentos/upload/:emprestimoId — envia um documento
// "upload.single('ficheiro')" diz ao Multer para esperar um único
// ficheiro, enviado num campo chamado "ficheiro" no formulário
router.post(
  "/upload/:emprestimoId",
  autenticar,
  upload.single("ficheiro"),
  documentoController.upload
);

// GET /api/documentos/emprestimo/:emprestimoId — lista documentos de um pedido
router.get("/emprestimo/:emprestimoId", autenticar, documentoController.listar);

// GET /api/documentos/:id/download — descarrega um documento (protegido)
router.get("/:id/download", autenticar, documentoController.download);

export default router; // exporta o grupo de rotas para ser registado no app.tss