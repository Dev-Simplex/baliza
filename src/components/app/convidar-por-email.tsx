"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
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
 * Convite por e-mail.
 *
 * O link que sai daqui é PESSOAL (`/t/<token>`), não o link público da vaga:
 * como o convite já sabe quem é o candidato, ele cai direto no questionário sem
 * repetir nome e e-mail — e a vaga passa a saber quem foi chamado e ainda não
 * respondeu.
 *
 * Sem servidor SMTP configurado o envio não acontece, e a ação devolve o link
 * em vez de fingir que enviou: aí a tela oferece o caminho manual.
 */
export function ConvidarPorEmail({
  jobId,
  tituloDaVaga,
}: {
  jobId: string;
  tituloDaVaga: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [estado, acao, pendente] = useActionState(
    convidarPorEmail.bind(null, jobId),
    {} as EstadoDoConvite,
  );
  const router = useRouter();

  /**
   * A página só é atualizada ao FECHAR.
   *
   * A ação não revalida o próprio caminho: fazer isso troca a árvore por baixo
   * do diálogo aberto e o resultado nunca chega na tela — o botão fica preso em
   * "Enviando" mesmo com o convite já gravado. Atualizar aqui, depois que o
   * diálogo saiu, mantém o contador de "aguardando resposta" em dia sem esse
   * efeito colateral.
   */
  function aoMudarAbertura(proximo: boolean) {
    setAberto(proximo);
    if (!proximo && estado.ok) router.refresh();
  }

  async function copiarLink(link: string) {
    try {
      if (window.isSecureContext && navigator.clipboard) {
        await navigator.clipboard.writeText(link);
      } else {
        const campo = document.createElement("textarea");
        campo.value = link;
        campo.style.position = "fixed";
        campo.style.top = "-1000px";
        document.body.appendChild(campo);
        campo.select();
        document.execCommand("copy");
        document.body.removeChild(campo);
      }
      toast.success("Link do convite copiado");
    } catch {
      toast.error("Não foi possível copiar. Selecione o link e copie manualmente.");
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAbertura}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Mail className="size-3.5" />
            Convidar por e-mail
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar por e-mail</DialogTitle>
          <DialogDescription>
            A pessoa recebe um link pessoal e cai direto no questionário, sem
            precisar informar nome e e-mail de novo.
          </DialogDescription>
        </DialogHeader>

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

          {estado.mensagem && (
            <div className="space-y-2 rounded-md bg-secondary/60 px-3 py-2.5">
              <p className="t-legenda text-muted-foreground">{estado.mensagem}</p>

              {estado.linkParaEnvioManual && (
                <>
                  <code className="leitura block truncate t-legenda text-muted-foreground">
                    {estado.linkParaEnvioManual}
                  </code>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => copiarLink(estado.linkParaEnvioManual!)}
                    >
                      Copiar link
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      nativeButton={false}
                      render={
                        <a
                          href={`mailto:?subject=${encodeURIComponent(
                            `${tituloDaVaga} — mapeamento comportamental`,
                          )}&body=${encodeURIComponent(
                            `Olá!\n\nPara seguir no processo da vaga de ${tituloDaVaga}, responda o mapeamento comportamental neste link (leva cerca de 8 minutos):\n\n${estado.linkParaEnvioManual}\n\nObrigado!`,
                          )}`}
                        />
                      }
                    >
                      Abrir no meu e-mail
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => aoMudarAbertura(false)}
            >
              Fechar
            </Button>
            <Button type="submit" size="sm" disabled={pendente} className="gap-1.5">
              {pendente && <Loader2 className="size-3.5 animate-spin" />}
              {pendente ? "Enviando" : "Enviar convite"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
