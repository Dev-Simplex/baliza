-- Terceira via de entrada do candidato: 4 dígitos ditáveis, ao lado do link e
-- do QR. Único no sistema (e não por vaga) porque a tela /acesso não sabe de
-- qual vaga a pessoa veio; cabe em 4 dígitos porque o código é devolvido ao
-- acervo quando a prova conclui (volta a NULL) — em Postgres, NULL não conflita
-- com NULL, então o índice único só governa os convites em aberto.
ALTER TABLE "Invitation" ADD COLUMN "accessCode" TEXT;

CREATE UNIQUE INDEX "Invitation_accessCode_key" ON "Invitation"("accessCode");

-- Primeiros passos do painel: no usuário, não no navegador, para não reaparecer
-- quando ele troca de máquina.
ALTER TABLE "User" ADD COLUMN "onboardingDoneAt" TIMESTAMP(3);
