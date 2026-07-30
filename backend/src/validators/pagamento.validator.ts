import { z } from "zod"; // biblioteca de validação

// validação para REGISTAR um pagamento de prestação
export const registarPagamentoSchema = z.object({
  emprestimoId: z.number({ required_error: "O id do empréstimo é obrigatório" })
    .int("Deve ser um número inteiro")
    .positive("Deve ser um número positivo"),

  valorPago: z.number({ required_error: "O valor pago é obrigatório" })
    .positive("O valor deve ser maior que zero"),

  numeroParcela: z.number({ required_error: "O número da parcela é obrigatório" })
    .int("Deve ser um número inteiro")
    .positive("Deve ser um número positivo"),
});

export type RegistarPagamentoInput = z.infer<typeof registarPagamentoSchema>;