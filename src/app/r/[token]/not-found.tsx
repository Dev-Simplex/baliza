import type { Metadata } from "next";

import { AvisoDeLink } from "@/components/teste/aviso-de-link";

export const metadata: Metadata = {
  title: "Resultado não encontrado",
  robots: { index: false, follow: false },
};

export default function ResultadoNaoEncontrado() {
  return (
    <AvisoDeLink
      titulo="Este link de resultado não abre."
      // Código de acesso não serve aqui: ele deixa de valer quando a prova
      // conclui, e quem procura um resultado já concluiu.
      mostrarCaminhoDoCodigo={false}
    >
      <p>
        Ou o endereço chegou cortado, ou este questionário ainda não foi
        concluído — o resultado só existe depois da última resposta.
      </p>
      <p>
        Se você respondeu e perdeu o link, peça à empresa que te chamou: ela
        consegue reenviar o seu.
      </p>
    </AvisoDeLink>
  );
}
