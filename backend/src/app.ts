import express, { Request, Response } from "express"; // framework HTTP
import cors from "cors"; // permite pedidos do frontend
import cookieParser from "cookie-parser"; // permite ler cookies
import { env } from "./config/env"; // variáveis de ambiente validadas
import authRoutes from "./routes/auth.routes"; // rotas de autenticação

const app = express(); // cria a aplicação Express

// middlewares globais
app.use(cors({
  origin: env.FRONTEND_URL, // só aceita pedidos deste endereço
  credentials: true, // permite cookies
}));
app.use(express.json()); // lê corpo dos pedidos em JSON
app.use(cookieParser()); // lê cookies dos pedidos

// rotas da API
app.use("/api/auth", authRoutes); // todas as rotas de auth ficam em /api/auth/*

// rota de teste — confirma que o servidor está vivo
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    mensagem: "Backend CréditoMZ está a funcionar.",
    ambiente: env.NODE_ENV,
    dataHora: new Date().toISOString(),
  });
});

// arranca o servidor na porta definida no .env
app.listen(env.PORT, () => {
  console.log(`✓ Servidor CréditoMZ a correr em http://localhost:${env.PORT}`);
  console.log(`✓ Ambiente: ${env.NODE_ENV}`);
  console.log(`✓ Testa em: http://localhost:${env.PORT}/api/health`);
});