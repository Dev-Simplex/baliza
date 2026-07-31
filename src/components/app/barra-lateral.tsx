"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  ChartNoAxesColumn,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Marca } from "@/components/marca";
import { cn } from "@/lib/utils";

const ITENS = [
  { href: "/dashboard", rotulo: "Visão geral", Icone: LayoutDashboard },
  { href: "/vagas", rotulo: "Vagas", Icone: BriefcaseBusiness },
  { href: "/candidatos", rotulo: "Candidatos", Icone: Users },
  { href: "/relatorios", rotulo: "Relatórios", Icone: ChartNoAxesColumn },
  { href: "/configuracoes", rotulo: "Configurações", Icone: Settings },
];

export function BarraLateral({
  ehAdminDaPlataforma,
}: {
  ehAdminDaPlataforma: boolean;
}) {
  const caminho = usePathname();

  return (
    <nav className="flex h-full flex-col gap-1 p-3" aria-label="Navegação principal">
      <div className="px-2 py-3">
        <Marca href="/dashboard" />
      </div>

      <ul className="mt-2 space-y-0.5">
        {ITENS.map(({ href, rotulo, Icone }) => {
          const ativo = caminho === href || caminho.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13.5px] transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-n-brass focus-visible:outline-none",
                  ativo
                    ? "bg-secondary font-medium text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                {/* Marcador de latão: mesma linguagem do medidor. */}
                <span
                  className={cn(
                    "absolute left-0 h-4 w-[2px] rounded-full bg-n-brass transition-opacity",
                    ativo ? "opacity-100" : "opacity-0",
                  )}
                />
                <Icone className="size-4 shrink-0" />
                {rotulo}
              </Link>
            </li>
          );
        })}
      </ul>

      {ehAdminDaPlataforma && (
        <>
          <div className="etiqueta mt-6 px-2.5 pb-1">Plataforma</div>
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13.5px] transition-colors",
              caminho.startsWith("/admin")
                ? "bg-secondary font-medium text-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            <ShieldCheck className="size-4" />
            Administração
          </Link>
        </>
      )}
    </nav>
  );
}
