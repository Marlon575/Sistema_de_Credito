// =============================================================
// app.ts — Ponto de entrada do backend CréditoMZ
//
// Este ficheiro:
//   1. Cria a aplicação Express (o "motor" que recebe pedidos HTTP)
//   2. Configura middlewares globais (CORS, leitura de JSON, cookies)
//   3. Define uma rota de teste para confirmar que o servidor está a funcionar
//   4. Liga o servidor numa porta, para começar a aceitar pedidos
//
// Para arrancar o servidor em modo de desenvolvimento:
//   npm run dev
// =============================================================

import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";

// Cria a aplicação Express. É este objecto "app" que vai gerir
// todos os pedidos que chegam ao nosso servidor.
const app = express();

// -------------------------------------------------------------
// MIDDLEWARES GLOBAIS
// Middlewares são funções que correm ANTES dos nossos
// controllers, para cada pedido que chega ao servidor.
// -------------------------------------------------------------

// CORS: permite que o frontend (que corre num endereço diferente,
// ex: http://localhost:5500) possa fazer pedidos a este backend.
// Sem isto, o browser bloquearia os pedidos por segurança.
app.use(
  cors({
    origin: env.FRONTEND_URL, // só aceita pedidos vindos deste endereço
    credentials: true, // permite o envio de cookies (usados no refresh token)
  })
);

// Permite que o Express entenda pedidos com corpo em formato JSON
// (ex: quando o frontend envia { "email": "...", "senha": "..." })
app.use(express.json());

// Permite ler cookies enviados pelo browser (vamos usar isto para
// o refresh token, guardado num cookie httpOnly por segurança).
app.use(cookieParser());

// -------------------------------------------------------------
// ROTA DE TESTE (health check)
// Serve para confirmar rapidamente que o servidor está "vivo".
// Mais tarde vamos adicionar aqui as rotas reais (/api/auth,
// /api/emprestimos, etc.), mas esta fica sempre disponível.
// -------------------------------------------------------------
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    mensagem: "Backend CréditoMZ está a funcionar.",
    ambiente: env.NODE_ENV,
    dataHora: new Date().toISOString(),
  });
});

// -------------------------------------------------------------
// ARRANCAR O SERVIDOR
// Diz ao Express para começar a "escutar" pedidos na porta
// definida no .env (por defeito, 3000).
// -------------------------------------------------------------
app.listen(env.PORT, () => {
  console.log(`✓ Servidor CréditoMZ a correr em http://localhost:${env.PORT}`);
  console.log(`✓ Ambiente: ${env.NODE_ENV}`);
  console.log(`✓ Testa em: http://localhost:${env.PORT}/api/health`);
});