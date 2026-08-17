import {
  Esqueleto,
  EsqueletoDeLinha,
} from "@/components/ui/esqueleto";

/**
 * Carregando a vaga.
 *
 * É a página mais lenta do painel — ranking, convites em aberto e o desenho do
 * QR na mesma requisição. Sem esqueleto, a navegação parecia travada.
 */
export default function CarregandoVaga() {
  return (
    <div aria-busy="true">
      <span className="sr-only">Carregando a vaga</span>

      <div className="mb-6">
        <Esqueleto className="h-2.5 w-16" />
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Esqueleto className="h-8 w-72" />
            <Esqueleto className="mt-3 h-3 w-56" />
          </div>
          <Esqueleto className="h-6 w-20 rounded-full" />
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="overflow-hidden rounded-xl border bg-card shadow-baixa">
          <div className="border-b px-5 py-4">
            <Esqueleto className="h-3.5 w-52" />
            <Esqueleto className="mt-2 h-2.5 w-80" />
          </div>
          <div className="divide-y">
            {Array.from({ length: 4 }, (_, i) => (
              <EsqueletoDeLinha key={i} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5 shadow-baixa">
            <Esqueleto className="h-3.5 w-40" />
            <Esqueleto className="mt-2 h-2.5 w-56" />
            <Esqueleto className="mt-4 h-10 w-full rounded-lg" />
            <div className="mt-3 flex gap-2">
              <Esqueleto className="h-7 w-24 rounded-lg" />
              <Esqueleto className="h-7 w-40 rounded-lg" />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-baixa">
            <Esqueleto className="h-3.5 w-28" />
            <Esqueleto className="mt-2 h-2.5 w-52" />
            <div className="mt-5 space-y-5">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i}>
                  <Esqueleto className="h-3 w-44" />
                  <Esqueleto className="mt-2 h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
