import type { Metadata } from "next";
import Link from "next/link";

import { CabecalhoDePagina } from "@/components/app/cabecalho-de-pagina";
import { BotaoLink } from "@/components/ui/botao-link";
import { NOMES_DE_FATOR, FATORES } from "@/lib/instrument/types";

export const metadata: Metadata = { title: "Como funciona" };

/**
 * A página que explica o produto para quem abriu o Prumo pela primeira vez.
 *
 * ─── Por que uma PÁGINA, e não um passeio guiado com balões ────────────────
 * Balão que aparece uma vez some exatamente quando a pessoa precisa dele: a
 * dúvida sobre o que significa "aderência 58,1" não nasce no primeiro login,
 * nasce três dias depois, olhando o primeiro resultado. Página fica, tem
 * endereço, é possível mandar o link para o gestor da área — que é quem mais
 * costuma ler o relatório sem nunca ter entrado aqui.
 *
 * ─── Por que ela repete coisas que já estão em outras telas ───────────────
 * De propósito. Cada tela explica o SEU pedaço no momento em que ele aparece;
 * esta é a única que mostra como os pedaços se encaixam. Quem já entendeu não
 * volta aqui, e não custa nada a ele.
 *
 * ─── A linguagem ──────────────────────────────────────────────────────────
 * Sem "instrumento psicométrico", sem "fator", sem "percentil". As cinco
 * dimensões aparecem com o nome de gente que o produto já usa na tela
 * (`NOMES_DE_FATOR.ui`), e não com o nome técnico. Onde um termo do mercado é
 * inevitável — DISC, Big Five — ele vem traduzido na mesma frase.
 */

/** Um passo do caminho, com o nome da tela onde ele acontece. */
const CAMINHO = [
  {
    n: 1,
    titulo: "Você descreve a vaga",
    texto:
      "Não é o anúncio: é o que a vaga PEDE de comportamento. Um caixa de farmácia precisa de paciência e capricho; um vendedor, de energia e insistência. Você marca o quanto cada coisa importa nessa vaga específica.",
    onde: "Vagas › Criar vaga",
    href: "/vagas",
  },
  {
    n: 2,
    titulo: "A pessoa responde",
    texto:
      "Você manda um link. Ela abre no celular, responde de 6 a 25 minutos (depende do que você escolheu aplicar) e pronto. Não tem certo nem errado, e ela não precisa criar conta nem instalar nada.",
    onde: "Vagas › a vaga › Convidar",
    href: "/vagas",
  },
  {
    n: 3,
    titulo: "O Prumo compara",
    texto:
      "O sistema põe a resposta dela lado a lado com o que você pediu no passo 1 e mostra o quanto bate. É só isso que o número grande significa.",
    onde: "Candidatos",
    href: "/candidatos",
  },
  {
    n: 4,
    titulo: "Você conversa e decide",
    texto:
      "O Prumo escreve as perguntas de entrevista que valem a pena para AQUELA pessoa, você conversa, e registra o que decidiu. A decisão é sua — o sistema nunca aprova nem reprova ninguém.",
    onde: "Candidatos › a pessoa › Parecer",
    href: "/candidatos",
  },
] as const;

/** O que cada dimensão quer dizer, em uma frase que não precisa de dicionário. */
const EM_MIUDOS: Record<string, string> = {
  C: "Se organiza, cumpre prazo e termina o que começou.",
  E: "Segura a pressão sem descontar nos outros nem travar.",
  X: "Puxa conversa, fala em público, gosta de gente por perto.",
  A: "Coopera, cede quando precisa, evita briga por bobagem.",
  O: "Gosta de coisa nova, de mudar o jeito de fazer, de aprender.",
};

export default function PaginaComoFunciona() {
  return (
    <div className="mx-auto max-w-3xl">
      <CabecalhoDePagina
        etiqueta="Comece por aqui"
        titulo="Como o Prumo funciona"
        descricao="Cinco minutos de leitura. Depois disso você entende qualquer tela daqui."
      />

      {/* ─── A ideia inteira, antes de qualquer detalhe ─────────────────── */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="text-base font-semibold">A ideia em uma frase</h2>
        <p className="mt-3 t-corpo leading-relaxed">
          Prumo é o nome daquele peso de pedreiro pendurado num barbante: você
          encosta na parede e ele mostra se está torta ou reta.{" "}
          <strong className="font-semibold">
            Aqui é a mesma coisa, mas para pessoas e vagas.
          </strong>{" "}
          Você diz como é a vaga, a pessoa responde uma prova curta, e o sistema
          mostra o quanto ela chega perto — sem dizer se ela é boa ou ruim.
        </p>
        <p className="mt-3 t-corpo leading-relaxed text-muted-foreground">
          E é importante o que ele <em>não</em> é: não é teste de QI, não é prova
          de conhecimento, não tem resposta certa e não reprova ninguém. É uma
          pista para a sua conversa ficar melhor.
        </p>
      </section>

      {/* ─── O caminho, do começo ao fim ────────────────────────────────── */}
      <h2 className="mt-8 text-base font-semibold">O caminho, do começo ao fim</h2>
      <ol className="mt-4 space-y-3">
        {CAMINHO.map((p) => (
          <li key={p.n} className="flex gap-4 rounded-xl border bg-card p-5">
            <span
              aria-hidden
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-marca-suave leitura text-sm font-semibold text-marca"
            >
              {p.n}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold">{p.titulo}</h3>
              <p className="mt-1.5 t-corpo leading-relaxed">{p.texto}</p>
              <Link
                href={p.href}
                className="etiqueta mt-2.5 inline-block text-marca hover:underline"
              >
                {p.onde}
              </Link>
            </div>
          </li>
        ))}
      </ol>

      {/* ─── O número grande: onde mora quase todo mal-entendido ────────── */}
      <section className="mt-8 rounded-xl border bg-card p-6">
        <h2 className="text-base font-semibold">
          O número grande não é uma nota
        </h2>
        <p className="mt-3 t-corpo leading-relaxed">
          Em cada resposta você vê um número, tipo{" "}
          <span className="leitura font-semibold text-marca">72,4</span>. Ele
          chama <strong className="font-semibold">aderência</strong> e responde
          uma única pergunta:{" "}
          <em>o quanto esta pessoa se parece com o que ESTA vaga pediu.</em>
        </p>

        <div className="mt-4 rounded-lg border border-dashed p-4">
          <p className="t-corpo-sm leading-relaxed">
            A mesma pessoa, no mesmo dia, com a mesma resposta, pode dar{" "}
            <span className="leitura font-semibold">91</span> numa vaga e{" "}
            <span className="leitura font-semibold">38</span> em outra. Não é
            erro. É que as duas vagas pedem coisas diferentes — e é exatamente
            para isso que o número serve.
          </p>
        </div>

        <p className="mt-4 t-corpo leading-relaxed text-muted-foreground">
          Por isso ele nunca aparece sozinho, e não existe &ldquo;nota de
          corte&rdquo; automática: ninguém é eliminado pelo número.
        </p>
      </section>

      {/* ─── As cinco dimensões, em português de gente ──────────────────── */}
      <section className="mt-8 rounded-xl border bg-card p-6">
        <h2 className="text-base font-semibold">As cinco coisas que ele mede</h2>
        <p className="mt-2 t-corpo-sm leading-relaxed text-muted-foreground">
          Todo mundo tem um pouco de cada uma. Não existe lado bom e lado ruim —
          existe o que a vaga pede.
        </p>
        <dl className="mt-4 divide-y">
          {FATORES.map((f) => (
            <div key={f} className="flex flex-wrap gap-x-4 gap-y-1 py-2.5">
              <dt className="w-52 shrink-0 text-sm font-medium">
                {NOMES_DE_FATOR[f].ui}
              </dt>
              <dd className="min-w-0 flex-1 t-corpo text-muted-foreground">
                {EM_MIUDOS[f]}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ─── Confiança: o que fazer quando a resposta parece estranha ───── */}
      <section className="mt-8 rounded-xl border bg-card p-6">
        <h2 className="text-base font-semibold">
          O selo de confiança: dá para acreditar nesta resposta?
        </h2>
        <p className="mt-3 t-corpo leading-relaxed">
          Ao lado do número tem um selo — <strong>alta</strong>,{" "}
          <strong>média</strong> ou <strong>baixa</strong>. Ele não fala da
          pessoa: fala do <em>jeito como ela respondeu</em>.
        </p>
        <ul className="mt-4 space-y-2 t-corpo leading-relaxed">
          <li className="flex gap-2.5">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-dentro" />
            <span>
              Respondeu depressa demais, tipo dois segundos por tela? O sistema
              avisa.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-marca-forte" />
            <span>
              Marcou tudo igual, a mesma resposta do início ao fim? Avisa também.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-fora" />
            <span>
              Duas perguntas parecidas com respostas que se contradizem? Avisa.
            </span>
          </li>
        </ul>
        <p className="mt-4 t-corpo leading-relaxed text-muted-foreground">
          Selo baixo <strong className="font-semibold">não elimina ninguém</strong>{" "}
          e não quer dizer que a pessoa mentiu. Quer dizer: leia com reserva e
          confirme na conversa.
        </p>
      </section>

      {/* ─── O roteiro: a parte que economiza mais tempo ─────────────────── */}
      <section className="mt-8 rounded-xl border bg-card p-6">
        <h2 className="text-base font-semibold">
          O roteiro de entrevista é a parte mais útil
        </h2>
        <p className="mt-3 t-corpo leading-relaxed">
          Em toda resposta o Prumo escreve perguntas feitas{" "}
          <em>para aquela pessoa naquela vaga</em>, e explica por que cada uma
          está ali. Elas pedem um caso que aconteceu de verdade — &ldquo;me conta
          de um prazo que você perdeu&rdquo; — e não uma opinião.
        </p>
        <p className="mt-3 t-corpo leading-relaxed text-muted-foreground">
          Dá para copiar tudo com um clique e levar para a conversa, ou baixar o
          relatório em PDF e imprimir.
        </p>
      </section>

      {/* ─── As três regras, que são a política do produto ──────────────── */}
      <section className="mt-8 rounded-xl border border-marca/30 bg-marca-suave/40 p-6">
        <h2 className="text-base font-semibold">
          Três regras que o Prumo não abre mão
        </h2>
        <ol className="mt-4 space-y-3 t-corpo leading-relaxed">
          <li>
            <strong className="font-semibold">1.</strong> O resultado{" "}
            <strong className="font-semibold">nunca</strong> é o único critério.
            Ele entra junto com currículo, experiência e conversa.
          </li>
          <li>
            <strong className="font-semibold">2.</strong> A conversa vem antes da
            decisão. O teste levanta o que perguntar; quem decide é você, depois
            de ouvir a pessoa.
          </li>
          <li>
            <strong className="font-semibold">3.</strong> Nenhuma dimensão
            elimina candidato sozinha. &ldquo;Tirou baixo em Energia Social&rdquo;
            não é motivo de recusa — é assunto de entrevista.
          </li>
        </ol>
        <p className="mt-4 t-corpo-sm leading-relaxed text-muted-foreground">
          Não são só boas intenções: é o que a lei espera de quem usa sistema
          para apoiar decisão sobre pessoas, e é por isso que o Prumo guarda quem
          decidiu o quê, e quando.
        </p>
      </section>

      {/* ─── Perguntas que todo mundo faz ────────────────────────────────── */}
      <section className="mt-8">
        <h2 className="text-base font-semibold">Perguntas que todo mundo faz</h2>
        <div className="mt-4 space-y-3">
          {[
            {
              p: "A pessoa pode mentir para se dar bem?",
              r: "Pode tentar, e o sistema costuma perceber: existem perguntas repetidas de outro jeito e uma checagem de quem responde “sempre o melhor”. Quando isso acontece, o selo de confiança cai e o roteiro passa a sugerir confirmar aqueles pontos na conversa.",
            },
            {
              p: "Preciso ser psicólogo para usar?",
              r: "Não. Toda tela é escrita em linguagem comum, e o que o sistema não pode afirmar com segurança ele simplesmente não mostra.",
            },
            {
              p: "O candidato vê o resultado dele?",
              r: "Não. O resultado é de quem aplicou o teste. A pessoa vê só que terminou, e nada mais.",
            },
            {
              p: "Serve para quem já trabalha aqui?",
              r: "Serve — para montar time, entender atrito entre duas pessoas ou preparar uma promoção. Só não use como avaliação de desempenho: ele mede jeito de trabalhar, não resultado entregue.",
            },
            {
              p: "E se a pessoa responder de novo depois?",
              r: "Cada aplicação sorteia perguntas diferentes do banco, então refazer mede mudança de verdade — não memória da prova anterior.",
            },
          ].map((q) => (
            <details
              key={q.p}
              className="group rounded-xl border bg-card px-5 py-4"
            >
              <summary className="cursor-pointer list-none text-sm font-medium marker:hidden">
                {q.p}
                <span
                  aria-hidden
                  className="float-right text-muted-foreground transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 t-corpo leading-relaxed text-muted-foreground">
                {q.r}
              </p>
            </details>
          ))}
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-2 border-t pt-6">
        <BotaoLink href="/vagas">Criar minha primeira vaga</BotaoLink>
        <BotaoLink href="/dashboard" variant="outline">
          Voltar para a visão geral
        </BotaoLink>
      </div>
    </div>
  );
}
