import {
  Esqueleto,
  EsqueletoDeGrafico,
  EsqueletoDeIndicador,
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
    <div className="mx-auto max-w-7xl space-y-6" aria-busy="true">
      <span className="sr-only">Carregando o painel</span>

      <div className="mb-6">
        <Esqueleto className="h-2.5 w-16" />
        <Esqueleto className="mt-2 h-8 w-52" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <EsqueletoDeIndicador key={i} />
        ))}
      </div>

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
