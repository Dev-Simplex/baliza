"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { Check, Copy, Loader2, QrCode, UserPlus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { convidarPorEmail, type EstadoDoConvite } from "@/lib/actions/convite";

/**
 * Cadastro do candidato pelo RH — o primeiro passo da vaga por convite.
 *
 * Cadastrar e entregar o acesso são o MESMO momento, e por isso são a mesma
 * tela: assim que a pessoa entra, aparecem as três portas (link, QR e código),
 * e o RH escolhe ali como vai entregar. Separar em duas telas produziria a
 * pergunta "cadastrei, e agora?".
 *
 * As três vias abrem a mesma prova. O código não é senha — é a via que dá para
 * ditar no telefone.
 */
export function CadastrarCandidato({
  jobId,
  tituloDaVaga,
  baseDoSite,
}: {
  jobId: string;
  tituloDaVaga: string;
  baseDoSite: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [estado, acao, pendente] = useActionState(
    convidarPorEmail.bind(null, jobId),
    {} as EstadoDoConvite,
  );
  const [qr, setQr] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);
  const router = useRouter();

  const acesso = estado.acesso;

  // O QR é o link desenhado. Gerado aqui, no cliente, porque só existe depois
  // que a ação responde — e é por pessoa, não da vaga.
  useEffect(() => {
    const link = acesso?.link;
    // Sem `setQr(null)` aqui: zerar de forma síncrona dentro do efeito dispara
    // renderização em cascata. A limpeza acontece ao fechar o diálogo.
    if (!link) return;
    let valido = true;
    QRCode.toDataURL(link, {
      width: 440,
      margin: 1,
      color: { dark: "#0b0e14", light: "#ffffff" },
    })
      .then((url) => {
        if (valido) setQr(url);
      })
      .catch(() => setQr(null));
    return () => {
      valido = false;
    };
  }, [acesso?.link]);

  function aoMudarAbertura(proximo: boolean) {
    setAberto(proximo);
    if (!proximo) setQr(null);
    // Atualiza a lista de candidatos só ao FECHAR: revalidar com o diálogo
    // aberto troca a árvore por baixo dele e o resultado nunca aparece.
    if (!proximo && estado.ok) router.refresh();
  }

  async function copiar(texto: string, rotulo: string) {
    try {
      if (window.isSecureContext && navigator.clipboard) {
        await navigator.clipboard.writeText(texto);
      } else {
        // `navigator.clipboard` não existe fora de origem segura (http por IP).
        const campo = document.createElement("textarea");
        campo.value = texto;
        campo.style.position = "fixed";
        campo.style.top = "-1000px";
        document.body.appendChild(campo);
        campo.select();
        document.execCommand("copy");
        document.body.removeChild(campo);
      }
      setCopiado(rotulo);
      toast.success(`${rotulo} copiado`);
      window.setTimeout(() => setCopiado(null), 2000);
    } catch {
      toast.error("Não foi possível copiar. Selecione e copie manualmente.");
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAbertura}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5">
            <UserPlus className="size-3.5" />
            Cadastrar candidato
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar candidato</DialogTitle>
          <DialogDescription>
            Assim que cadastrar, aparecem as três formas de entregar o acesso:
            link, QR Code e código de 4 dígitos.
          </DialogDescription>
        </DialogHeader>

        {!acesso ? (
          <form action={acao} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="convite-nome">Nome do candidato</Label>
              <Input
                id="convite-nome"
                name="nome"
                required
                autoComplete="off"
                aria-invalid={Boolean(estado.campos?.nome)}
              />
              {estado.campos?.nome && (
                <p className="text-xs text-destructive">{estado.campos.nome}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="convite-email">E-mail</Label>
              <Input
                id="convite-email"
                name="email"
                type="email"
                required
                autoComplete="off"
                aria-invalid={Boolean(estado.campos?.email)}
              />
              {estado.campos?.email && (
                <p className="text-xs text-destructive">{estado.campos.email}</p>
              )}
            </div>

            {estado.erro && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {estado.erro}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => aoMudarAbertura(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={pendente} className="gap-1.5">
                {pendente && <Loader2 className="size-3.5 animate-spin" />}
                {pendente ? "Cadastrando" : "Cadastrar e gerar acesso"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="t-corpo-sm text-muted-foreground">{estado.mensagem}</p>

            <div className="space-y-3 rounded-lg border p-3">
              <div>
                <p className="etiqueta">1 · Link</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <code className="leitura flex-1 truncate rounded bg-secondary/60 px-2 py-1.5 t-legenda text-muted-foreground">
                    {acesso.link}
                  </code>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1.5"
                    onClick={() => copiar(acesso.link, "Link")}
                  >
                    {copiado === "Link" ? (
                      <Check className="size-3.5 text-dentro" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    Copiar
                  </Button>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="etiqueta">2 · QR Code</p>
                {qr ? (
                  <div className="mt-2 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qr}
                      alt={`QR Code de acesso de ${estado.candidato}`}
                      className="size-24 rounded-lg border bg-white p-1.5"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      nativeButton={false}
                      render={
                        <a
                          href={qr}
                          download={`acesso-${(estado.candidato ?? "candidato")
                            .toLowerCase()
                            .replace(/\s+/g, "-")}.png`}
                        />
                      }
                    >
                      <QrCode className="size-3.5" />
                      Baixar
                    </Button>
                  </div>
                ) : (
                  <p className="mt-1.5 t-legenda text-muted-foreground">
                    Gerando…
                  </p>
                )}
              </div>

              <div className="border-t pt-3">
                <p className="etiqueta">3 · Código</p>
                {acesso.codigo ? (
                  <>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="leitura rounded bg-secondary/60 px-3 py-1.5 text-xl tabular-nums tracking-[0.3em]">
                        {acesso.codigo}
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="gap-1.5"
                        onClick={() => copiar(acesso.codigo!, "Código")}
                      >
                        {copiado === "Código" ? (
                          <Check className="size-3.5 text-dentro" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                        Copiar
                      </Button>
                    </div>
                    <p className="mt-1.5 t-legenda text-muted-foreground">
                      Peça para digitar em{" "}
                      <span className="leitura">{baseDoSite}/acesso</span>
                    </p>
                  </>
                ) : (
                  <p className="mt-1.5 t-legenda text-muted-foreground">
                    Sem código disponível no momento — use o link ou o QR.
                  </p>
                )}
              </div>
            </div>

            {!estado.enviado && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                nativeButton={false}
                render={
                  <a
                    href={`mailto:?subject=${encodeURIComponent(
                      `${tituloDaVaga} — mapeamento comportamental`,
                    )}&body=${encodeURIComponent(
                      `Olá!\n\nPara seguir no processo da vaga de ${tituloDaVaga}, responda o mapeamento comportamental (leva cerca de 8 minutos):\n\n${acesso.link}\n\nSe preferir, entre em ${baseDoSite}/acesso com o código ${acesso.codigo ?? ""}.\n\nObrigado!`,
                    )}`}
                  />
                }
              >
                Abrir no meu e-mail
              </Button>
            )}

            <Button
              size="sm"
              className="w-full"
              onClick={() => aoMudarAbertura(false)}
            >
              Concluir
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
