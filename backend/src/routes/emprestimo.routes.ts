import { Router } from "express"; // Router do Express para criar grupos de rotas
import * as emprestimoController from "../controllers/emprestimo.controller"; // funções do controller
import { autenticar } from "../middlewares/auth.middleware"; // middleware de autenticação
import { verificarPerfil } from "../middlewares/role.middleware"; // middleware de permissão por perfil

const router = Router(); // cria um grupo de rotas para empréstimos

// -------------------------------------------------------------
// TIPOS DE CRÉDITO
// -------------------------------------------------------------

// GET /api/tipos-emprestimo — lista tipos (público, sem autenticação, usado no simulador)
router.get("/tipos-emprestimo", emprestimoController.listarTipos);

// PATCH /api/tipos-emprestimo/:id — ADMIN altera taxas/prazos/valores
router.patch(
  "/tipos-emprestimo/:id",
  autenticar,
  verificarPerfil("ADMIN"),
  emprestimoController.atualizarTipo
);

// GET /api/tipos-emprestimo/:id/historico — ADMIN vê histórico de alterações
router.get(
  "/tipos-emprestimo/:id/historico",
  autenticar,
  verificarPerfil("ADMIN"),
  emprestimoController.historicoTipo
);

// -------------------------------------------------------------
// SIMULAÇÃO
// -------------------------------------------------------------

// POST /api/emprestimos/simular — simula sem criar pedido (público)
router.post("/emprestimos/simular", emprestimoController.simular);

// -------------------------------------------------------------
// PEDIDOS DE EMPRÉSTIMO
// -------------------------------------------------------------

// POST /api/emprestimos — CLIENTE cria um novo pedido
router.post(
  "/emprestimos",
  autenticar,
  verificarPerfil("CLIENTE"),
  emprestimoController.criar
);

// GET /api/emprestimos — lista pedidos (qualquer perfil autenticado, filtrado no service)
router.get("/emprestimos", autenticar, emprestimoController.listar);

// GET /api/emprestimos/:id — detalhe de um pedido (qualquer perfil autenticado)
router.get("/emprestimos/:id", autenticar, emprestimoController.buscar);

// PATCH /api/emprestimos/:id/encaminhar — FUNCIONÁRIO encaminha ao gerente
router.patch(
  "/emprestimos/:id/encaminhar",
  autenticar,
  verificarPerfil("FUNCIONARIO"),
  emprestimoController.encaminhar
);

// PATCH /api/emprestimos/:id/aprovar — GERENTE aprova
router.patch(
  "/emprestimos/:id/aprovar",
  autenticar,
  verificarPerfil("GERENTE"),
  emprestimoController.aprovar
);

// PATCH /api/emprestimos/:id/rejeitar — GERENTE rejeita
router.patch(
  "/emprestimos/:id/rejeitar",
  autenticar,
  verificarPerfil("GERENTE"),
  emprestimoController.rejeitar
);

export default router; // exporta o grupo de rotas para ser registado no app.ts