// =============================================================
// env.ts — Lê e valida as variáveis de ambiente (do ficheiro .env)
//
// Em vez de usarmos "process.env.PORT" directamente em todo o
// código (o que é arriscado, porque podia estar em falta ou ter
// o tipo errado sem darmos conta), lemos tudo aqui UMA VEZ, com
// o Zod a confirmar que cada valor existe e tem o formato certo.
//
// Se faltar alguma variável obrigatória no .env, o servidor para
// imediatamente ao arrancar, com uma mensagem de erro clara —
// em vez de falhar de forma confusa mais tarde, a meio de um pedido.
// =============================================================

import { z} from "zod";
import dotenv from "dotenv";

// Carrega o ficheiro .env para dentro de process.env
dotenv.config();

// Define o "molde" (schema) de como esperamos que as variáveis
// de ambiente estejam preenchidas.
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatório"),

  PORT: z
    .string()
    .default("3000")
    .transform((valor) => parseInt(valor, 10)), // vem como texto do .env, convertemos para número

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET deve ter pelo menos 32 caracteres"),

  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET deve ter pelo menos 32 caracteres"),

  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  FRONTEND_URL: z.string().default("http://localhost:5500"),
});

// Corre a validação. Se algo estiver errado ou em falta, o Zod
// lança um erro detalhado, e nós paramos o servidor de imediato.
const resultado = envSchema.safeParse(process.env);

if (!resultado.success) {
  console.error("❌ Erro nas variáveis de ambiente (.env):");
  console.error(resultado.error.format());
  process.exit(1); // para o programa, porque não há como continuar em segurança
}

// Exportamos o objecto já validado e com os tipos certos, para
// ser usado em todo o resto do backend.
// Ex: import { env } from "./config/env"; depois usar env.PORT
export const env = resultado.data;