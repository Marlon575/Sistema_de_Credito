// database.ts — Ligação única ao Prisma (padrão Singleton)
import { PrismaClient } from "@prisma/client";
import {env} from "./env";

// Criamos a instância do Prisma com logging configurado:
// em desenvolvimento vemos as queries SQL geradas (útil para
// debug); em produção só vemos erros

const prisma = new PrismaClient({
    log: env.NODE_ENV === "development" ? ["error", "warn",] : ["error"]
})

// Exporto esta única instância para ser usada em todo o backend.
export {prisma};