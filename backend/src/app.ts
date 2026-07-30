import express, { Request, Response } from "express"; // framework HTTP
import cors from "cors"; // permite pedidos do frontend
import cookieParser from "cookie-parser"; // permite ler cookies
import { env } from "./config/env"; // variáveis de ambiente validadas
import authRoutes from "./routes/auth.routes"; // rotas de autenticação
import emprestimoRoutes from "./routes/emprestimo.routes"; // rotas de empréstimos e tipos de crédito
import usuarioRoutes from "./routes/usuario.routes"; // rotas de gestão de utilizadores
import notificacaoRoutes from "./routes/notificacao.routes"; // rotas de notificações
import documentoRoutes from "./routes/documento.routes"; // rotas de documentos
import pagamentoRoutes from "./routes/pagamento.routes"; // rotas de pagamentos

const app = express(); // cria a aplicação Express

// middlewares globais
app.use(cors({
  origin: env.FRONTEND_URL, // só aceita pedidos deste endereço
  credentials: true, // permite cookies
}));
app.use(express.json()); // lê corpo dos pedidos em JSON
app.use(cookieParser()); // lê cookies dos pedidos

// rotas da API
app.use("/api/auth", authRoutes);
app.use("/api", emprestimoRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/notificacoes", notificacaoRoutes);
app.use("/api/documentos", documentoRoutes);
app.use("/api/pagamentos", pagamentoRoutes);

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