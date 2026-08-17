import {
  Esqueleto,
  EsqueletoDaFaixaDeIndicadores,
  EsqueletoDeLinha,
} from "@/components/ui/esqueleto";

/** Carregando os relatórios — seis agregações, todas na mesma requisição. */
export default function CarregandoRelatorios() {
  return (
    <div aria-busy="true">
      <span className="sr-only">Carregando os relatórios</span>

      <div className="mb-6">
        <Esqueleto className="h-2.5 w-20" />
        <Esqueleto className="mt-2 h-8 w-48" />
        <Esqueleto className="mt-3 h-3 w-96" />
      </div>

      <div className="space-y-4">
        <EsqueletoDaFaixaDeIndicadores />

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="overflow-hidden rounded-xl border bg-card shadow-baixa">
            <div className="border-b px-5 py-4">
              <Esqueleto className="h-3.5 w-48" />
              <Esqueleto className="mt-2 h-2.5 w-80" />
            </div>
            <div className="divide-y">
              {Array.from({ length: 5 }, (_, i) => (
                <EsqueletoDeLinha key={i} />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {Array.from({ length: 2 }, (_, i) => (
              <div key={i} className="rounded-xl border bg-card p-5 shadow-baixa">
                <Esqueleto className="h-3.5 w-40" />
                <Esqueleto className="mt-2 h-2.5 w-32" />
                <div className="mt-5 space-y-3">
                  {Array.from({ length: 3 }, (_, j) => (
                    <div key={j}>
                      <Esqueleto className="h-3 w-full" />
                      <Esqueleto className="mt-1.5 h-1.5 w-full rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
