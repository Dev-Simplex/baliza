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
  NEXT_PUBLIC_APP_NAME: z.string().default("Baliza"),

  // Quantos proxies nossos existem entre o público e este processo. Decide se
  // `x-forwarded-for` é origem ou é palpite — e, por tabela, se o limite por IP
  // protege alguma coisa. O padrão é 0 (exposto direto) porque errar para mais
  // devolve ao cliente o controle do próprio endereço. Ver `src/lib/ip.ts`.
  TRUSTED_PROXIES: z.coerce.number().int().min(0).max(4).default(0),

  // Opcionais: a ausência degrada a funcionalidade, nunca derruba o sistema.
  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_MODEL: z.string().optional().default("gpt-4o-mini"),

  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.string().optional().default("587"),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASSWORD: z.string().optional().default(""),
  SMTP_FROM: z.string().optional().default("Baliza <nao-responda@localhost>"),
});

type Ambiente = z.infer<typeof esquema>;

function carregar(): Ambiente {
  const resultado = esquema.safeParse(process.env);

  if (!resultado.success) {
    const problemas = resultado.error.issues
      .map((i) => `  · ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Configuração de ambiente inválida:\n${problemas}`);
  }

  return resultado.data;
}

let memoria: Ambiente | null = null;

// ─── Por que um Proxy, e não `export const env = carregar()` ───────────────
// Validar no corpo do módulo faz a checagem disparar no *import*, não no uso.
// E `next build`, ao coletar dados de página, carrega o grafo de módulos de
// cada rota só para ler `metadata` e config — sem executar handler nenhum.
// Resultado: uma página institucional que não toca em ambiente nenhum derrubava
// o build inteiro por falta de DATABASE_URL, porque o layout do route group
// arrasta `env` para o grafo dela. Segredo de produção passava a ser requisito
// de compilação, o que é a coisa errada em dois sentidos: prende o build ao
// ambiente e espalha credencial por onde ela não precisa estar.
//
// Com o Proxy, a validação acontece na primeira LEITURA de uma variável — que
// só acontece em runtime, servindo uma requisição de verdade. A promessa do
// arquivo continua de pé: quem lê `env.DATABASE_URL` sem ela configurada leva
// o mesmo erro, com a mesma mensagem, na mesma hora.
export const env = new Proxy({} as Ambiente, {
  get(_alvo, prop) {
    // Symbol nunca é variável de ambiente: é o runtime farejando o objeto
    // (`Symbol.toStringTag`, `then`, inspeção do console). Responder sem
    // carregar evita que uma dessas sondagens dispare a validação no build.
    if (typeof prop === "symbol") return undefined;

    memoria ??= carregar();
    return memoria[prop as keyof Ambiente];
  },

  // Sem estas, `{...env}` e `Object.keys(env)` veriam um objeto vazio.
  has(_alvo, prop) {
    if (typeof prop === "symbol") return false;
    memoria ??= carregar();
    return prop in memoria;
  },

  ownKeys() {
    memoria ??= carregar();
    return Reflect.ownKeys(memoria);
  },

  getOwnPropertyDescriptor(_alvo, prop) {
    memoria ??= carregar();
    return Object.getOwnPropertyDescriptor(memoria, prop);
  },
});

/** A IA está configurada? Se não, o sistema usa o gerador determinístico. */
export const temIA = () => env.OPENAI_API_KEY.length > 0;

/** O SMTP está configurado? Se não, convites por e-mail caem no log. */
export const temEmail = () => env.SMTP_HOST.length > 0 && env.SMTP_USER.length > 0;
