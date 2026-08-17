import { Esqueleto, EsqueletoDePainel } from "@/components/ui/esqueleto";

export default function CarregandoCandidatos() {
  return (
    <div aria-busy="true">
      <span className="sr-only">Carregando os candidatos</span>

      <div className="mb-6">
        <Esqueleto className="h-2.5 w-12" />
        <Esqueleto className="mt-2 h-8 w-40" />
        <Esqueleto className="mt-3 h-3 w-72" />
      </div>

      <EsqueletoDePainel linhas={8} titulo={false} />
    </div>
  );
}
