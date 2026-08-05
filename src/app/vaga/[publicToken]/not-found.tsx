import type { Metadata } from "next";

import { AvisoDeLink } from "@/components/teste/aviso-de-link";

export const metadata: Metadata = {
  title: "Vaga não encontrada",
  robots: { index: false, follow: false },
};

export default function VagaNaoEncontrada() {
  return (
    <AvisoDeLink titulo="Não encontramos esta vaga.">
      <p>
        O endereço da vaga é legível de propósito, para ser ditado e digitado —
        mas basta uma letra trocada para cair aqui. Confira o link do anúncio,
        inclusive o trecho depois do último hífen.
      </p>
      <p>A vaga também pode ter sido encerrada pela empresa.</p>
    </AvisoDeLink>
  );
}
