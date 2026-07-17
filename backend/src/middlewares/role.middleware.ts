import { Request, Response, NextFunction } from "express"; // tipos do Express

/**
 * Middleware de perfil — verifica se o utilizador tem o perfil necessário.
 * Usado depois do middleware "autenticar", que já garantiu que o token é válido.
 *
 * Exemplo de uso numa rota:
 *   router.patch("/aprovar", autenticar, verificarPerfil("GERENTE"), controller)
 *
 * @param perfisPermitidos - lista de perfis que têm acesso à rota
 */
export function verificarPerfil(...perfisPermitidos: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const perfil = req.usuarioPerfil; // perfil guardado pelo middleware "autenticar"

    if (!perfil) {
      res.status(401).json({ erro: "Não autenticado." }); // autenticar não correu antes
      return;
    }

    if (!perfisPermitidos.includes(perfil)) {
      res.status(403).json({ // 403 = proibido (autenticado mas sem permissão)
        erro: `Acesso negado. Esta acção requer perfil: ${perfisPermitidos.join(" ou ")}.`,
      });
      return;
    }

    next(); // perfil autorizado — passa para a rota seguinte
  };
}