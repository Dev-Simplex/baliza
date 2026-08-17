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
 * endereço, e dá para mandar o link para o gestor da área — que é quem mais
 * costuma ler o relatório sem nunca ter entrado aqui.
 *
 * ─── Esta é a segunda versão, e a primeira tinha cinco mentiras ───────────
 * Três revisores independentes leram a versão original: um sem conhecer o
 * produto, um conferindo cada afirmação contra o código, um percorrendo as
 * telas. Acharam 5 afirmações FALSAS e 12 exageradas, e a raiz de metade delas
 * era uma omissão só: o texto descrevia UMA prova, e o produto aplica uma
 * bateria de até quatro testes por vaga. É disso que dependem o tempo, o
 * número, o selo e as checagens — omitir a bateria fazia tudo o mais soar
 * absoluto quando era condicional.
 *
 * Por isso, aqui, toda frase que vale só para parte da bateria diz para qual
 * parte. É mais chato de ler e é a diferença entre explicar e enganar.
 *
 * ─── A ordem mudou por causa do leitor que nunca viu o produto ────────────
 * As cinco dimensões vinham DUAS seções depois do passo que manda "marcar o
 * quanto cada coisa importa" — a dúvida ficava aberta o caminho inteiro. Agora
 * elas vêm antes do caminho. E a seção do número deixou de ser só uma lista de
 * negações ("não é nota, não é erro, não tem corte") para dizer o que fazer
 * com ele.
 */

/** Um passo do caminho, com o nome REAL da tela onde ele acontece. */
const CAMINHO = [
  {
    n: 1,
    titulo: "Você descreve a vaga",
    texto:
      "Não é o anúncio: é o que a vaga PEDE de comportamento. Um caixa de farmácia precisa de paciência e capricho; um vendedor, de energia e insistência. Ao criar a vaga você escolhe um modelo pronto e, depois, ajusta o peso de cada uma das cinco coisas acima.",
    onde: "Vagas › Criar vaga, e depois › a vaga › Perfil-alvo › Ajustar",
    href: "/vagas",
  },
  {
    n: 2,
    titulo: "Você escolhe quais testes aplicar",
    texto:
      "São quatro, e a vaga usa os que você quiser. Aplicar só um leva 5 ou 6 minutos; aplicar os quatro leva cerca de 29. A página da vaga mostra o número exato da combinação que você montou — e é esse número que o candidato vê antes de começar.",
    onde: "Vagas › a vaga › Testes desta vaga",
    href: "/vagas",
  },
  {
    n: 3,
    titulo: "A pessoa responde",
    texto:
      "Você entrega um link, um QR Code ou um código de 4 dígitos. Ela abre no celular e responde. Não precisa criar conta nem instalar nada.",
    onde: "Vagas › a vaga › Acesso dos candidatos",
    href: "/vagas",
  },
  {
    n: 4,
    titulo: "O Prumo compara e você conversa",
    texto:
      "O sistema põe a resposta dela lado a lado com o que você pediu no passo 1, escolhe as perguntas de entrevista que valem a pena para aquela pessoa, e espera. Quem decide é você — e o parecer fica registrado com o seu nome e a data.",
    onde: "Candidatos › a pessoa › Parecer do analista",
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

/** Os testes, com o que cada um entrega e quanto custa de tempo. */
const TESTES = [
  {
    nome: "Prumo",
    tempo: "~6 min",
    faz: "O mapeamento completo da casa: as cinco dimensões, o arquétipo e o selo de confiança. Sozinho já produz a aderência.",
  },
  {
    nome: "Big Five",
    tempo: "~5 min",
    faz: "Mede as mesmas cinco dimensões, mais rápido e com menos nuance. Também produz aderência.",
  },
  {
    nome: "DISC",
    tempo: "~8 min",
    faz: "Estilo de trabalho — como a pessoa tende a agir, não o quanto ela serve. Não gera aderência.",
  },
  {
    nome: "Estilo Emocional do Cérebro",
    tempo: "~10 min",
    faz: "Seis dimensões emocionais e de atenção. Descreve tendências e não gera aderência.",
  },
  {
    nome: "Julgamento situacional",
    tempo: "~12 min",
    faz: "O único com resposta certa: apresenta situações de trabalho e compara a escolha dela com a esperada.",
  },
] as const;

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
            Aqui a ideia é parecida, com uma diferença que muda tudo.
          </strong>
        </p>
        <p className="mt-3 t-corpo leading-relaxed">
          O prumo do pedreiro tem uma referência só, a gravidade, e por isso ele
          julga: torta ou reta.{" "}
          <strong className="font-semibold">
            Aqui a referência é a vaga — e cada vaga é um prumo diferente.
          </strong>{" "}
          Não existe pessoa &ldquo;torta&rdquo;: existe alguém perto do que uma
          vaga pede e longe do que outra pede. A mesma pessoa, no mesmo dia, com
          a mesma resposta.
        </p>
        <p className="mt-3 t-corpo leading-relaxed text-muted-foreground">
          E o que ele não é: não é teste de QI e não é prova de conhecimento.
          Não reprova ninguém — nenhuma tela daqui elimina candidato sozinha.
        </p>
      </section>

      {/* ─── As cinco dimensões vêm ANTES do caminho ─────────────────────── */}
      <section className="mt-8 rounded-xl border bg-card p-6">
        <h2 className="text-base font-semibold">As cinco coisas que ele mede</h2>
        <p className="mt-2 t-corpo-sm leading-relaxed text-muted-foreground">
          Todo mundo tem um pouco de cada uma. Não existe lado bom e lado ruim —
          existe o que a vaga pede. São estas que você vai pesar no passo 1.
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

      {/* ─── A bateria: a omissão que fazia tudo soar absoluto ───────────── */}
      <section className="mt-8 rounded-xl border bg-card p-6">
        <h2 className="text-base font-semibold">Os quatro testes</h2>
        <p className="mt-2 t-corpo leading-relaxed text-muted-foreground">
          Quase tudo o que muda de uma vaga para outra — o tempo, se existe
          número, quais avisos aparecem — depende de quais destes você aplicou.
        </p>
        <dl className="mt-4 divide-y">
          {TESTES.map((t) => (
            <div key={t.nome} className="py-3">
              <dt className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium">{t.nome}</span>
                <span className="leitura shrink-0 t-legenda text-muted-foreground">
                  {t.tempo}
                </span>
              </dt>
              <dd className="mt-1 t-corpo leading-relaxed text-muted-foreground">
                {t.faz}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ─── O número grande: onde mora quase todo mal-entendido ────────── */}
      <section className="mt-8 rounded-xl border bg-card p-6">
        <h2 className="text-base font-semibold">
          O número grande, e o que fazer com ele
        </h2>
        <p className="mt-3 t-corpo leading-relaxed">
          Quando a vaga aplica o Prumo ou o Big Five, cada resposta ganha um
          número de 0 a 100 — tipo{" "}
          <span className="leitura font-semibold text-marca">72,4</span>. Ele
          chama <strong className="font-semibold">aderência</strong> e responde
          uma pergunta só:{" "}
          <em>o quanto esta pessoa se parece com o que ESTA vaga pediu.</em>{" "}
          Vaga que aplique só DISC e julgamento situacional não tem esse número,
          de propósito — sem as cinco dimensões não há o que comparar.
        </p>

        <div className="mt-4 rounded-lg border border-dashed p-4">
          <p className="t-corpo-sm leading-relaxed">
            <strong className="font-semibold">O que fazer com ele:</strong> use
            para escolher <em>por quem começar</em> a conversar quando há trinta
            pessoas e uma tarde. É ordem de prioridade, não nota de aprovação.
          </p>
          <p className="mt-2 t-corpo-sm leading-relaxed text-muted-foreground">
            E não compare o número de duas vagas diferentes: são réguas
            diferentes. Dentro da mesma vaga a comparação vale.
          </p>
        </div>

        <p className="mt-4 t-corpo leading-relaxed text-muted-foreground">
          Por isso ele nunca aparece sem o selo de confiança ao lado, e não
          existe nota de corte automática em lugar nenhum do sistema.
        </p>
      </section>

      {/* ─── Confiança: o que fazer quando a resposta parece estranha ───── */}
      <section className="mt-8 rounded-xl border bg-card p-6">
        <h2 className="text-base font-semibold">
          O selo de confiança: dá para acreditar nesta resposta?
        </h2>
        <p className="mt-3 t-corpo leading-relaxed">
          Ao lado do número tem um selo — <strong>alta</strong>,{" "}
          <strong>média</strong> ou <strong>baixa</strong>. Ele não fala da
          pessoa: fala do <em>jeito como ela respondeu</em>. O sistema olha três
          coisas:
        </p>
        <ul className="mt-4 space-y-2 t-corpo leading-relaxed">
          <li className="flex gap-2.5">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-dentro" />
            <span>
              <strong className="font-medium">Pressa.</strong> Respondeu em
              menos de dois segundos por tela, do começo ao fim?
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-marca-forte" />
            <span>
              <strong className="font-medium">Padrão uniforme.</strong> Marcou a
              mesma coisa em quase tudo?
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-fora" />
            <span>
              <strong className="font-medium">Incoerência.</strong> Algumas
              perguntas aparecem repetidas de outro jeito ao longo da prova; o
              aviso soa quando as respostas divergem no conjunto delas — um par
              solto não dispara nada.
            </span>
          </li>
        </ul>
        <p className="mt-4 t-corpo leading-relaxed text-muted-foreground">
          Esses avisos existem para o Big Five e o DISC.{" "}
          <strong className="font-semibold">Selo baixo não elimina ninguém</strong>{" "}
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
          Em toda resposta o Prumo monta uma lista de perguntas e explica por que
          cada uma está ali. Elas saem de um banco escrito à mão, e o sistema
          escolhe as que se aplicam <em>àquela pessoa naquela vaga</em>. Pedem um
          caso que aconteceu de verdade — &ldquo;me conta de um prazo que você
          perdeu&rdquo; — e não uma opinião.
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
              r: "Pode tentar, e às vezes o sistema percebe: há perguntas repetidas de outro jeito e uma checagem de quem responde “sempre o melhor”. Quando algo assim aparece, o selo de confiança cai e o roteiro passa a sugerir confirmar aqueles pontos na conversa. Não é detector de mentira: é um aviso para você ouvir com mais atenção.",
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
              p: "E se a pessoa responder de novo depois?",
              r: "Depende do teste. O Prumo tem banco grande e sorteia perguntas diferentes a cada aplicação, então refazer mede mudança de verdade. Big Five, DISC e julgamento situacional aplicam o banco inteiro — são 20, 12 e 8 questões fixas —, então repetir logo em seguida mede também a memória da prova anterior. Se for reaplicar, deixe um tempo passar.",
            },
            {
              p: "Serve para quem já trabalha aqui?",
              r: "Serve — para montar time, entender atrito entre duas pessoas ou preparar uma promoção. Só não use como avaliação de desempenho: ele mede jeito de trabalhar, não resultado entregue.",
            },
            {
              p: "Por que uma vaga minha não mostra número nenhum?",
              r: "Porque a bateria dela não inclui Prumo nem Big Five, e são esses dois que produzem as cinco dimensões. Sem elas não há o que comparar com o perfil da vaga, e mostrar zero seria pior que não mostrar nada — zero se lê como “candidato péssimo”. O relatório dessa vaga traz o que o DISC e o julgamento situacional mediram.",
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
