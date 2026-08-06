-- Bateria de testes selecionável por vaga.
--
-- O instrumento da casa vira uma opção chamada PRUMO em vez de ser o único que
-- existe, e Big Five, DISC e SJT entram ao lado dele. Nada é destruído: as duas
-- colunas novas nascem com DEFAULT ARRAY['PRUMO'], então toda vaga e toda
-- avaliação que já existiam continuam se comportando exatamente como antes —
-- em Postgres 11+ o DEFAULT do ADD COLUMN preenche as linhas antigas na hora,
-- sem reescrever a tabela.
--
-- Escrita à mão e idempotente: `migrate dev` exige TTY e não roda neste
-- ambiente, e reaplicar a migração num banco que já a recebeu (staging que
-- perdeu o registro em _prisma_migrations, por exemplo) precisa ser inofensivo.

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InstrumentoDeTeste') THEN
    CREATE TYPE "InstrumentoDeTeste" AS ENUM ('PRUMO', 'BIG_FIVE', 'DISC', 'SJT');
  END IF;
END
$$;

-- AlterTable — a bateria escolhida na vaga.
ALTER TABLE "Job"
  ADD COLUMN IF NOT EXISTS "testBattery" "InstrumentoDeTeste"[] DEFAULT ARRAY['PRUMO']::"InstrumentoDeTeste"[];

-- AlterTable — a cópia congelada da bateria (a prova de quem já começou não
-- muda quando o RH mexe na vaga) e o resultado por módulo.
ALTER TABLE "Assessment"
  ADD COLUMN IF NOT EXISTS "testBattery" "InstrumentoDeTeste"[] DEFAULT ARRAY['PRUMO']::"InstrumentoDeTeste"[],
  ADD COLUMN IF NOT EXISTS "moduleResults" JSONB;

-- CreateTable — escolha única entre alternativas (SJT).
--
-- Tabela nova só porque a forma não cabia nas existentes: `ItemResponse.value`
-- é Likert 1..5 e entraria na média de um fator, e `ScenarioResponse` exige um
-- "MENOS" que o SJT não tem. Ver o comentário do modelo em schema.prisma.
CREATE TABLE IF NOT EXISTS "ChoiceResponse" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "choiceId" TEXT NOT NULL,
    "elapsedMs" INTEGER,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChoiceResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex — uma resposta por cenário, por avaliação. É esta chave que faz
-- o salvamento automático ser upsert em vez de acumular duplicata a cada clique.
CREATE UNIQUE INDEX IF NOT EXISTS "ChoiceResponse_assessmentId_blockId_key"
  ON "ChoiceResponse"("assessmentId", "blockId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ChoiceResponse_assessmentId_fkey'
  ) THEN
    ALTER TABLE "ChoiceResponse"
      ADD CONSTRAINT "ChoiceResponse_assessmentId_fkey"
      FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
