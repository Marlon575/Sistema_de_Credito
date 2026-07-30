import { Router } from "express"; // Router do Express para criar grupos de rotas
import * as notificacaoController from "../controllers/notificacao.controller"; // funções do controller
import { autenticar } from "../middlewares/auth.middleware"; // middleware de autenticação

const router = Router(); // cria um grupo de rotas para notificações

// Todas as rotas de notificações exigem apenas autenticação
// (qualquer perfil pode ver e gerir as suas próprias notificações)

// GET /api/notificacoes — lista notificações do utilizador autenticado
router.get("/", autenticar, notificacaoController.listar);

// GET /api/notificacoes/contagem — conta notificações por ler
router.get("/contagem", autenticar, notificacaoController.contarNaoLidas);

// PATCH /api/notificacoes/:id/lida — marca uma notificação como lida
router.patch("/:id/lida", autenticar, notificacaoController.marcarLida);

export default router; // exporta o grupo de rotas para ser registado no app.ts

