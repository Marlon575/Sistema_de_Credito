import { loginSchema, registoSchema } from "../validators/auth.validator"; // schemas a testar

describe("loginSchema", () => {
  test("aceita um email e senha válidos", () => {
    const resultado = loginSchema.safeParse({
      email: "cliente@exemplo.com",
      senha: "qualquercoisa",
    });

    expect(resultado.success).toBe(true); // deve passar na validação
  });

  test("rejeita um email com formato inválido", () => {
    const resultado = loginSchema.safeParse({
      email: "isto-nao-e-um-email",
      senha: "qualquercoisa",
    });

    expect(resultado.success).toBe(false); // deve falhar na validação
  });

  test("rejeita quando a senha está vazia", () => {
    const resultado = loginSchema.safeParse({
      email: "cliente@exemplo.com",
      senha: "",
    });

    expect(resultado.success).toBe(false);
  });
});

describe("registoSchema", () => {
  test("aceita um registo completo e válido", () => {
    const resultado = registoSchema.safeParse({
      nome: "Maria Silva",
      email: "maria@exemplo.com",
      senha: "Senha1234",
    });

    expect(resultado.success).toBe(true);
  });

  test("rejeita uma senha sem letra maiúscula", () => {
    const resultado = registoSchema.safeParse({
      nome: "Maria Silva",
      email: "maria@exemplo.com",
      senha: "senha1234", // sem maiúscula
    });

    expect(resultado.success).toBe(false);
  });

  test("rejeita uma senha sem número", () => {
    const resultado = registoSchema.safeParse({
      nome: "Maria Silva",
      email: "maria@exemplo.com",
      senha: "SenhaSemNumero", // sem número
    });

    expect(resultado.success).toBe(false);
  });

  test("rejeita um nome demasiado curto", () => {
    const resultado = registoSchema.safeParse({
      nome: "Ma", // menos de 3 caracteres
      email: "maria@exemplo.com",
      senha: "Senha1234",
    });

    expect(resultado.success).toBe(false);
  });
});