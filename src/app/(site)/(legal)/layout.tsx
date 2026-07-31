import Link from "next/link";

import { AlternarTema } from "@/components/alternar-tema";
import { Marca } from "@/components/marca";

export default function LayoutLegal({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5 sm:px-8">
          <Marca />
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="t-corpo-sm text-muted-foreground hover:text-foreground"
            >
              Início
            </Link>
            <AlternarTema />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-14 sm:px-8">{children}</main>
    </div>
  );
}
