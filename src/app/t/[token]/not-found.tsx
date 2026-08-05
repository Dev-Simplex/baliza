import type { Metadata } from "next";

import { AvisoDeLink } from "@/components/teste/aviso-de-link";

export const metadata: Metadata = {
  title: "Link não encontrado",
  robots: { index: false, follow: false },
};

export default function ConviteNaoEncontrado() {
  return (
    <AvisoDeLink titulo="Este link não abre nenhum questionário.">
      <p>
        O endereço pode ter chegado cortado — aplicativos de mensagem costumam
        quebrar links longos — ou o convite foi cancelado por quem o enviou.
      </p>
      <p>
        Copie o link inteiro de novo, do começo ao fim, ou peça um novo para a
        empresa que te chamou.
      </p>
    </AvisoDeLink>
  );
}
