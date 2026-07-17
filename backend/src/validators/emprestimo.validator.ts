import { z } from "zod"; // biblioteca de validação

// -------------------------------------------------------------
// CLIENTE — criar um pedido de crédito
// -------------------------------------------------------------
export const criarEmprestimoSchema = z.object({
  tipoId: z.number({ required_error: "O tipo de empréstimo é obrigatório" })
    .int("O tipo deve ser um número inteiro")
    .positive("O tipo deve ser um número positivo"),

  valor: z.number({ required_error: "O valor é obrigatório" })
    .positive("O valor deve ser maior que zero"),

  prazo: z.number({ required_error: "O prazo é obrigatório" })
    .int("O prazo deve ser um número inteiro de meses")
    .positive("O prazo deve ser maior que zero"),
  // nota: a validação de que o prazo está dentro do intervalo
  // (prazoMin/prazoMax) do tipo escolhido é feita no service,
  // porque depende de dados que só a base de dados conhece.
});

export type CriarEmprestimoInput = z.infer<typeof criarEmprestimoSchema>;

// -------------------------------------------------------------
// FUNCIONÁRIO — encaminhar pedido ao gerente
// -------------------------------------------------------------
export const encaminharEmprestimoSchema = z.object({
  observacoes: z.string({ required_error: "As observações são obrigatórias" })
    .min(10, "As observações devem ter pelo menos 10 caracteres"),
});

export type EncaminharEmprestimoInput = z.infer<typeof encaminharEmprestimoSchema>;

// -------------------------------------------------------------
// GERENTE — rejeitar pedido (motivo obrigatório)
// -------------------------------------------------------------
export const rejeitarEmprestimoSchema = z.object({
  motivo: z.string({ required_error: "O motivo de rejeição é obrigatório" })
    .min(10, "O motivo deve ter pelo menos 10 caracteres"),
});

export type RejeitarEmprestimoInput = z.infer<typeof rejeitarEmprestimoSchema>;

// -------------------------------------------------------------
// ADMIN — actualizar taxas, prazos e valores de um tipo de crédito
// Todos os campos são opcionais: o admin pode alterar só o que quiser.
// -------------------------------------------------------------
export const atualizarTipoEmprestimoSchema = z.object({
taxaMensal: z.number().positive("A taxa mensal deve ser maior que zero").optional(),
taxaNominal: z.number().positive("A taxa nominal deve ser maior que zero").optional(),
prazoMin: z.number().int().positive("O prazo mínimo deve ser maior que zero").optional(),
prazoMax: z.number().int().positive("O prazo máximo deve ser maior que zero").optional(),
valorMin: z.number().positive("O valor mínimo deve ser maior que zero").optional(),
valorMax: z.number().positive("O valor máximo deve ser maior que zero").optional(),
})
  // regra extra: se prazoMin E prazoMax vierem os dois, o mínimo não pode ser maior que o máximo
.refine(
    (dados) => {
    if (dados.prazoMin !== undefined && dados.prazoMax !== undefined) {
        return dados.prazoMin <= dados.prazoMax;
    }
      return true; // se só um dos dois vier, não validamos aqui (o service compara com o valor já guardado)
    },
    { message: "O prazo mínimo não pode ser maior que o prazo máximo", path: ["prazoMin"] }
)
  // mesma lógica para valorMin/valorMax
.refine(
    (dados) => {
    if (dados.valorMin !== undefined && dados.valorMax !== undefined) {
        return dados.valorMin <= dados.valorMax;
    }
    return true;
    },
    { message: "O valor mínimo não pode ser maior que o valor máximo", path: ["valorMin"] }
);

export type AtualizarTipoEmprestimoInput = z.infer<typeof atualizarTipoEmprestimoSchema>;