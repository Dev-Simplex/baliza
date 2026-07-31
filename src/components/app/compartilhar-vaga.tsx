"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Copy, Download, QrCode } from "lucide-react";
import { toast } from "sonner";

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
 * QR é o link desenhado (feira, mural, balcão) e o e-mail é o link entregue.
 */
export function CompartilharVaga({
  url,
  qrDataUrl,
  titulo,
}: {
  url: string;
  qrDataUrl: string;
  titulo: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      toast.success("Link copiado");
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("Não foi possível copiar. Selecione o link e copie manualmente.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg border bg-secondary/50 p-1.5">
        <code className="leitura flex-1 truncate px-2 t-legenda text-muted-foreground">
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

      <div className="flex gap-2">
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

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          nativeButton={false}
          render={
            <a
              href={`mailto:?subject=${encodeURIComponent(`Questionário — ${titulo}`)}&body=${encodeURIComponent(`Olá!\n\nPara seguir no processo da vaga de ${titulo}, responda o mapeamento comportamental neste link (leva cerca de 8 minutos):\n\n${url}\n\nObrigado!`)}`}
            />
          }
        >
          Enviar por e-mail
        </Button>
      </div>
    </div>
  );
}
