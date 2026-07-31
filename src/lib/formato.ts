/** Formatação — um lugar só, pra número não mudar de cara entre telas. */

export function numero(valor: number, casas = 0) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(valor);
}

export function porcentagem(valor: number, casas = 0) {
  return `${numero(valor, casas)}%`;
}

export function data(valor: Date | string | null | undefined) {
  if (!valor) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(valor));
}

export function dataHora(valor: Date | string | null | undefined) {
  if (!valor) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(valor));
}

/** "há 3 dias", "agora". Relativo curto, sem biblioteca. */
export function haQuantoTempo(valor: Date | string | null | undefined) {
  if (!valor) return "—";
  const alvo = new Date(valor).getTime();
  const segundos = Math.round((Date.now() - alvo) / 1000);

  const escala: Array<[number, Intl.RelativeTimeFormatUnit]> = [
    [60, "second"],
    [3600, "minute"],
    [86400, "hour"],
    [604800, "day"],
    [2629800, "week"],
    [31557600, "month"],
  ];

  const fmt = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  if (segundos < 45) return "agora";

  let anterior = 1;
  for (const [limite, unidade] of escala) {
    if (segundos < limite) return fmt.format(-Math.round(segundos / anterior), unidade);
    anterior = limite;
  }
  return fmt.format(-Math.round(segundos / 31557600), "year");
}

export function duracao(ms: number | null | undefined) {
  if (!ms || ms <= 0) return "—";
  const minutos = Math.floor(ms / 60000);
  const segundos = Math.round((ms % 60000) / 1000);
  if (minutos === 0) return `${segundos}s`;
  if (minutos < 60) return `${minutos}min${segundos > 0 ? ` ${segundos}s` : ""}`;
  const horas = Math.floor(minutos / 60);
  return `${horas}h ${minutos % 60}min`;
}

export function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

export const ROTULO_DE_SENIORIDADE: Record<string, string> = {
  INTERN: "Estágio",
  JUNIOR: "Júnior",
  MID: "Pleno",
  SENIOR: "Sênior",
  LEAD: "Especialista",
  MANAGER: "Gerência",
  DIRECTOR: "Diretoria",
};

export const ROTULO_DE_MODELO: Record<string, string> = {
  ONSITE: "Presencial",
  REMOTE: "Remoto",
  HYBRID: "Híbrido",
};

export const ROTULO_DE_STATUS_DE_VAGA: Record<string, string> = {
  DRAFT: "Rascunho",
  OPEN: "Aberta",
  PAUSED: "Pausada",
  CLOSED: "Encerrada",
};

export const ROTULO_DE_STATUS_DE_AVALIACAO: Record<string, string> = {
  PENDING: "Não iniciada",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluída",
  EXPIRED: "Expirada",
  ABANDONED: "Abandonada",
};

export const ROTULO_DE_PAPEL: Record<string, string> = {
  OWNER: "Dono da conta",
  ADMIN: "Administrador",
  RECRUITER: "Recrutador",
  VIEWER: "Somente leitura",
};
