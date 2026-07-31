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
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-n-brass focus-visible:outline-none">
        <span className="grid size-7 place-items-center rounded-full bg-n-brass/15 text-[11px] font-semibold text-n-brass">
          {iniciais(nome)}
        </span>
        <span className="hidden text-[13px] font-medium sm:inline">{nome}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="text-[13px] font-medium">{nome}</p>
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
