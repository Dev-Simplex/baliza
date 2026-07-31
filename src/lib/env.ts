import { z } from "zod";

// Validação de ambiente que falha cedo e alto. Variável obrigatória faltando
// derruba o boot com mensagem clara, em vez de virar `undefined` três camadas
// abaixo, na primeira requisição de um cliente.

const esquema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET precisa de pelo menos 32 caracteres"),

  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3300"),
  NEXT_PUBLIC_APP_NAME: z.string().default("Bússola"),

  // Opcionais: a ausência degrada a funcionalidade, nunca derruba o sistema.
  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_MODEL: z.string().optional().default("gpt-4o-mini"),

  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.string().optional().default("587"),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASSWORD: z.string().optional().default(""),
  SMTP_FROM: z.string().optional().default("Bússola <nao-responda@localhost>"),
});

function carregar() {
  const resultado = esquema.safeParse(process.env);

  if (!resultado.success) {
    const problemas = resultado.error.issues
      .map((i) => `  · ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Configuração de ambiente inválida:\n${problemas}`);
  }

  return resultado.data;
}

export const env = carregar();

/** A IA está configurada? Se não, o sistema usa o gerador determinístico. */
export const temIA = () => env.OPENAI_API_KEY.length > 0;

/** O SMTP está configurado? Se não, convites por e-mail caem no log. */
export const temEmail = () => env.SMTP_HOST.length > 0 && env.SMTP_USER.length > 0;
