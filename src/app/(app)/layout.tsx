import { AlternarTema } from "@/components/alternar-tema";
import { BarraLateral } from "@/components/app/barra-lateral";
import { MenuDoUsuario } from "@/components/app/menu-do-usuario";
import { prisma } from "@/lib/prisma";
import { exigirTenant } from "@/lib/tenant";

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
    <div className="flex min-h-svh">
      <aside className="hidden w-56 shrink-0 border-r bg-sidebar lg:block">
        <div className="sticky top-0 h-svh">
          <BarraLateral ehAdminDaPlataforma={contexto.isPlatformAdmin} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <div className="lg:hidden">
            <BarraLateralMovel ehAdminDaPlataforma={contexto.isPlatformAdmin} />
          </div>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <AlternarTema />
            <MenuDoUsuario
              nome={contexto.nome}
              email={contexto.email}
              papel={contexto.role}
              empresa={empresa.name}
            />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

/** No mobile a navegação vira gaveta — o conteúdo é que importa na tela pequena. */
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

function BarraLateralMovel({
  ehAdminDaPlataforma,
}: {
  ehAdminDaPlataforma: boolean;
}) {
  return (
    <Sheet>
      <SheetTrigger className="grid size-9 place-items-center rounded-md border transition-colors hover:bg-secondary">
        <Menu className="size-4" />
        <span className="sr-only">Abrir navegação</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="sr-only">Navegação</SheetTitle>
        <BarraLateral ehAdminDaPlataforma={ehAdminDaPlataforma} />
      </SheetContent>
    </Sheet>
  );
}
