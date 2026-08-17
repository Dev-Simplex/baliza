"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  ChartNoAxesColumn,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Marca } from "@/components/marca";
import { cn } from "@/lib/utils";

type ItemDeNavegacao = { href: string; rotulo: string; Icone: LucideIcon };

/**
 * O trabalho: as quatro telas onde o recrutador passa o dia. Elas vêm primeiro
 * e sozinhas, porque uma lista de seis itens sem grupo obriga a ler todos os
 * seis toda vez.
 */
const TRABALHO: ItemDeNavegacao[] = [
  { href: "/dashboard", rotulo: "Visão geral", Icone: LayoutDashboard },
  { href: "/vagas", rotulo: "Vagas", Icone: BriefcaseBusiness },
  { href: "/candidatos", rotulo: "Candidatos", Icone: Users },
  { href: "/relatorios", rotulo: "Relatórios", Icone: ChartNoAxesColumn },
];

/**
 * O apoio. "Como funciona" fica na navegação permanente, e não escondido atrás
 * de um "?" no canto: a dúvida sobre o que significa a aderência não nasce no
 * primeiro login, nasce três dias depois olhando o primeiro resultado. Precisa
 * estar à vista nessa hora — e ter endereço próprio, para mandar o link a quem
 * lê o relatório sem nunca ter entrado no sistema.
 */
const APOIO: ItemDeNavegacao[] = [
  { href: "/como-funciona", rotulo: "Como funciona", Icone: LifeBuoy },
  { href: "/configuracoes", rotulo: "Configurações", Icone: Settings },
];

function estaAtivo(caminho: string, href: string) {
  return caminho === href || caminho.startsWith(`${href}/`);
}

/**
 * Uma linha da navegação.
 *
 * O item ativo recebe DUAS marcas: fundo discreto e um traço laranja de 2px na
 * borda esquerda. Duas porque o fundo sozinho é sutil demais em telas de brilho
 * baixo, e o traço sozinho é fino demais para quem olha de relance. Nenhuma das
 * duas é a cor de dado — item ativo é estado de interface, não medição.
 *
 * `min-h-11` são os 44px de alvo de toque. No desktop a linha não parece alta
 * porque o padding horizontal segura a proporção; no celular ela é o que
 * permite acertar o item com o polegar.
 */
function Linha({
  item,
  ativo,
  aoNavegar,
}: {
  item: ItemDeNavegacao;
  ativo: boolean;
  aoNavegar?: () => void;
}) {
  const { href, rotulo, Icone } = item;
  return (
    <li>
      <Link
        href={href}
        onClick={aoNavegar}
        aria-current={ativo ? "page" : undefined}
        className={cn(
          "group relative flex min-h-11 items-center gap-2.5 rounded-lg px-2.5 t-corpo-sm transition-colors lg:min-h-9",
          ativo
            ? "bg-sidebar-accent font-medium text-sidebar-foreground"
            : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-1/2 left-0 h-4 w-[2px] -translate-y-1/2 rounded-full transition-opacity",
            ativo ? "opacity-100" : "opacity-0",
          )}
          style={{ background: "var(--marca-sinal)" }}
        />
        {/* O ícone inativo herda a cor do próprio rótulo. `--pedra` é
            estrutura (régua, barra de rolagem) e dá 1,8:1 sobre a barra
            lateral — um ícone nessa cor simplesmente não está lá. */}
        <Icone className="size-4 shrink-0 transition-colors" />
        {rotulo}
      </Link>
    </li>
  );
}

export function BarraLateral({
  ehAdminDaPlataforma,
  aoNavegar,
}: {
  ehAdminDaPlataforma: boolean;
  /** Fecha a gaveta no celular assim que a navegação acontece. */
  aoNavegar?: () => void;
}) {
  const caminho = usePathname();

  return (
    <nav
      className="flex h-full flex-col gap-1 p-3"
      aria-label="Navegação principal"
    >
      <div className="px-2.5 py-4">
        <Marca href="/dashboard" tamanho="md" />
      </div>

      <ul className="space-y-0.5">
        {TRABALHO.map((item) => (
          <Linha
            key={item.href}
            item={item}
            ativo={estaAtivo(caminho, item.href)}
            aoNavegar={aoNavegar}
          />
        ))}
      </ul>

      <ul className="mt-6 space-y-0.5 border-t border-sidebar-border pt-4">
        {APOIO.map((item) => (
          <Linha
            key={item.href}
            item={item}
            ativo={estaAtivo(caminho, item.href)}
            aoNavegar={aoNavegar}
          />
        ))}
      </ul>

      {/* A operação da plataforma é outro contexto, e o rótulo diz isso antes
          do primeiro clique — quem administra a Baliza não é quem contrata. */}
      {ehAdminDaPlataforma && (
        <div className="mt-6 border-t border-sidebar-border pt-4">
          <p className="etiqueta px-2.5 pb-2">Plataforma</p>
          <ul className="space-y-0.5">
            <Linha
              item={{
                href: "/admin",
                rotulo: "Administração",
                Icone: ShieldCheck,
              }}
              ativo={estaAtivo(caminho, "/admin")}
              aoNavegar={aoNavegar}
            />
          </ul>
        </div>
      )}

      <p className="etiqueta mt-auto px-2.5 pt-6 pb-1">Baliza by SPXIA</p>
    </nav>
  );
}
