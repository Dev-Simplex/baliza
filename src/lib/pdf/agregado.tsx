import { Document, Page, Text, View } from "@react-pdf/renderer";

import { COR, CORPO, MarcaNoPapel, e } from "@/lib/pdf/relatorio";
import { NOMES_DE_FATOR, type Fator } from "@/lib/instrument/types";

/**
 * O relatório agregado, em papel.
 *
 * ─── Como ele difere do relatório do candidato ─────────────────────────────
 * Aquele descreve UMA pessoa e vai para a entrevista. Este descreve o PROCESSO e
 * vai para quem não abre o painel — a diretoria, o cliente da consultoria, a
 * reunião de fechamento do mês. São leitores diferentes, e é por isso que aqui
 * não aparece nome de candidato nenhum: quem precisa de nome abre o painel ou
 * pede o PDF daquela pessoa.
 *
 * Isso também resolve um problema de privacidade de graça. Um agregado sem
 * identificação pode circular por e-mail sem carregar dado pessoal junto — o
 * mesmo arquivo que o CSV não consegue ser, porque o CSV é linha por candidato.
 *
 * ─── Por que ele NÃO substitui o CSV ───────────────────────────────────────
 * O CSV existe para o que o produto não faz: cruzar com o ATS, filtrar, somar
 * de outro jeito. Ninguém dinamiza um PDF. Os dois exportam da mesma tela e
 * respondem a perguntas diferentes — este responde "como o processo está
 * andando", aquele responde "me dá os dados para eu fazer minha conta".
 */

export type DadosDoAgregado = {
  empresa: string;
  geradoEm: string;
  periodo: string;

  candidatos: number;
  vagasAbertas: number;
  concluidas: number;
  pendentes: number;
  aderenciaMedia: number | null;
  duracaoMedia: string | null;

  funil: Array<{ rotulo: string; valor: number }>;
  confianca: { alta: number; media: number; baixa: number; total: number };
  medias: { n: number; valores: Record<Fator, number> } | null;
  arquetipos: Array<{ nome: string; total: number }>;
  vagas: Array<{
    titulo: string;
    departamento: string | null;
    convites: number;
    concluidas: number;
    conversao: number | null;
    aderenciaMedia: number | null;
  }>;
};

const numero = (v: number | null, sufixo = "") =>
  v === null ? "—" : `${Math.round(v * 10) / 10}${sufixo}`;

export function AgregadoPdf({ d }: { d: DadosDoAgregado }) {
  return (
    <Document
      title={`Baliza — relatório do processo — ${d.empresa}`}
      author="Baliza"
    >
      <Page size="A4" style={e.pagina}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 22,
          }}
          fixed
        >
          <MarcaNoPapel />
          <Text style={[e.legenda, { textAlign: "right" }]}>
            {d.empresa}
            {"\n"}
            {d.geradoEm}
          </Text>
        </View>

        <Text style={e.titulo}>Como o processo está andando</Text>
        <Text style={[e.legenda, { marginTop: 3, marginBottom: 16 }]}>
          {d.periodo} · números agregados, sem identificação de candidato.
        </Text>

        {/* ─── O que o RH olha primeiro ─────────────────────────────────── */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          <Indicador rotulo="Candidatos" valor={String(d.candidatos)} />
          <Indicador rotulo="Vagas abertas" valor={String(d.vagasAbertas)} />
          <Indicador rotulo="Concluídas" valor={String(d.concluidas)} />
          <Indicador rotulo="Aguardando" valor={String(d.pendentes)} />
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
          <Indicador
            rotulo="Aderência média"
            valor={numero(d.aderenciaMedia)}
            // Sem selo ao lado, o número não é de UM candidato — é média da
            // base. A regra do §4.4 vale para pessoa, não para agregado; dito
            // aqui para ninguém ler isto como nota de alguém.
            apoio="média da base concluída"
          />
          <Indicador
            rotulo="Duração média"
            valor={d.duracaoMedia ?? "—"}
            apoio="do início à conclusão"
          />
        </View>

        {/* ─── Funil ────────────────────────────────────────────────────── */}
        <Secao titulo="Do convite à resposta" />
        {d.funil.map((etapa, i) => {
          const base = d.funil[0]?.valor || 1;
          const pct = Math.round((etapa.valor / base) * 100);
          return (
            <View key={etapa.rotulo} style={{ marginBottom: 7 }}>
              <View
                style={{ flexDirection: "row", justifyContent: "space-between" }}
              >
                <Text style={e.corpo}>{etapa.rotulo}</Text>
                <Text style={{ fontSize: 9, fontFamily: CORPO, fontWeight: 600 }}>
                  {etapa.valor}
                  {i > 0 && <Text style={e.legenda}>{`   ${pct}%`}</Text>}
                </Text>
              </View>
              <Trilho valor={pct} />
            </View>
          );
        })}

        {/* ─── Confiança ────────────────────────────────────────────────── */}
        <Secao titulo="Confiança das respostas" />
        <Text style={[e.legenda, { marginBottom: 8 }]}>
          O selo acompanha cada aderência. Muita resposta de confiança baixa é
          sinal de prova respondida às pressas — não de candidato ruim.
        </Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 6 }}>
          <Indicador rotulo="Alta" valor={String(d.confianca.alta)} />
          <Indicador rotulo="Média" valor={String(d.confianca.media)} />
          <Indicador rotulo="Baixa" valor={String(d.confianca.baixa)} />
        </View>

        {/* ─── Perfil médio ─────────────────────────────────────────────── */}
        {d.medias && (
          <>
            <Secao titulo="Perfil médio da base" />
            <Text style={[e.legenda, { marginBottom: 8 }]}>
              Sobre {d.medias.n} avaliações. Não existe perfil bom ou ruim: a
              leitura é sempre em relação à vaga.
            </Text>
            {(Object.keys(d.medias.valores) as Fator[]).map((f) => (
              <View key={f} style={{ marginBottom: 6 }}>
                <View
                  style={{ flexDirection: "row", justifyContent: "space-between" }}
                >
                  <Text style={e.corpo}>{NOMES_DE_FATOR[f].ui}</Text>
                  <Text style={{ fontSize: 9, fontFamily: CORPO, fontWeight: 600 }}>
                    {d.medias!.valores[f]}
                  </Text>
                </View>
                <Trilho valor={d.medias!.valores[f]} />
              </View>
            ))}
          </>
        )}

        <Rodape />
      </Page>

      {/* ─── Vagas: página própria, porque é tabela ──────────────────────── */}
      {d.vagas.length > 0 && (
        <Page size="A4" style={e.pagina}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
            fixed
          >
            <MarcaNoPapel />
            <Text style={[e.legenda, { textAlign: "right" }]}>{d.empresa}</Text>
          </View>

          <Text style={e.titulo}>Desempenho por vaga</Text>
          <Text style={[e.legenda, { marginTop: 3, marginBottom: 14 }]}>
            Conversão é quem concluiu sobre quem começou. Aderência é a média de
            quem concluiu — vazia quando a bateria da vaga não mede os cinco
            fatores.
          </Text>

          <View
            style={{
              flexDirection: "row",
              borderBottomWidth: 0.7,
              borderBottomColor: COR.linha,
              paddingBottom: 5,
              marginBottom: 5,
            }}
            fixed
          >
            <Text style={[e.etiqueta, { flex: 3 }]}>Vaga</Text>
            <Text style={[e.etiqueta, { flex: 1, textAlign: "right" }]}>Convites</Text>
            <Text style={[e.etiqueta, { flex: 1, textAlign: "right" }]}>Concluídas</Text>
            <Text style={[e.etiqueta, { flex: 1, textAlign: "right" }]}>Conversão</Text>
            <Text style={[e.etiqueta, { flex: 1, textAlign: "right" }]}>Aderência</Text>
          </View>

          {d.vagas.map((v) => (
            <View
              key={v.titulo}
              style={{
                flexDirection: "row",
                paddingVertical: 4,
                borderBottomWidth: 0.5,
                borderBottomColor: COR.linhaClara,
              }}
              wrap={false}
            >
              <View style={{ flex: 3, paddingRight: 8 }}>
                <Text style={e.corpo}>{v.titulo}</Text>
                {v.departamento && (
                  <Text style={e.legenda}>{v.departamento}</Text>
                )}
              </View>
              <Text style={[e.corpo, { flex: 1, textAlign: "right" }]}>
                {v.convites}
              </Text>
              <Text style={[e.corpo, { flex: 1, textAlign: "right" }]}>
                {v.concluidas}
              </Text>
              <Text style={[e.corpo, { flex: 1, textAlign: "right" }]}>
                {numero(v.conversao, "%")}
              </Text>
              <Text style={[e.corpo, { flex: 1, textAlign: "right" }]}>
                {numero(v.aderenciaMedia)}
              </Text>
            </View>
          ))}

          {d.arquetipos.length > 0 && (
            <>
              <Secao titulo="Arquétipos mais frequentes" />
              <Text style={[e.legenda, { marginBottom: 8 }]}>
                Camada de comunicação, nunca de ranking.
              </Text>
              {d.arquetipos.map((a) => (
                <View
                  key={a.nome}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 3,
                  }}
                >
                  <Text style={e.corpo}>{a.nome}</Text>
                  <Text style={{ fontSize: 9, fontFamily: CORPO, fontWeight: 600 }}>
                    {a.total}
                  </Text>
                </View>
              ))}
            </>
          )}

          <Rodape />
        </Page>
      )}
    </Document>
  );
}

function Indicador({
  rotulo,
  valor,
  apoio,
}: {
  rotulo: string;
  valor: string;
  apoio?: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        borderWidth: 0.7,
        borderColor: COR.linha,
        borderRadius: 4,
        paddingVertical: 7,
        paddingHorizontal: 9,
      }}
    >
      <Text style={e.etiqueta}>{rotulo}</Text>
      <Text
        style={{
          fontSize: 15,
          fontFamily: CORPO,
          fontWeight: 600,
          marginTop: 3,
        }}
      >
        {valor}
      </Text>
      {apoio && <Text style={[e.legenda, { marginTop: 1 }]}>{apoio}</Text>}
    </View>
  );
}

function Secao({ titulo }: { titulo: string }) {
  return (
    <Text
      style={{
        fontSize: 11,
        fontFamily: CORPO,
        fontWeight: 600,
        marginTop: 16,
        marginBottom: 7,
        paddingBottom: 4,
        borderBottomWidth: 0.7,
        borderBottomColor: COR.linha,
      }}
    >
      {titulo}
    </Text>
  );
}

/** Trilho de 0 a 100. O mesmo vocabulário visual da faixa, sem a faixa-alvo. */
function Trilho({ valor }: { valor: number }) {
  const largura = Math.max(0, Math.min(100, valor));
  return (
    <View
      style={{
        height: 3,
        backgroundColor: COR.linhaClara,
        borderRadius: 2,
        marginTop: 2,
      }}
    >
      <View
        style={{
          width: `${largura}%`,
          height: 3,
          backgroundColor: COR.marcaForte,
          borderRadius: 2,
        }}
      />
    </View>
  );
}

function Rodape() {
  return (
    <Text style={e.rodape} fixed>
      Baliza · números agregados, sem identificação de candidato. A aderência é
      referência para decidir, nunca nota de aprovação.
    </Text>
  );
}
