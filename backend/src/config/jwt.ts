// jwt.ts — Criação e verificação de tokens JWT
//
// Temos dois tipos de token:
//- Access Token: dura pouco (15 min), enviado em quase todos os pedidos para provar "quem sou eu".
//- Refresh Token: dura mais (7 dias), serve só para gerar um novo Access Token quando o anterior expira.

import jwt from "jsonwebtoken";
import { env } from "./env";

export interface PayloadToken {
  usuarioId: number;
  perfil: "ADMIN" | "GERENTE" | "FUNCIONARIO" | "CLIENTE";
}

/**
 * Cria um novo Access Token .
 * @param payload - dados do utilizador a incluir no token
 * @returns o token assinado, como texto (string)
 */
export function gerarAccessToken(payload: PayloadToken): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
}

/**
 * Cria um novo Refresh Token .
 * @param payload - dados do utilizador a incluir no token
 * @returns o token assinado, como texto (string)
 */
export function gerarRefreshToken(payload: PayloadToken): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

/**
 * Verifica se um Access Token é válido (assinatura correta e
 * ainda não expirou). Se for válido, devolve os dados guardados
 * dentro dele. Se não for válido, lança um erro.
 * @param token - o token recebido do cliente
 * @returns os dados do utilizador guardados no token
 */
export function verificarAccessToken(token: string): PayloadToken {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as PayloadToken;
}

/**
 * Verifica se um Refresh Token é válido (assinatura correta e
 * ainda não expirou). Se for válido, devolve os dados guardados
 * dentro dele. Se não for válido, lança um erro.
 * @param token - o token recebido do cliente (normalmente via cookie)
 * @returns os dados do utilizador guardados no token
 */
export function verificarRefreshToken(token: string): PayloadToken {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as PayloadToken;
}