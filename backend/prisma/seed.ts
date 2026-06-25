// =============================================================
// seed.ts — Popula a base de dados com os dados iniciais
//
// Este script corre uma única vez (ou sempre que quisermos repor
// os dados base) e cria:
//   1. Os 3 tipos de crédito que a empresa oferece
//   2. Um utilizador Admin inicial, para conseguires entrar no
//      sistema pela primeira vez (o admin depois cria os outros
//      utilizadores: funcionários e gerentes)
//
// Como correr:
//   npm run prisma:seed
// =============================================================

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Criamos uma "ligação" ao Prisma para podermos inserir dados.
const prisma = new PrismaClient();

/**
 * Função principal do seed.
 * Insere os tipos de crédito e o utilizador admin, caso ainda
 * não existam (para podermos correr este script várias vezes
 * sem criar duplicados).
 */
async function main(): Promise<void> {
  console.log("Iniciando o seed da base de dados...");

  // -----------------------------------------------------------
  // 1. TIPOS DE CRÉDITO
  // -----------------------------------------------------------
  // "upsert" significa: "se já existir um registo com este id,
  // actualiza-o; senão, cria um novo." Isto torna o seed seguro
  // para correr mais do que uma vez sem criar duplicados.

  await prisma.tipoEmprestimo.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nome: "Consumo",
      descricao: "Crédito para despesas pessoais, compras ou consumo geral.",
      taxaMensal: 1.667,
      taxaNominal: 20,
      prazoMin: 6,
      prazoMax: 60,
      valorMin: 25_000,
      valorMax: 2_000_000,
    },
  });

  await prisma.tipoEmprestimo.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      nome: "Investimento",
      descricao: "Crédito para investir em negócios, equipamentos ou expansão.",
      taxaMensal: 1.417,
      taxaNominal: 17,
      prazoMin: 12,
      prazoMax: 84,
      valorMin: 50_000,
      valorMax: 10_000_000,
    },
  });

  await prisma.tipoEmprestimo.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      nome: "Funcionário Público/Privado",
      descricao: "Crédito com condições especiais para funcionários do estado e do sector privado.",
      taxaMensal: 1.25,
      taxaNominal: 15,
      prazoMin: 6,
      prazoMax: 72,
      valorMin: 10_000,
      valorMax: 1_500_000,
    },
  });

  console.log("✓ Tipos de crédito criados/actualizados (Consumo, Investimento, Funcionário Público/Privado)");

  // -----------------------------------------------------------
  // 2. UTILIZADOR ADMIN INICIAL
  // -----------------------------------------------------------

  // A password nunca é guardada em texto simples. O bcrypt
  // "encripta" (faz hash) a password antes de a gravarmos.
  // O número 12 é o "salt rounds" - quanto maior, mais seguro,
  // mas também mais lento. 12 é o valor recomendado actualmente.
  const senhaTemporaria = "tztfve8ab525"; // ALTERA esta password depois do primeiro login!
  const senhaHash = await bcrypt.hash(senhaTemporaria, 12);

  await prisma.usuario.upsert({
    where: { email: "admin@creditomz.co.mz" },
    update: {},
    create: {
      nome: "Administrador CréditoMZ",
      email: "admin@creditomz.co.mz",
      senhaHash: senhaHash,
      perfil: "ADMIN",
      ativo: true,
    },
  });

  console.log("✓ Utilizador admin criado:");
  console.log("   Email: admin@creditomz.co.mz");
  console.log(`   Password temporária: ${senhaTemporaria}`);
  console.log("   ATENÇÃO: troca esta password assim que entrares no sistema!");

  console.log("Seed concluído com sucesso.");
}

// Executa a função principal e trata erros, garantindo que a
// ligação à base de dados é sempre fechada no final.
main()
  .catch((erro) => {
    console.error("Erro ao executar o seed:", erro);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });