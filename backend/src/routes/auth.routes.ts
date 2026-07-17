import { Router } from "express"; // Router do express para criar grupos de rotas
import * as authController from "../controllers/auth.controller"; //Funções do controller
import { autenticar } from "../middlewares/auth.middleware"; //middleware de autenticação

const router = Router(); // Cria grupo de rotas para autenticação

// POST /api/auth/registro/// Cria nova conta do cliente
router.post("/registro", authController.registro);

//POST/api/auth/login////Faz login e devolve token
router.post("/login",authController.login);

//POST/api/auth/refresh/// 
router.post("/refresh", authController.refresh);

//POST/api/auth/logout///Termina a sessão e invalida o refresh token
router.post("/logout", authController.logout);

//GET/api/auth/me///Devolve dados do utilizador autenticado
router.get("/me", autenticar, authController.me);
export default router; 