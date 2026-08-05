"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Copy, Download, QrCode } from "lucide-react";
import { toast } from "sonner";

import { CadastrarCandidato } from "@/components/app/cadastrar-candidato";
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
}: {
  url: string;
  qrDataUrl: string;
  titulo: string;
  jobId: string;
  /** Aberta: o link público vale. Fechada: só quem o RH cadastrou entra. */
  aberta: boolean;
  baseDoSite: string;
}) {
  const [copiado, setCopiado] = useState(false);
  const idDoLink = "link-publico-da-vaga";

  /**
   * `navigator.clipboard` só existe em origem SEGURA — https ou localhost. Quem
   * abre o painel pelo IP da rede (`http://192.168.0.10:3300`) não tem a API, e
   * o botão principal do produto caía direto no erro. O caminho antigo do
   * `execCommand` continua valendo em http e é o que salva esse caso.
   */
  async function copiar() {
    const marcarSucesso = () => {
      setCopiado(true);
      toast.success("Link copiado");
      window.setTimeout(() => setCopiado(false), 2000);
    };

    if (window.isSecureContext && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        marcarSucesso();
        return;
      } catch {
        // Permissão negada: ainda dá para tentar o caminho legado abaixo.
      }
    }

    try {
      const campo = document.createElement("textarea");
      campo.value = url;
      // Fora da tela, mas selecionável: `display:none` não copia.
      campo.setAttribute("readonly", "");
      campo.style.position = "fixed";
      campo.style.top = "-1000px";
      document.body.appendChild(campo);
      campo.select();
      const deuCerto = document.execCommand("copy");
      document.body.removeChild(campo);
      if (!deuCerto) throw new Error("execCommand recusou");
      marcarSucesso();
    } catch {
      // Último recurso: deixa o link selecionado para o Ctrl+C do usuário.
      selecionarLink();
      toast.error("Não foi possível copiar sozinho. O link está selecionado — use Ctrl+C.");
    }
  }

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
        <Button size="sm" variant="secondary" onClick={copiar} className="gap-1.5">
          {copiado ? (
            <Check className="size-3.5 text-dentro" />
          ) : (
            <Copy className="size-3.5" />
          )}
          {copiado ? "Copiado" : "Copiar"}
        </Button>
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
          </DialogContent>
        </Dialog>
        )}

        <CadastrarCandidato
          jobId={jobId}
          tituloDaVaga={titulo}
          baseDoSite={baseDoSite}
        />
      </div>
    </div>
  );
}
