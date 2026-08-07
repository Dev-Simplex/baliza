"use client";

import Image from "next/image";
import { Download, QrCode } from "lucide-react";

import { CadastrarCandidato } from "@/components/app/cadastrar-candidato";
import { BotaoCopiar } from "@/components/app/copiar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Compartilhamento da vaga.
 *
 * Três formas, mesmo destino: o link é a única coisa que existe de verdade. O
 * QR é o link desenhado (feira, mural, balcão) e o convite por e-mail é o link
 * entregue — esse último é PESSOAL (`/t/<token>`), então o convidado não repete
 * nome e e-mail e a vaga sabe quem foi chamado.
 */
export function CompartilharVaga({
  url,
  qrDataUrl,
  titulo,
  jobId,
  aberta,
  baseDoSite,
  podeCadastrar = true,
  tempoDaProva,
}: {
  url: string;
  /** `null` quando o desenho do QR falhou — ver `src/lib/qr.ts`. */
  qrDataUrl: string | null;
  titulo: string;
  jobId: string;
  /** Aberta: o link público vale. Fechada: só quem o RH cadastrou entra. */
  aberta: boolean;
  baseDoSite: string;
  /**
   * Copiar o link e ver o QR é leitura; cadastrar candidato é escrita e exige
   * RECRUITER. Quem só lê continua conseguindo compartilhar a vaga.
   */
  podeCadastrar?: boolean;
  /** Repassado à tela de cadastro: o convite tem que prometer o tempo real. */
  tempoDaProva: string;
}) {
  const idDoLink = "link-publico-da-vaga";

  /** Seleciona o texto do link, para copiar na mão. */
  function selecionarLink() {
    const alvo = document.getElementById(idDoLink);
    if (!alvo) return;
    const intervalo = document.createRange();
    intervalo.selectNodeContents(alvo);
    const selecao = window.getSelection();
    selecao?.removeAllRanges();
    selecao?.addRange(intervalo);
  }

  return (
    <div className="space-y-3">
      {/* Vaga por convite não tem link público para mostrar: mostrar assim
          mesmo faria o RH copiar um endereço que recusa quem abrir. */}
      {!aberta && (
        <p className="rounded-lg border border-dashed px-3 py-2.5 t-legenda leading-relaxed text-muted-foreground">
          Esta vaga é <strong className="font-medium text-foreground">por convite</strong>:
          só responde quem você cadastrar. Quem abrir o endereço público vê um
          aviso e o caminho para entrar com o código.
        </p>
      )}

      {aberta && (
      <div className="flex items-center gap-2 rounded-lg border bg-secondary/50 p-1.5">
        <code
          id={idDoLink}
          onClick={selecionarLink}
          className="leitura flex-1 cursor-text truncate px-2 t-legenda text-muted-foreground"
          title={url}
        >
          {url}
        </code>
        {/* Se nem o `execCommand` funcionar, sobra deixar o link selecionado
            para o Ctrl+C — melhor que um erro sem saída. */}
        <BotaoCopiar
          texto={url}
          confirmacao="Link copiado"
          rotuloAcessivel="Copiar o link público da vaga"
          aoFalhar={selecionarLink}
        >
          Copiar
        </BotaoCopiar>
      </div>
      )}

      <div className="flex gap-2">
        {aberta && (
        <Dialog>
          <DialogTrigger
            render={
              <Button variant="outline" size="sm" className="gap-1.5">
                <QrCode className="size-3.5" />
                QR Code
              </Button>
            }
          />
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>QR Code da vaga</DialogTitle>
              <DialogDescription>
                Aponte a câmera para abrir o questionário. Serve para mural,
                balcão e feira de recrutamento.
              </DialogDescription>
            </DialogHeader>

            {/* O QR pode não ter saído (ver `src/lib/qr.ts`). Dizer isso é
                melhor que mostrar uma imagem quebrada — e o link ali em cima
                continua sendo a via que sempre funciona. */}
            {qrDataUrl ? (
              <div className="flex flex-col items-center gap-4 py-2">
                <div className="rounded-xl border bg-white p-4">
                  <Image
                    src={qrDataUrl}
                    alt={`QR Code da vaga ${titulo}`}
                    width={220}
                    height={220}
                    unoptimized
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  nativeButton={false}
                  render={
                    <a href={qrDataUrl} download={`qrcode-${titulo.slice(0, 30)}.png`} />
                  }
                >
                  <Download className="size-3.5" />
                  Baixar imagem
                </Button>
              </div>
            ) : (
              <p className="py-2 t-corpo-sm leading-relaxed text-muted-foreground">
                Não foi possível gerar o QR Code desta vaga. Use o link acima —
                é o mesmo destino.
              </p>
            )}
          </DialogContent>
        </Dialog>
        )}

        {podeCadastrar && (
          <CadastrarCandidato
            tempoDaProva={tempoDaProva}
            jobId={jobId}
            tituloDaVaga={titulo}
            baseDoSite={baseDoSite}
          />
        )}
      </div>
    </div>
  );
}
