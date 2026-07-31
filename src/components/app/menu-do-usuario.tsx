"use client";

import { LogOut, User as Usuario } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { sair } from "@/lib/actions/sessao";
import { iniciais, ROTULO_DE_PAPEL } from "@/lib/formato";

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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition-colors hover:bg-secondary">
        <span className="grid size-7 place-items-center rounded-full bg-marca-forte/15 t-legenda font-semibold text-marca">
          {iniciais(nome)}
        </span>
        <span className="hidden t-corpo-sm font-medium sm:inline">{nome}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="t-corpo-sm font-medium">{nome}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
          <p className="etiqueta mt-2">
            {empresa} · {ROTULO_DE_PAPEL[papel] ?? papel}
          </p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem render={<a href="/configuracoes" />} className="cursor-pointer">
          <Usuario className="size-4" />
          Configurações
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <form action={sair}>
          <button type="submit" className="w-full">
            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="size-4" />
              Sair
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
