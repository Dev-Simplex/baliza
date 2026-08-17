import { AlternarTema } from "@/components/alternar-tema";
import { BarraLateral } from "@/components/app/barra-lateral";
import { MenuDoUsuario } from "@/components/app/menu-do-usuario";
import { NavegacaoMovel, SecaoAtual } from "@/components/app/navegacao-movel";
import { prisma } from "@/lib/prisma";
import { exigirTenant } from "@/lib/tenant";

/**
 * O shell do painel.
 *
 * Três planos, e a hierarquia sai deles sem precisar de sombra: a barra lateral
 * é o plano mais fundo (o móvel), o conteúdo é o plano do meio (osso), e os
 * cartões são o plano da frente (branco). No escuro a ordem se mantém — barra
 * mais escura que o fundo, cartão mais claro — porque o que orienta o olho é o
 * degrau entre planos, e ele não pode inverter quando o tema muda.
 *
 * A barra tem 240px: abaixo de 232 os rótulos começam a truncar em português, e
 * acima de 248 ela rouba largura da tabela, que é onde o trabalho acontece.
 */
export default async function LayoutDoApp({
  children,
}: {
  children: React.ReactNode;
}) {
  const contexto = await exigirTenant();

  const empresa = await prisma.organization.findUniqueOrThrow({
    where: { id: contexto.organizationId },
    select: { name: true },
  });

  return (
    <div className="flex min-h-svh bg-background">
      <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:block">
        <div className="sticky top-0 h-svh overflow-y-auto">
          <BarraLateral ehAdminDaPlataforma={contexto.isPlatformAdmin} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* `data-impressao` e não uma regra `header` na folha de impressão:
            o cabeçalho DO DOCUMENTO também é um `header`, e escondê-lo
            deixaria o PDF sem identificação nenhuma. */}
        <header
          data-impressao="ocultar"
          className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-background/80 px-3 backdrop-blur-md sm:px-6"
        >
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            <div className="lg:hidden">
              <NavegacaoMovel ehAdminDaPlataforma={contexto.isPlatformAdmin} />
            </div>
            <SecaoAtual />
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <AlternarTema className="hidden sm:inline-flex" />
            <MenuDoUsuario
              nome={contexto.nome}
              email={contexto.email}
              papel={contexto.role}
              empresa={empresa.name}
            />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[88rem]">{children}</div>
        </main>
      </div>
    </div>
  );
}
