import { Router } from "express"; // Router do Express para criar grupos de rotas
import * as usuarioController from "../controllers/usuario.controller"; // funções do controller
import { autenticar } from "../middlewares/auth.middleware"; // middleware de autenticação
import { verificarPerfil } from "../middlewares/role.middleware"; // middleware de permissão por perfil

const router = Router(); // cria um grupo de rotas para gestão de utilizadores

// Todas as rotas de utilizadores exigem autenticação E perfil ADMIN
// (aplicamos os dois middlewares em todas as rotas deste ficheiro)

// GET /api/usuarios — lista todos os utilizadores
router.get("/", autenticar, verificarPerfil("ADMIN"), usuarioController.listar);

// POST /api/usuarios — cria novo utilizador (funcionário, gerente ou admin)
router.post("/", autenticar, verificarPerfil("ADMIN"), usuarioController.criar);

// PATCH /api/usuarios/:id — actualiza dados de um utilizador
router.patch("/:id", autenticar, verificarPerfil("ADMIN"), usuarioController.atualizar);

// PATCH /api/usuarios/:id/desativar — desactiva a conta
router.patch("/:id/desativar", autenticar, verificarPerfil("ADMIN"), usuarioController.desativar);

// PATCH /api/usuarios/:id/reativar — reactiva a conta
router.patch("/:id/reativar", autenticar, verificarPerfil("ADMIN"), usuarioController.reativar);

export default router; // exporta o grupo de rotas para ser registado no app.ts