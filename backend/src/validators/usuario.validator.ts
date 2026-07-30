import { z } from "zod"; // biblioteca de validação

// -------------------------------------------------------------
// ADMIN — criar novo utilizador (funcionário, gerente ou admin)
// -------------------------------------------------------------
export const criarUsuarioSchema = z.object({
  nome: z.string({ required_error: "O nome é obrigatório" })
    .min(3, "O nome deve ter pelo menos 3 caracteres")
    .max(100, "O nome é demasiado longo"),

  email: z.string({ required_error: "O email é obrigatório" })
    .email("Formato de email inválido"),

  senha: z.string({ required_error: "A senha é obrigatória" })
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .regex(/[A-Z]/, "A senha deve ter pelo menos uma letra maiúscula")
    .regex(/[0-9]/, "A senha deve ter pelo menos um número"),

  // o admin só pode criar estes 3 perfis (nunca CLIENTE, que se regista sozinho)
  perfil: z.enum(["ADMIN", "GERENTE", "FUNCIONARIO"], {
    required_error: "O perfil é obrigatório",
    invalid_type_error: "Perfil inválido. Use ADMIN, GERENTE ou FUNCIONARIO.",
  }),
});

export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>;

// -------------------------------------------------------------
// ADMIN — actualizar dados de um utilizador existente
// Todos os campos são opcionais: o admin altera só o que quiser.
// -------------------------------------------------------------
export const atualizarUsuarioSchema = z.object({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres").max(100).optional(),
  email: z.string().email("Formato de email inválido").optional(),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
});

export type AtualizarUsuarioInput = z.infer<typeof atualizarUsuarioSchema>;