import { Request, Response } from "express"; // tipos do Express
import { loginSchema, registoSchema } from "../validators/auth.validator"; // schemas de validação
import * as authService from "../services/auth.service"; // lógica de negócio

/**
 * POST /api/auth/login
 * Recebe email e senha, devolve tokens de acesso.
 */
export async function login(req: Request, res: Response): Promise<void> {
  const validacao = loginSchema.safeParse(req.body); // valida os dados recebidos

  if (!validacao.success) {
    res.status(400).json({ erro: "Dados inválidos.", detalhes: validacao.error.flatten() });
    return;
  }

  try {
    const resultado = await authService.login(validacao.data); // chama o service

    // guarda o refresh token num cookie httpOnly (não acessível por JavaScript no browser)
    res.cookie("refreshToken", resultado.refreshToken, {
      httpOnly: true, // protege contra ataques XSS
      secure: process.env["NODE_ENV"] === "production", // só HTTPS em produção
      sameSite: "strict", // protege contra ataques CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias em milissegundos
    });

    res.status(200).json({
      accessToken: resultado.accessToken, // enviado no body para o frontend guardar
      usuario: resultado.usuario,
    });
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao fazer login.";
    res.status(401).json({ erro: mensagem });
  }
}

/**
 * POST /api/auth/registro
 * Cria uma nova conta de cliente.
 */
export async function registro(req: Request, res: Response): Promise<void> {
  const validacao = registoSchema.safeParse(req.body); // valida os dados recebidos

  if (!validacao.success) {
    res.status(400).json({ erro: "Dados inválidos.", detalhes: validacao.error.flatten() });
    return;
  }

  try {
    const resultado = await authService.registo(validacao.data); // chama o service

    res.cookie("refreshToken", resultado.refreshToken, {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ // 201 = criado com sucesso
      accessToken: resultado.accessToken,
      usuario: resultado.usuario,
    });
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao registar.";
    res.status(400).json({ erro: mensagem });
  }
}

/**
 * POST /api/auth/refresh
 * Usa o refresh token (do cookie) para gerar um novo access token.
 */
export async function refresh(req: Request, res: Response): Promise<void> {
  const refreshToken = req.cookies["refreshToken"] as string | undefined; // lê o cookie

  if (!refreshToken) {
    res.status(401).json({ erro: "Refresh token não encontrado." });
    return;
  }

  try {
    const resultado = await authService.refresh(refreshToken); // chama o service
    res.status(200).json({ accessToken: resultado.accessToken });
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao renovar sessão.";
    res.status(401).json({ erro: mensagem });
  }
}

/**
 * POST /api/auth/logout
 * Invalida o refresh token e limpa o cookie.
 */
export async function logout(req: Request, res: Response): Promise<void> {
  const refreshToken = req.cookies["refreshToken"] as string | undefined; // lê o cookie

  if (refreshToken) {
    await authService.logout(refreshToken); // remove o token da BD
  }

  res.clearCookie("refreshToken"); // limpa o cookie do browser
  res.status(200).json({ mensagem: "Sessão terminada com sucesso." });
}

/**
 * GET /api/auth/me
 * Devolve os dados do utilizador actualmente autenticado.
 * Esta rota é protegida pelo middleware "autenticar".
 */
export async function me(req: Request, res: Response): Promise<void> {
  res.status(200).json({
    usuarioId: req.usuarioId, // guardado pelo middleware autenticar
    perfil: req.usuarioPerfil,
  });
}