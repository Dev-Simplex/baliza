import { Esqueleto, EsqueletoDeGrafico } from "@/components/ui/esqueleto";

/** Carregando o candidato — a tela onde a decisão acontece. */
export default function CarregandoCandidato() {
  return (
    <div className="mx-auto max-w-6xl space-y-6" aria-busy="true">
      <span className="sr-only">Carregando o candidato</span>

      <div>
        <Esqueleto className="h-2.5 w-40" />
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Esqueleto className="h-8 w-64" />
            <Esqueleto className="mt-3 h-3 w-80" />
          </div>
          <div className="flex items-center gap-3">
            <Esqueleto className="h-6 w-32 rounded-full" />
            <div className="text-right">
              <Esqueleto className="ml-auto h-2.5 w-16" />
              <Esqueleto className="mt-2 ml-auto h-7 w-14" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          {/* "Por que a aderência é X": cinco faixas, uma por dimensão. */}
          <div className="rounded-xl border bg-card p-5">
            <Esqueleto className="h-3.5 w-56" />
            <Esqueleto className="mt-2 h-2.5 w-72" />
            <div className="mt-6 space-y-6">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i}>
                  <Esqueleto className="h-3 w-48" />
                  <Esqueleto className="mt-2.5 h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-marca/30 bg-marca-forte/[0.03] p-5">
            <Esqueleto className="h-3.5 w-44" />
            <Esqueleto className="mt-2 h-2.5 w-72" />
            <div className="mt-5 space-y-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex gap-3">
                  <Esqueleto className="size-4 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Esqueleto className="h-3.5 w-full" />
                    <Esqueleto className="h-2.5 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <Esqueleto className="h-2.5 w-20" />
            <Esqueleto className="mt-2 h-5 w-40" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i}>
                  <Esqueleto className="h-2.5 w-20" />
                  <Esqueleto className="mt-1.5 h-3 w-full" />
                </div>
              ))}
            </div>
          </div>

          <EsqueletoDeGrafico altura={250} />
        </div>
      </div>
    </div>
  );
}
