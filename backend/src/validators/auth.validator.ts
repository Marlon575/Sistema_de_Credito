import { z } from "zod"; // biblioteca de validação de dados

// validação do LOGIN
export const loginSchema = z.object({
  email: z.string({ required_error: "O email é obrigatório" }).email("Formato de email inválido"),
  senha: z.string({ required_error: "A senha é obrigatória" }).min(1, "A senha não pode estar vazia"),
});

export type LoginInput = z.infer<typeof loginSchema>; // tipo gerado automaticamente pelo Zod

// validação do REGISTO
export const registoSchema = z.object({
  nome: z.string({ required_error: "O nome é obrigatório" }).min(3, "Mínimo 3 caracteres").max(100, "Máximo 100 caracteres"),
  email: z.string({ required_error: "O email é obrigatório" }).email("Formato de email inválido"),
  senha: z.string({ required_error: "A senha é obrigatória" }).min(8, "Mínimo 8 caracteres").regex(/[A-Z]/, "Precisa de uma letra maiúscula").regex(/[0-9]/, "Precisa de um número"),
  bi: z.string().optional(), // bilhete de identidade (opcional)
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  rendimentoMensal: z.number().positive().optional(), // rendimento mensal em MT (opcional)
  tipoEmprego: z.string().optional(),
  emprego: z.string().optional(),
});

export type RegistoInput = z.infer<typeof registoSchema>; // tipo gerado automaticamente pelo Zod