import nodemailer, { type Transporter } from "nodemailer";

import { env, temEmail } from "./env";

/**
 * Envio de e-mail.
 *
 * A promessa do `env.ts` é que a ausência de SMTP **degrada** a funcionalidade,
 * nunca derruba o sistema: sem servidor configurado a mensagem vai para o log e
 * quem chamou fica sabendo que não saiu — para a interface poder oferecer o
 * caminho manual (copiar o link, abrir o próprio cliente de e-mail) em vez de
 * mentir que enviou.
 */

export type ResultadoDoEnvio =
  | { enviado: true }
  | { enviado: false; motivo: "sem-smtp" | "falhou"; detalhe?: string };

let transporte: Transporter | null = null;

function obterTransporte() {
  if (transporte) return transporte;
  transporte = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT) || 587,
    // 465 é TLS implícito; as outras portas sobem por STARTTLS.
    secure: Number(env.SMTP_PORT) === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
  });
  return transporte;
}

export async function enviarEmail(mensagem: {
  para: string;
  assunto: string;
  texto: string;
  html?: string;
}): Promise<ResultadoDoEnvio> {
  if (!temEmail()) {
    // O corpo do convite carrega o link pessoal `/t/<token>`, que é
    // CREDENCIAL: quem tem o link responde no lugar da pessoa. Despejar isso no
    // log de produção — que costuma ir para arquivo, agregador e backup — é
    // vazar o acesso para todo mundo que lê log. Em desenvolvimento o corpo
    // inteiro sai, porque ali ele é o caminho para testar sem SMTP.
    if (process.env.NODE_ENV === "production") {
      console.info(
        `[email] SMTP não configurado — mensagem não enviada para ${ocultarEmail(mensagem.para)}. Quem chamou recebeu o link para entrega manual.`,
      );
    } else {
      console.info(
        `[email] SMTP não configurado — mensagem não enviada.\n  para: ${mensagem.para}\n  assunto: ${mensagem.assunto}\n${mensagem.texto}`,
      );
    }
    return { enviado: false, motivo: "sem-smtp" };
  }

  try {
    await obterTransporte().sendMail({
      from: env.SMTP_FROM,
      to: mensagem.para,
      subject: mensagem.assunto,
      text: mensagem.texto,
      html: mensagem.html,
    });
    return { enviado: true };
  } catch (erro) {
    console.error("[email] falha no envio", erro);
    return {
      enviado: false,
      motivo: "falhou",
      detalhe: erro instanceof Error ? erro.message : undefined,
    };
  }
}

/** Corpo do convite. Texto e HTML dizem a mesma coisa — nada só no HTML. */
export function convitePorEmail(dados: {
  nomeDoCandidato: string;
  tituloDaVaga: string;
  nomeDaEmpresa: string;
  link: string;
}) {
  const assunto = `${dados.tituloDaVaga} — mapeamento comportamental`;

  const texto = [
    `Olá, ${dados.nomeDoCandidato}!`,
    "",
    `Você está participando do processo para a vaga de ${dados.tituloDaVaga}, na ${dados.nomeDaEmpresa}.`,
    "",
    "Para seguir, responda o mapeamento comportamental neste link. Leva cerca de 8 minutos, não é prova e não existe resposta certa:",
    "",
    dados.link,
    "",
    "No fim você recebe o seu próprio resultado, independente da empresa.",
    "",
    "Se você não esperava este e-mail, pode ignorá-lo.",
  ].join("\n");

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.6;color:#0b0e14;max-width:520px">
      <p>Olá, ${escapar(dados.nomeDoCandidato)}!</p>
      <p>Você está participando do processo para a vaga de <strong>${escapar(dados.tituloDaVaga)}</strong>, na ${escapar(dados.nomeDaEmpresa)}.</p>
      <p>Para seguir, responda o mapeamento comportamental. Leva cerca de <strong>8 minutos</strong>, não é prova e não existe resposta certa.</p>
      <p style="margin:28px 0">
        <a href="${dados.link}" style="background:#0b0e14;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block">Responder agora</a>
      </p>
      <p style="font-size:13px;color:#5b6472">Se o botão não abrir, copie este endereço:<br><span style="word-break:break-all">${escapar(dados.link)}</span></p>
      <p style="font-size:13px;color:#5b6472">No fim você recebe o seu próprio resultado, independente da empresa. Se você não esperava este e-mail, pode ignorá-lo.</p>
    </div>
  `.trim();

  return { assunto, texto, html };
}

/** "maria.silva@acme.com" → "ma***@acme.com". Identifica no log sem expor. */
function ocultarEmail(email: string) {
  const [usuario, dominio] = email.split("@");
  if (!dominio) return "***";
  return `${usuario.slice(0, 2)}***@${dominio}`;
}

function escapar(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
