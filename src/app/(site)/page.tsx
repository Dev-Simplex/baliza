import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";

import { AlternarTema } from "@/components/alternar-tema";
import { Faixa } from "@/components/faixa";
import { Marca } from "@/components/marca";
import { BotaoLink } from "@/components/ui/botao-link";
import { ARQUETIPOS } from "@/lib/instrument/archetypes";
import { ITENS } from "@/lib/instrument/items";
import { PRESETS } from "@/lib/instrument/presets";
import { LISTA_DE_PLANOS, formatarPreco } from "@/lib/plans";
import { FATORES, NOMES_DE_FATOR } from "@/lib/instrument/types";

export const metadata: Metadata = {
  title: "Bússola — descubra o perfil comportamental ideal para cada contratação",
};

export default function PaginaInicial() {
  return (
    <div className="min-h-svh">
      <Cabecalho />
      <Hero />
      <FaixaDeMetricas />
      <ComoFunciona />
      <Beneficios />
      <OQueMedimos />
      <Depoimentos />
      <Planos />
      <Perguntas />
      <ChamadaFinal />
      <Rodape />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function Cabecalho() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Marca />

        <nav className="hidden items-center gap-7 text-[13.5px] text-muted-foreground md:flex">
          <a href="#funciona" className="hover:text-foreground">
            Como funciona
          </a>
          <a href="#medimos" className="hover:text-foreground">
            O que medimos
          </a>
          <a href="#planos" className="hover:text-foreground">
            Planos
          </a>
          <a href="#perguntas" className="hover:text-foreground">
            Perguntas
          </a>
        </nav>

        <div className="flex items-center gap-2.5">
          <AlternarTema className="hidden sm:inline-flex" />
          <Link
            href="/entrar"
            className="hidden text-[13.5px] text-muted-foreground hover:text-foreground sm:block"
          >
            Entrar
          </Link>
          <BotaoLink href="/cadastrar" size="sm">
            Criar conta
          </BotaoLink>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      <div className="regua-fina absolute inset-x-0 top-0 h-px opacity-60" />

      <div className="mx-auto grid max-w-6xl gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-28">
        <div>
          <p className="etiqueta">Mapeamento comportamental para recrutamento</p>

          <h1 className="mt-5 text-balance text-[40px] leading-[1.06] font-semibold tracking-[-0.03em] sm:text-[52px]">
            Descubra o perfil comportamental ideal para cada contratação.
          </h1>

          <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-muted-foreground">
            Cole um link na sua vaga. Em oito minutos o candidato responde. Você
            recebe o ranking com a aderência explicada — e as perguntas exatas
            para fazer a cada um.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <BotaoLink href="/cadastrar" size="lg" className="h-11 gap-2 px-5 text-[15px]">
              Experimentar gratuitamente
              <ArrowRight className="size-4" />
            </BotaoLink>
            <a
              href="#funciona"
              className="text-[14px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Ver como funciona
            </a>
          </div>

          <p className="mt-5 text-[13px] text-muted-foreground">
            Sem cartão. Duas vagas e 30 respostas por mês no plano grátis.
          </p>
        </div>

        {/* O herói é o próprio instrumento medindo. Não é ilustração: é a tela
            que o recrutador vai olhar todo dia. */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-7">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="etiqueta">Aderência à vaga</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Vendas — prospecção
              </p>
            </div>
            <p className="leitura text-[34px] leading-none font-semibold text-n-brass">
              85,1
            </p>
          </div>

          <div className="mt-7 space-y-6">
            <Faixa
              atraso={0.15}
              dados={{
                fator: "C",
                nome: "Organização e Entrega",
                escore: 68.8,
                faixa: [55, 100],
                ideal: 100,
                peso: 4,
                tipo: "maior_melhor",
                dentro: true,
              }}
            />
            <Faixa
              atraso={0.3}
              dados={{
                fator: "A",
                nome: "Cooperação",
                escore: 93.8,
                faixa: [30, 60],
                ideal: 45,
                peso: 3,
                tipo: "faixa_otima",
                dentro: false,
              }}
            />
            <Faixa
              atraso={0.45}
              dados={{
                fator: "O",
                nome: "Abertura ao Novo",
                escore: 62.5,
                faixa: [45, 80],
                ideal: 62.5,
                peso: 2,
                tipo: "faixa_otima",
                dentro: true,
              }}
            />
          </div>

          <p className="mt-7 border-t pt-5 text-[13.5px] leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">
              Cooperação bem acima da faixa
            </span>{" "}
            é o que mais derruba a aderência aqui. Em prospecção, quem evita
            atrito não pede o fechamento e dá desconto pra não desagradar.
          </p>
        </div>
      </div>
    </section>
  );
}

function FaixaDeMetricas() {
  // Números sobre o INSTRUMENTO, verificáveis no próprio código — não sobre
  // clientes. Métrica de vitrine que não se sustenta é a primeira coisa que um
  // comprador de RH testa.
  const metricas = [
    { valor: `${ITENS.length}`, rotulo: "itens no banco" },
    { valor: "44", rotulo: "itens por aplicação" },
    { valor: "~8", rotulo: "minutos por candidato" },
    { valor: `${PRESETS.length}`, rotulo: "perfis-alvo prontos" },
    { valor: `${ARQUETIPOS.length}`, rotulo: "arquétipos de leitura" },
  ];

  return (
    <section className="border-b bg-n-surface-2/60">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-8 px-5 py-12 sm:px-8 md:grid-cols-5">
        {metricas.map((m) => (
          <div key={m.rotulo}>
            <p className="leitura text-[28px] leading-none font-semibold">
              {m.valor}
            </p>
            <p className="etiqueta mt-2">{m.rotulo}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ComoFunciona() {
  const passos = [
    {
      titulo: "Crie a vaga e escolha o perfil-alvo",
      texto:
        "Sete perfis prontos, do atendimento à liderança, cada um com as faixas que aquele trabalho realmente pede. Você ajusta o que quiser — e o que não quiser fica como está.",
    },
    {
      titulo: "Mande o link",
      texto:
        "Um link, um QR Code ou um e-mail. O candidato não cria conta, não instala nada e responde pelo celular em cerca de oito minutos.",
    },
    {
      titulo: "Receba o ranking e o roteiro",
      texto:
        "A aderência vem com a conta que a gerou: o que puxou pra cima, o que puxou pra baixo e o quanto disso é confiável. E as perguntas de entrevista para cada candidato.",
    },
  ];

  return (
    <section id="funciona" className="border-b">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <p className="etiqueta">Como funciona</p>
        <h2 className="mt-4 max-w-2xl text-balance text-[32px] leading-[1.15] font-semibold tracking-tight sm:text-[38px]">
          Três passos, e o terceiro é o que você compra.
        </h2>

        {/* A numeração aqui carrega informação: é uma sequência real e a ordem
            importa. Por isso ela existe — não como enfeite. */}
        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {passos.map((passo, i) => (
            <li key={passo.titulo} className="relative">
              <div className="flex items-center gap-3">
                <span className="leitura text-[13px] text-n-brass">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <h3 className="mt-5 text-[17px] leading-snug font-semibold">
                {passo.titulo}
              </h3>
              <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
                {passo.texto}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Beneficios() {
  const itens = [
    {
      titulo: "O número vem com a conta",
      texto:
        "Toda aderência mostra as três dimensões que puxaram pra cima, as três que puxaram pra baixo e as que foram descartadas de propósito. Ninguém decide sobre gente com uma caixa-preta.",
    },
    {
      titulo: "Um selo que diz o quanto confiar",
      texto:
        "Cinco sinais indicam quando alguém respondeu pensando em causar boa impressão. Nenhum concorrente mostra isso. Nós mostramos — e sem acusar o candidato.",
    },
    {
      titulo: "Faixa ótima, não quanto-mais-melhor",
      texto:
        "Cooperação altíssima atrapalha em negociação. Abertura altíssima frustra em conferência. O modelo penaliza os dois lados quando o trabalho pede o meio.",
    },
    {
      titulo: "Ordena, nunca elimina",
      texto:
        "Não existe e não vai existir corte automático. A lista é sugestão de prioridade de conversa, e a decisão continua sendo de quem entrevista.",
    },
    {
      titulo: "O candidato recebe o resultado",
      texto:
        "Sempre, integral, sem depender de a empresa liberar. Quem responde oito minutos merece levar algo de volta.",
    },
    {
      titulo: "Reaplicar mede mudança, não memória",
      texto:
        `O banco tem ${ITENS.length} itens e cada aplicação sorteia 44. Candidato recorrente recebe itens que ainda não viu.`,
    },
  ];

  return (
    <section className="border-b bg-n-surface-2/60">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <p className="etiqueta">Diferenciais</p>
        <h2 className="mt-4 max-w-2xl text-balance text-[32px] leading-[1.15] font-semibold tracking-tight sm:text-[38px]">
          O produto não é o teste. É a decisão do dia seguinte.
        </h2>

        <div className="mt-14 grid gap-x-10 gap-y-11 md:grid-cols-2 lg:grid-cols-3">
          {itens.map((item) => (
            <div key={item.titulo}>
              <h3 className="text-[16px] leading-snug font-semibold">
                {item.titulo}
              </h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted-foreground">
                {item.texto}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OQueMedimos() {
  return (
    <section id="medimos" className="border-b">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="etiqueta">O instrumento</p>
          <h2 className="mt-4 text-balance text-[32px] leading-[1.15] font-semibold tracking-tight sm:text-[38px]">
            Cinco dimensões, medidas do jeito que dá pra defender.
          </h2>

          <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">
            O instrumento é derivado do IPIP, que é de domínio público e mede o
            mesmo modelo de cinco fatores que o mercado vende como diferencial
            proprietário. A prova tem duas partes: 44 afirmações que geram o
            escore comparável entre pessoas, e oito situações de trabalho que
            servem para conferir se as duas histórias batem.
          </p>

          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            O escore das situações nunca entra no ranking. Ele compara dimensões
            dentro da mesma pessoa, e responder &ldquo;a Maria é mais organizada
            que o João?&rdquo; com esse tipo de escore é estatisticamente
            inválido — um erro comum no mercado.
          </p>

          <p className="mt-8 rounded-xl border-l-2 border-n-brass bg-secondary/50 px-5 py-4 text-[13.5px] leading-relaxed text-muted-foreground">
            Este é um questionário de autopercepção de comportamento no trabalho.
            Não é teste psicológico, avaliação psicológica, laudo nem
            diagnóstico, e não mede inteligência nem capacidade técnica.
          </p>
        </div>

        <ul className="space-y-5 self-center">
          {FATORES.map((f) => (
            <li key={f} className="rounded-xl border bg-card p-5">
              <div className="flex items-baseline gap-2.5">
                <span className="etiqueta">{f}</span>
                <h3 className="text-[15.5px] font-semibold">
                  {NOMES_DE_FATOR[f].ui}
                </h3>
              </div>
              <p className="mt-2 text-[13.5px] text-muted-foreground">
                {NOMES_DE_FATOR[f].facetas
                  .map((faceta) => faceta[0].toUpperCase() + faceta.slice(1))
                  .join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * ATENÇÃO — CONTEÚDO DE EXEMPLO.
 *
 * Estes depoimentos são ilustrativos e foram escritos para mostrar o formato da
 * seção. NÃO são de clientes reais. Troque por depoimentos verdadeiros, com
 * autorização de quem falou, antes de publicar. Depoimento inventado numa
 * página de vendas é problema jurídico e de reputação, não licença poética.
 */
const DEPOIMENTOS_DE_EXEMPLO = [
  {
    texto:
      "A parte que mudou o processo não foi o ranking — foi chegar na entrevista já sabendo o que perguntar pra cada pessoa.",
    autor: "Exemplo · Coordenação de RH",
    contexto: "indústria, 180 pessoas",
  },
  {
    texto:
      "O selo de confiança pegou dois candidatos que responderam o que achavam que a gente queria ouvir. Isso sozinho pagou a ferramenta.",
    autor: "Exemplo · Gerência de Gente",
    contexto: "varejo, 40 lojas",
  },
  {
    texto:
      "Parei de contratar vendedor simpático que não fecha. A faixa de cooperação explicou uma coisa que eu sentia e não sabia nomear.",
    autor: "Exemplo · Direção Comercial",
    contexto: "serviços B2B",
  },
];

function Depoimentos() {
  return (
    <section className="border-b bg-n-surface-2/60">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <p className="etiqueta">Depoimentos</p>
        <h2 className="mt-4 max-w-2xl text-balance text-[32px] leading-[1.15] font-semibold tracking-tight sm:text-[38px]">
          O que muda na prática.
        </h2>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {DEPOIMENTOS_DE_EXEMPLO.map((d) => (
            <figure key={d.autor} className="rounded-xl border bg-card p-6">
              <blockquote className="text-[15px] leading-relaxed">
                &ldquo;{d.texto}&rdquo;
              </blockquote>
              <figcaption className="mt-5 border-t pt-4">
                <p className="text-[13px] font-medium">{d.autor}</p>
                <p className="etiqueta mt-1">{d.contexto}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Planos() {
  return (
    <section id="planos" className="border-b">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <p className="etiqueta">Planos</p>
        <h2 className="mt-4 max-w-2xl text-balance text-[32px] leading-[1.15] font-semibold tracking-tight sm:text-[38px]">
          Comece de graça. Suba quando o volume pedir.
        </h2>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {LISTA_DE_PLANOS.map((plano) => (
            <div
              key={plano.codigo}
              className={`flex flex-col rounded-2xl border p-7 ${
                plano.destaque
                  ? "border-n-brass/50 bg-n-brass/[0.04] ring-1 ring-n-brass/20"
                  : "bg-card"
              }`}
            >
              <div className="flex items-baseline justify-between">
                <h3 className="text-[17px] font-semibold">{plano.nome}</h3>
                {plano.destaque && (
                  <span className="etiqueta text-n-brass">mais escolhido</span>
                )}
              </div>

              <p className="mt-2 min-h-[3.25rem] text-[13.5px] leading-relaxed text-muted-foreground">
                {plano.descricao}
              </p>

              <p className="mt-5 flex items-baseline gap-1.5">
                <span className="leitura text-[30px] leading-none font-semibold">
                  {formatarPreco(plano.precoMensalCentavos)}
                </span>
                {plano.precoMensalCentavos > 0 && (
                  <span className="text-[13px] text-muted-foreground">/mês</span>
                )}
              </p>

              <ul className="mt-7 flex-1 space-y-2.5">
                {plano.vitrine.map((linha) => (
                  <li key={linha} className="flex items-start gap-2.5 text-[13.5px]">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-n-teal" />
                    {linha}
                  </li>
                ))}
              </ul>

              <BotaoLink
                href="/cadastrar"
                variant={plano.destaque ? "default" : "outline"}
                className="mt-8 w-full"
              >
                {plano.precoMensalCentavos === 0 ? "Começar grátis" : "Assinar"}
              </BotaoLink>
            </div>
          ))}
        </div>

        <p className="mt-6 text-[13px] text-muted-foreground">
          Todos os planos incluem o relatório do candidato, a trilha de auditoria
          e o expurgo programado das respostas.
        </p>
      </div>
    </section>
  );
}

const PERGUNTAS_FREQUENTES = [
  {
    p: "Isso é um teste psicológico?",
    r: "Não. É um questionário de autopercepção de comportamento no trabalho, com itens de domínio público. Não é avaliação psicológica, não emite laudo e não substitui o trabalho de um psicólogo. A aplicação de testes psicológicos é atividade privativa de psicólogo no Brasil, e o produto foi desenhado inteiro para ficar fora desse território — inclusive no vocabulário.",
  },
  {
    p: "Dá para o candidato burlar respondendo o que acha que queremos ouvir?",
    r: "Dá, como em qualquer instrumento de autorrelato — e é por isso que medimos exatamente isso. Cinco sinais alimentam um selo de confiança: afirmações que quase ninguém sustenta, itens equivalentes respondidos de forma divergente, sequências longas de resposta idêntica, tempo por item baixo demais para ler, e divergência entre as afirmações e as situações. Quando o selo cai, o relatório avisa e sugere o que confirmar na entrevista.",
  },
  {
    p: "Quanto tempo o candidato leva?",
    r: "Cerca de oito minutos: 44 afirmações rápidas e 8 situações de trabalho. Responde pelo celular, sem criar conta, e pode fechar e continuar depois pelo mesmo link — as respostas são salvas a cada clique.",
  },
  {
    p: "O que acontece com os dados de quem responde?",
    r: "Ficam guardados pelo prazo que a empresa definir (12 meses por padrão) e depois são apagados. Nenhum dado sensível é coletado em nenhuma etapa: nada de origem, religião, opinião política, saúde ou biometria. O candidato recebe o próprio resultado e pode pedir exclusão a qualquer momento.",
  },
  {
    p: "Vocês eliminam candidatos automaticamente?",
    r: "Não, e não vamos passar a fazer. O produto ordena por aderência e explica o porquê de cada posição; a decisão continua sendo de quem entrevista. Não existe funcionalidade de corte por nota, e a ausência dela é uma escolha de projeto.",
  },
  {
    p: "Serve para o meu tipo de vaga?",
    r: `Vem com ${PRESETS.length} perfis-alvo prontos — atendimento, prospecção, pós-venda, administrativo, técnico, liderança e operação — e cada um é editável. Se nenhum servir, você monta o seu ajustando as faixas de cada dimensão.`,
  },
  {
    p: "Dá para integrar com o sistema que já usamos?",
    r: "No plano Enterprise há API pública para integrar com ATS, ERP e sistemas de RH. Nos demais, a exportação em PDF e Excel cobre a maior parte dos casos.",
  },
];

function Perguntas() {
  return (
    <section id="perguntas" className="border-b bg-n-surface-2/60">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[20rem_1fr]">
        <div>
          <p className="etiqueta">Perguntas frequentes</p>
          <h2 className="mt-4 text-balance text-[32px] leading-[1.15] font-semibold tracking-tight">
            O que costumam perguntar antes de testar.
          </h2>
        </div>

        <div className="divide-y border-t">
          {PERGUNTAS_FREQUENTES.map((item) => (
            <details key={item.p} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[15.5px] font-medium">
                {item.p}
                <span className="mt-1 shrink-0 text-muted-foreground transition-transform group-open:rotate-180">
                  <Minus className="size-4 rotate-90 group-open:rotate-0" />
                </span>
              </summary>
              <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
                {item.r}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function ChamadaFinal() {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-6xl px-5 py-24 text-center sm:px-8">
        <h2 className="mx-auto max-w-2xl text-balance text-[34px] leading-[1.12] font-semibold tracking-tight sm:text-[42px]">
          A próxima contratação pode ser uma decisão, não uma aposta.
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-[16px] leading-relaxed text-muted-foreground">
          Crie a conta, publique uma vaga e mande o link para três candidatos
          hoje mesmo. Você vai ver o ranking ainda esta semana.
        </p>
        <BotaoLink
          href="/cadastrar"
          size="lg"
          className="mt-9 h-11 gap-2 px-6 text-[15px]"
        >
          Experimentar gratuitamente
          <ArrowRight className="size-4" />
        </BotaoLink>
      </div>
    </section>
  );
}

function Rodape() {
  return (
    <footer className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-10">
        <div className="max-w-xs">
          <Marca />
          <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
            Mapeamento comportamental para processos seletivos. Ordena
            candidatos, explica o porquê e devolve as perguntas certas.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-14 gap-y-8 sm:grid-cols-3">
          <ColunaDoRodape
            titulo="Produto"
            itens={[
              { rotulo: "Como funciona", href: "#funciona" },
              { rotulo: "O que medimos", href: "#medimos" },
              { rotulo: "Planos", href: "#planos" },
            ]}
          />
          <ColunaDoRodape
            titulo="Conta"
            itens={[
              { rotulo: "Entrar", href: "/entrar" },
              { rotulo: "Criar conta", href: "/cadastrar" },
            ]}
          />
          <ColunaDoRodape
            titulo="Legal"
            itens={[
              { rotulo: "Privacidade", href: "/privacidade" },
              { rotulo: "Termos", href: "/termos" },
            ]}
          />
        </div>
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t pt-6">
        <p className="etiqueta">© {new Date().getFullYear()} Bússola</p>
        <AlternarTema />
      </div>
    </footer>
  );
}

function ColunaDoRodape({
  titulo,
  itens,
}: {
  titulo: string;
  itens: Array<{ rotulo: string; href: string }>;
}) {
  return (
    <div>
      <p className="etiqueta">{titulo}</p>
      <ul className="mt-3.5 space-y-2.5">
        {itens.map((item) => (
          <li key={item.rotulo}>
            <Link
              href={item.href}
              className="text-[13.5px] text-muted-foreground hover:text-foreground"
            >
              {item.rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
