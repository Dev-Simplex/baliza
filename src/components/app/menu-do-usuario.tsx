"use client";

import { useTransition } from "react";
import { LifeBuoy, LogOut, RotateCcw, Settings } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { reverTutorialDeEntrada, sair } from "@/lib/actions/sessao";
import { iniciais, ROTULO_DE_PAPEL } from "@/lib/formato";

/**
 * O menu do canto, atrás do nome de quem está logado.
 *
 * ─── Ele derrubava a tela inteira ao ser aberto ───────────────────────────
 * O bloco de identidade usava `DropdownMenuLabel`, que no Base UI é
 * `Menu.GroupLabel` e EXIGE um `Menu.Group` em volta. Sem o grupo ele lança
 * "MenuGroupContext is missing" — e como o erro sobe no clique, quem tocava no
 * próprio nome caía na tela de "Esta tela não carregou". O caminho mais óbvio
 * do produto, e o único jeito de sair da conta, estava quebrado.
 *
 * A correção não foi embrulhar num grupo: nome, e-mail e empresa NÃO são o
 * rótulo de um grupo de opções, são um cartão de identidade. `GroupLabel` ali
 * também mentia para o leitor de tela, que anunciaria o nome da pessoa como
 * título das ações abaixo. Virou um `div` comum, que é o que sempre foi.
 *
 * ─── E o "Sair" tinha um botão dentro de um botão ─────────────────────────
 * `<form><button type="submit"><DropdownMenuItem>` aninhava um botão dentro de
 * outro: HTML inválido, e o item do menu deixava de receber teclado como os
 * vizinhos. Agora é um item de menu comum que chama a ação — mesma saída, sem
 * o aninhamento.
 */
export function MenuDoUsuario({
  nome,
  email,
  papel,
  empresa,
}: {
  nome: string;
  email: string;
  papel: string;
  empresa: string;
}) {
  const [pendente, transicao] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Conta de ${nome}`}
        className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition-colors hover:bg-secondary"
      >
        <span className="grid size-7 place-items-center rounded-full bg-marca-forte/15 t-legenda font-semibold text-marca">
          {iniciais(nome)}
        </span>
        <span className="hidden t-corpo-sm font-medium sm:inline">{nome}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        {/* Cartão de identidade — não é rótulo de grupo. Ver a nota acima. */}
        <div className="px-1.5 py-1.5">
          <p className="t-corpo-sm font-medium">{nome}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
          <p className="etiqueta mt-2">
            {empresa} · {ROTULO_DE_PAPEL[papel] ?? papel}
          </p>
        </div>

        <DropdownMenuSeparator />

        {/* Ordem por frequência de uso, e não por importância: quem abre este
            menu quase sempre quer uma destas três, e sair é a rara. */}
        <DropdownMenuItem
          render={<a href="/configuracoes" />}
          className="cursor-pointer"
        >
          <Settings className="size-4" />
          Configurações da conta
        </DropdownMenuItem>

        <DropdownMenuItem
          render={<a href="/como-funciona" />}
          className="cursor-pointer"
        >
          <LifeBuoy className="size-4" />
          Como funciona
        </DropdownMenuItem>

        <DropdownMenuItem
          className="cursor-pointer"
          disabled={pendente}
          onClick={() => transicao(async () => void (await reverTutorialDeEntrada()))}
        >
          <RotateCcw className="size-4" />
          Rever a apresentação
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          disabled={pendente}
          onClick={() => transicao(async () => void (await sair()))}
        >
          <LogOut className="size-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
