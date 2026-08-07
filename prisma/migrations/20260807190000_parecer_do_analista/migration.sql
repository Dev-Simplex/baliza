-- O parecer do analista: quem decidiu, o que decidiu, quando e por quê.
--
-- Aditiva e idempotente. Todas as colunas são anuláveis: as avaliações que já
-- existem ficam sem parecer, que é a verdade — ninguém registrou nada porque
-- não havia onde. NULL aqui significa "ainda não decidido", e é isso que a
-- lista usa para mostrar o que falta.

DO $$ BEGIN
  CREATE TYPE "AnalystDecision" AS ENUM ('ADVANCE', 'DOUBT', 'REJECT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "decision" "AnalystDecision";
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "decisionNote" TEXT;
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "decidedAt" TIMESTAMP(3);
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "decidedById" TEXT;

-- SetNull, e não Cascade: o parecer sobrevive à saída de quem o deu. Apagar a
-- decisão junto com o crachá do recrutador seria perder o registro do processo.
DO $$ BEGIN
  ALTER TABLE "Assessment"
    ADD CONSTRAINT "Assessment_decidedById_fkey"
    FOREIGN KEY ("decidedById") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "Assessment_organizationId_decision_idx"
  ON "Assessment"("organizationId", "decision");
