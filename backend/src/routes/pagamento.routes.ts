import { Router } from "express"; // Router do Express para criar grupos de rotas
import * as pagamentoController from "../controllers/pagamento.controller"; // funções do controller
import { autenticar } from "../middlewares/auth.middleware"; // middleware de autenticação
import { verificarPerfil } from "../middlewares/role.middleware"; // middleware de permissão por perfil

const router = Router(); // cria um grupo de rotas para pagamentos

// POST /api/pagamentos — regista um pagamento (funcionário, gerente ou admin)
router.post(
  "/",
  autenticar,
  verificarPerfil("FUNCIONARIO", "GERENTE", "ADMIN"),
  pagamentoController.registar
);

// GET /api/pagamentos/emprestimo/:emprestimoId — lista pagamentos de um empréstimo
router.get("/emprestimo/:emprestimoId", autenticar, pagamentoController.listar);

export default router; // exporta o grupo de rotas para ser registado no app.ts