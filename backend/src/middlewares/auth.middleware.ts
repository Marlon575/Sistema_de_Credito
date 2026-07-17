import { Request, Response, NextFunction } from "express"; // tipos do Express
import { verificarAccessToken } from "../config/jwt"; // função de verificação do token

// extende o tipo Request do Express para incluir os dados do utilizador autenticado
declare global {
  namespace Express {
    interface Request {
      usuarioId?: number; // id do utilizador autenticado
      usuarioPerfil?: "ADMIN" | "GERENTE" | "FUNCIONARIO" | "CLIENTE"; // perfil do utilizador
    }
  }
}

/**
 * Middleware de autenticação — verifica se o token JWT é válido.
 * Corre antes de qualquer rota protegida.
 * Se o token for válido, passa para a rota seguinte (next()).
 * Se não for válido, devolve erro 401.
 */
export function autenticar(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization; // lê o header "Authorization: Bearer <token>"

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ erro: "Token de acesso não fornecido." }); // sem token, acesso negado
    return;
  }

  const token = authHeader.split(" ")[1]; // extrai só o token, removendo o "Bearer "

  try {
    const payload = verificarAccessToken(token); // verifica assinatura e validade
    req.usuarioId = payload.usuarioId; // guarda o id no pedido para as rotas usarem
    req.usuarioPerfil = payload.perfil; // guarda o perfil no pedido para as rotas usarem
    next(); // token válido — passa para a rota seguinte
  } catch {
    res.status(401).json({ erro: "Token de acesso inválido ou expirado." }); // token inválido
  }
}