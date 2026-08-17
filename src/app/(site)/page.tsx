import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Minus,
  ShieldCheck,
  SlidersHorizontal,
  UserRoundCheck,
} from "lucide-react";

import { AlternarTema } from "@/components/alternar-tema";
import { Marca } from "@/components/marca";
import { AnatomiaDaFaixa } from "@/components/site/anatomia-da-faixa";
import { ComparacaoDeVisao } from "@/components/site/comparacao-de-visao";
import { PainelDeDemonstracao } from "@/components/site/painel-de-demonstracao";
import { BotaoLink } from "@/components/ui/botao-link";
import { ARQUETIPOS } from "@/lib/instrument/archetypes";
import { CENARIOS_POR_PROVA, TOTAL_DE_ITENS } from "@/lib/instrument/form";
import { ITENS } from "@/lib/instrument/items";
import { PRESETS } from "@/lib/instrument/presets";
import { FATORES, NOMES_DE_FATOR } from "@/lib/instrument/types";

export const metadata: Metadata = {
  // `absolute` porque o `template` da raiz (`%s · Baliza`) transformaria isto em
  // "Baliza — … · Baliza". Na home o título já É o da marca; não há o que sufixar.
  title: {
    absolute: "Baliza — Veja além do currículo. Decida com referência.",
  },
};

/**
 * A landing.
 *
 * Ela não vende um questionário: vende uma DECISÃO melhor. Por isso a ordem das
 * seções é a ordem de uma dúvida real — o que eu não vejo hoje, o que a Baliza
 * põe no lugar, como isso funciona, como se lê o desenho, o quanto dá para
 * confiar, o que acontece com os dados, e só então o preço da entrada.
 *
 * Nenhuma ilustração de gente feliz. O que aparece na tela é o produto rodando,
 * com o mesmo componente de faixa que o recrutador vê no painel.
 */
export default function PaginaInicial() {
  return (
    <div className="min-h-svh">
      <Cabecalho />
      <main>
        <Hero />
        <OContexto />
        <FaixaDeMetricas />
        <ComoFunciona />
        <OFit />
        <ExplicacaoDaFaixa />
        <Confianca />
        <OQueMedimos />
        <SegurancaEDecisao />
        <Perguntas />
        <ChamadaFinal />
      </main>
      <Rodape />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function Cabecalho() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="medida flex h-16 items-center justify-between gap-4">
        <Marca tamanho="md" />

        <nav
          className="hidden items-center gap-7 t-corpo-sm text-muted-foreground md:flex"
          aria-label="Seções desta página"
        >
          <a href="#funciona" className="rounded-sm hover:text-foreground">
            Como funciona
          </a>
          <a href="#faixa" className="rounded-sm hover:text-foreground">
            A faixa-alvo
          </a>
          <a href="#medimos" className="rounded-sm hover:text-foreground">
            O que medimos
          </a>
          <a href="#perguntas" className="rounded-sm hover:text-foreground">
            Perguntas
          </a>
        </nav>

        <div className="flex items-center gap-2.5">
          <AlternarTema className="hidden sm:inline-flex" />
          <Link
            href="/entrar"
            className="hidden rounded-sm t-corpo-sm text-muted-foreground hover:text-foreground sm:block"
          >
            Entrar
          </Link>
          <BotaoLink href="/cadastrar" variant="marca" size="sm">
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

      <div className="medida py-16 lg:py-24">
        <div className="max-w-3xl">
          <p className="etiqueta">
            Inteligência comportamental para recrutamento
          </p>

          <h1 className="mt-5 t-display">Veja além do currículo.</h1>

          <p className="mt-6 max-w-xl t-corpo-lg text-muted-foreground">
            Compare o perfil comportamental de cada candidato com o que a vaga
            realmente pede. Receba a aderência explicada, o quanto dá para
            confiar naquela resposta e as perguntas certas para a entrevista.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <BotaoLink href="/cadastrar" variant="marca" size="lg">
              Criar minha primeira vaga
              <ArrowRight className="size-4" />
            </BotaoLink>
            <a
              href="#funciona"
              className="rounded-sm px-1 t-corpo text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Ver como funciona
            </a>
          </div>

          <p className="mt-5 t-corpo-sm text-muted-foreground">
            Sem cartão e sem limite de uso. Do cadastro ao primeiro link, dois
            minutos.
          </p>
        </div>

        {/* O herói visual é o produto: ranking, faixa e roteiro. */}
        <PainelDeDemonstracao className="mt-14" />
      </div>
    </section>
  );
}

function OContexto() {
  return (
    <section className="border-b">
      <div className="medida secao">
        <p className="etiqueta">O ponto cego</p>
        <h2 className="mt-4 max-w-3xl t-titulo">
          O currículo mostra histórico. A Baliza mostra contexto para a decisão.
        </h2>
        <p className="mt-5 max-w-2xl t-corpo leading-relaxed text-muted-foreground">
          Currículo, entrevista e referência continuam valendo — e a Baliza não
          substitui nenhum dos três. Ela acrescenta a única coisa que faltava:
          uma medida comparável entre pessoas, lida contra o que aquela vaga
          pede, com a conta aberta do lado.
        </p>

        <div className="mt-12">
          <ComparacaoDeVisao />
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
    { valor: `${TOTAL_DE_ITENS}`, rotulo: "itens por aplicação" },
    { valor: "~6", rotulo: "minutos por candidato" },
    { valor: `${PRESETS.length}`, rotulo: "perfis-alvo prontos" },
    { valor: `${ARQUETIPOS.length}`, rotulo: "arquétipos de leitura" },
  ];

  return (
    <section className="border-b bg-superficie-2/60">
      <div className="medida grid grid-cols-2 gap-x-6 gap-y-8 py-12 md:grid-cols-5">
        {metricas.map((m) => (
          <div key={m.rotulo}>
            <p className="t-numero">{m.valor}</p>
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
      titulo: "Crie a vaga e ajuste o perfil-alvo",
      texto: `${PRESETS.length} perfis prontos, do atendimento à liderança, cada um com as faixas que aquele trabalho realmente pede. Você ajusta o que quiser — e o que não quiser fica como está.`,
    },
    {
      titulo: "Mande o link",
      texto:
        "Um link, um QR Code ou um e-mail. O candidato não cria conta, não instala nada e responde pelo celular em cerca de seis minutos.",
    },
    {
      titulo: "Receba o ranking e o roteiro",
      texto:
        "A aderência vem com a conta que a gerou: o que puxou para cima, o que puxou para baixo e o quanto disso é confiável. E as perguntas de entrevista para cada candidato.",
    },
  ];

  return (
    <section id="funciona" className="border-b scroll-mt-16">
      <div className="medida secao">
        <p className="etiqueta">Como funciona</p>
        <h2 className="mt-4 max-w-2xl t-titulo">
          Três passos, e o terceiro é o que você compra.
        </h2>

        {/* A numeração aqui carrega informação: é uma sequência real e a ordem
            importa. Por isso ela existe — não como enfeite. */}
        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {passos.map((passo, i) => (
            <li key={passo.titulo}>
              <div className="flex items-center gap-3">
                <span className="leitura t-corpo-sm text-marca">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <h3 className="mt-5 text-[1.0625rem] leading-snug font-semibold">
                {passo.titulo}
              </h3>
              <p className="mt-3 t-corpo leading-relaxed text-muted-foreground">
                {passo.texto}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/**
 * O conceito da marca, dito com o produto.
 *
 * Duas metades — sinais da pessoa e contexto da vaga — e o FIT no meio. É o
 * símbolo da Baliza explicado sem falar de logotipo nenhum.
 */
function OFit() {
  return (
    <section className="border-b bg-superficie-2/60">
      <div className="medida secao">
        <p className="etiqueta">Pessoa + vaga</p>
        <h2 className="mt-4 max-w-2xl t-titulo">
          Aderência é uma relação, não uma nota.
        </h2>
        <p className="mt-5 max-w-2xl t-corpo leading-relaxed text-muted-foreground">
          A mesma pessoa tem aderências diferentes em vagas diferentes, e isso
          não é defeito do modelo — é o modelo funcionando. Cooperação altíssima
          é um problema em prospecção e um trunfo em pós-venda. Ninguém é bom ou
          ruim em abstrato.
        </p>

        <div className="mt-12 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border bg-card p-6">
            <p className="etiqueta">Lado A · a pessoa</p>
            <h3 className="mt-3 text-base font-semibold">
              Sinais comportamentais
            </h3>
            <p className="mt-2 t-corpo-sm leading-relaxed text-muted-foreground">
              {TOTAL_DE_ITENS} afirmações e {CENARIOS_POR_PROVA} situações de
              trabalho geram cinco dimensões comparáveis entre pessoas — mais os
              controles que dizem o quanto confiar naquela resposta.
            </p>
          </div>

          {/* O vazio do meio é o desenho, não a sobra dele. */}
          <div className="flex items-center justify-center py-2 lg:py-0">
            <div className="flex flex-col items-center gap-2">
              <span className="etiqueta">fit</span>
              <span
                aria-hidden
                className="h-16 w-px lg:h-full lg:min-h-24"
                style={{
                  background:
                    "linear-gradient(to bottom, transparent, var(--marca-sinal), transparent)",
                }}
              />
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6">
            <p className="etiqueta">Lado B · a vaga</p>
            <h3 className="mt-3 text-base font-semibold">
              O que este trabalho pede
            </h3>
            <p className="mt-2 t-corpo-sm leading-relaxed text-muted-foreground">
              Uma faixa-alvo por dimensão, com peso e regra próprios — quanto
              mais melhor, quanto menos melhor, ou faixa ótima que penaliza os
              dois lados. É a régua, e ela é sua.
            </p>
          </div>
        </div>

        <p className="mt-8 max-w-2xl rounded-xl border-l-2 border-marca bg-secondary/50 px-5 py-4 t-corpo-sm leading-relaxed text-muted-foreground">
          Editar o perfil-alvo recalcula a aderência de todas as respostas já
          recebidas, na mesma transação. Duas réguas convivendo num mesmo ranking
          é o pior tipo de erro: nada na tela denuncia.
        </p>
      </div>
    </section>
  );
}

function ExplicacaoDaFaixa() {
  return (
    <section id="faixa" className="border-b scroll-mt-16">
      <div className="medida secao">
        <p className="etiqueta">O desenho</p>
        <h2 className="mt-4 max-w-2xl t-titulo">
          A faixa-alvo, peça por peça.
        </h2>
        <p className="mt-5 max-w-2xl t-corpo leading-relaxed text-muted-foreground">
          Este é o desenho que aparece em toda dimensão, em toda vaga, no painel
          e no relatório impresso. Vale aprender uma vez.
        </p>

        <div className="mt-12">
          <AnatomiaDaFaixa />
        </div>
      </div>
    </section>
  );
}

function Confianca() {
  const sinais = [
    "afirmações que quase ninguém sustenta",
    "itens equivalentes respondidos de forma divergente",
    "sequências longas de resposta idêntica",
    "tempo por item baixo demais para ter lido",
    "divergência entre as afirmações e as situações",
  ];

  return (
    <section className="border-b bg-superficie-2/60">
      <div className="medida secao grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="etiqueta">Resposta defensável</p>
          <h2 className="mt-4 t-titulo">
            Todo escore vem com o quanto dá para confiar nele.
          </h2>
          <p className="mt-6 t-corpo leading-relaxed text-muted-foreground">
            Autorrelato dá para maquiar — em qualquer instrumento do mercado. A
            diferença é que aqui isso é medido e dito. Cinco sinais alimentam um
            selo de confiança que acompanha a aderência para todo lado: tela,
            relatório e PDF.
          </p>
          <p className="mt-4 t-corpo leading-relaxed text-muted-foreground">
            Quando o selo cai, o relatório avisa e sugere o que confirmar na
            entrevista — sem acusar o candidato de nada.
          </p>
        </div>

        <ul className="space-y-3 self-center">
          {sinais.map((s, i) => (
            <li
              key={s}
              className="flex items-start gap-3 rounded-xl border bg-card px-5 py-4"
            >
              <span className="leitura mt-px shrink-0 t-legenda text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="t-corpo-sm leading-relaxed">{s}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function OQueMedimos() {
  return (
    <section id="medimos" className="border-b scroll-mt-16">
      <div className="medida secao grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="etiqueta">O instrumento</p>
          <h2 className="mt-4 t-titulo">
            Cinco dimensões, medidas do jeito que dá para defender.
          </h2>

          <p className="mt-6 t-corpo leading-relaxed text-muted-foreground">
            O instrumento é derivado do IPIP, que é de domínio público e mede o
            mesmo modelo de cinco fatores que o mercado vende como diferencial
            proprietário. A prova tem duas partes: {TOTAL_DE_ITENS} afirmações
            que geram o escore comparável entre pessoas, e {CENARIOS_POR_PROVA}{" "}
            situações de trabalho que servem para conferir se as duas histórias
            batem.
          </p>

          <p className="mt-4 t-corpo leading-relaxed text-muted-foreground">
            O escore das situações nunca entra no ranking. Ele compara dimensões
            dentro da mesma pessoa, e responder &ldquo;a Maria é mais organizada
            que o João?&rdquo; com esse tipo de escore é estatisticamente
            inválido — um erro comum no mercado.
          </p>

          <p className="mt-8 rounded-xl border-l-2 border-marca bg-secondary/50 px-5 py-4 t-corpo-sm leading-relaxed text-muted-foreground">
            Este é um questionário de autopercepção de comportamento no trabalho.
            Não é teste psicológico, avaliação psicológica, laudo nem
            diagnóstico, e não mede inteligência nem capacidade técnica.
          </p>
        </div>

        <ul className="space-y-4 self-center">
          {FATORES.map((f) => (
            <li key={f} className="rounded-xl border bg-card p-5">
              <div className="flex items-baseline gap-2.5">
                <span className="etiqueta">{f}</span>
                <h3 className="text-base font-semibold">
                  {NOMES_DE_FATOR[f].ui}
                </h3>
              </div>
              <p className="mt-2 t-corpo-sm text-muted-foreground">
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

function SegurancaEDecisao() {
  const garantias = [
    {
      Icone: UserRoundCheck,
      titulo: "Ordena, nunca elimina",
      texto:
        "Não existe e não vai existir corte automático por nota. A lista é sugestão de prioridade de conversa; a decisão continua sendo de quem entrevista.",
    },
    {
      Icone: SlidersHorizontal,
      titulo: "A régua é sua, e fica registrada",
      texto:
        "O perfil-alvo é copiado para a vaga na criação e vive com ela. Toda edição recalcula o que já entrou, para o ranking nunca misturar duas réguas.",
    },
    {
      Icone: ShieldCheck,
      titulo: "Nenhum dado sensível, prazo definido",
      texto:
        "Nada de origem, religião, opinião política, saúde ou biometria em etapa nenhuma. As respostas são apagadas no prazo de retenção que a sua empresa definir.",
    },
  ];

  return (
    <section className="border-b bg-superficie-2/60">
      <div className="medida secao">
        <p className="etiqueta">Segurança e decisão humana</p>
        <h2 className="mt-4 max-w-2xl t-titulo">
          O sistema dá referência. Quem decide é gente.
        </h2>

        <div className="mt-12 grid gap-x-10 gap-y-10 md:grid-cols-3">
          {garantias.map(({ Icone, titulo, texto }) => (
            <div key={titulo}>
              <Icone className="size-5 text-marca" aria-hidden />
              <h3 className="mt-4 text-base leading-snug font-semibold">
                {titulo}
              </h3>
              <p className="mt-2.5 t-corpo leading-relaxed text-muted-foreground">
                {texto}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-10 max-w-3xl t-corpo-sm leading-relaxed text-muted-foreground">
          O resultado é da empresa que aplicou. O candidato responde, é avisado
          de que o resultado vai para você e continua podendo pedir acesso,
          correção ou exclusão dos próprios dados a qualquer momento.
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
    r: `Cerca de seis minutos: ${TOTAL_DE_ITENS} afirmações rápidas e ${CENARIOS_POR_PROVA} situações de trabalho. Responde pelo celular, sem criar conta, e pode fechar e continuar depois pelo mesmo link — as respostas são salvas a cada clique.`,
  },
  {
    p: "O que acontece com os dados de quem responde?",
    r: "Ficam guardados pelo prazo que a empresa definir (12 meses por padrão) e depois são apagados. Nenhum dado sensível é coletado em nenhuma etapa: nada de origem, religião, opinião política, saúde ou biometria. O candidato pode pedir acesso, correção ou exclusão dos próprios dados a qualquer momento, e quem responde é a sua empresa, como controladora.",
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
    r: "Ainda não. Hoje o caminho é o link da vaga e a leitura direto no painel. Integração com ATS e ERP está no plano de evolução, não no produto atual.",
  },
];

function Perguntas() {
  return (
    <section id="perguntas" className="border-b scroll-mt-16">
      <div className="medida secao grid gap-12 lg:grid-cols-[20rem_1fr]">
        <div>
          <p className="etiqueta">Perguntas frequentes</p>
          <h2 className="mt-4 t-titulo">
            O que costumam perguntar antes de testar.
          </h2>
        </div>

        <div className="divide-y border-t">
          {PERGUNTAS_FREQUENTES.map((item) => (
            <details key={item.p} className="group py-5">
              <summary className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-4 rounded-sm text-base font-medium">
                {item.p}
                <span
                  aria-hidden
                  className="mt-1 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                >
                  <Minus className="size-4 rotate-90 group-open:rotate-0" />
                </span>
              </summary>
              <p className="mt-1 max-w-2xl t-corpo leading-relaxed text-muted-foreground">
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
      <div className="medida secao text-center">
        <h2 className="mx-auto max-w-2xl t-display">
          Decida com referência, não com impressão.
        </h2>
        <p className="mx-auto mt-5 max-w-lg t-corpo-lg text-muted-foreground">
          Crie a conta, publique uma vaga e mande o link para três candidatos
          hoje mesmo. Você vê o ranking ainda esta semana — e chega na entrevista
          sabendo o que perguntar.
        </p>
        <BotaoLink
          href="/cadastrar"
          variant="marca"
          size="lg"
          className="mt-9"
        >
          Criar minha primeira vaga
          <ArrowRight className="size-4" />
        </BotaoLink>
      </div>
    </section>
  );
}

function Rodape() {
  return (
    <footer className="medida py-14">
      <div className="flex flex-wrap items-start justify-between gap-10">
        <div className="max-w-xs">
          <Marca tamanho="md" />
          <p className="mt-4 t-corpo-sm leading-relaxed text-muted-foreground">
            Inteligência comportamental para recrutamento. Pessoa + vaga,
            aderência explicada — e as perguntas certas para a entrevista.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-14 gap-y-8 sm:grid-cols-3">
          <ColunaDoRodape
            titulo="Produto"
            itens={[
              { rotulo: "Como funciona", href: "#funciona" },
              { rotulo: "A faixa-alvo", href: "#faixa" },
              { rotulo: "O que medimos", href: "#medimos" },
            ]}
          />
          <ColunaDoRodape
            titulo="Conta"
            itens={[
              { rotulo: "Entrar", href: "/entrar" },
              { rotulo: "Criar conta", href: "/cadastrar" },
              { rotulo: "Acesso por código", href: "/acesso" },
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
        <p className="etiqueta">
          © {new Date().getFullYear()} Baliza by SPXIA
        </p>
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
              className="rounded-sm t-corpo-sm text-muted-foreground hover:text-foreground"
            >
              {item.rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
