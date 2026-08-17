import {
  Esqueleto,
  EsqueletoDeGrafico,
  EsqueletoDaFaixaDeIndicadores,
  EsqueletoDePainel,
} from "@/components/ui/esqueleto";

/**
 * Esqueleto do painel.
 *
 * Espelha a grade real: quatro indicadores, ranking à esquerda, radar à
 * direita. Quando o conteúdo chega, nada salta de lugar.
 */
export default function CarregandoPainel() {
  return (
    <div className="space-y-6" aria-busy="true">
      <span className="sr-only">Carregando o painel</span>

      <div className="mb-6">
        <Esqueleto className="h-2.5 w-16" />
        <Esqueleto className="mt-2 h-8 w-52" />
      </div>

      <EsqueletoDaFaixaDeIndicadores />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EsqueletoDePainel linhas={6} />
        </div>
        <EsqueletoDeGrafico />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <EsqueletoDeGrafico altura={200} />
        <EsqueletoDeGrafico altura={200} />
      </div>
    </div>
  );
}
