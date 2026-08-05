-- Índices: tira sete que não fazem nada e põe dois que faltavam.
--
-- ─── Os que saem ───────────────────────────────────────────────────────────
-- Cinco eram cópia exata de um índice UNIQUE da mesma coluna: `@unique` já
-- cria um btree, e `@@index` na mesma coluna cria um segundo, idêntico. O
-- Postgres nunca usa o segundo — mas mantém, e paga a manutenção dele em toda
-- escrita. Dois eram prefixo à esquerda de um UNIQUE composto
-- (`assessmentId` dentro de `(assessmentId, itemId)`), que o Postgres já
-- atende com o índice composto.
--
-- Não há perda de leitura: para busca por igualdade, o índice único responde
-- exatamente igual ao que foi removido.
--
-- ─── Os que entram ─────────────────────────────────────────────────────────
-- O painel conta avaliação por (empresa, status) o tempo todo — os cartões do
-- dashboard, o funil, a distribuição de selo, o volume por semana. O único
-- índice que existia era `(organizationId, jobId, status)`, e `jobId` no meio
-- impede o uso: o Postgres só aproveita o prefixo à esquerda, que aqui para em
-- `organizationId`. Mesma história para o contador de convites pendentes.

DROP INDEX IF EXISTS "Organization_slug_idx";
DROP INDEX IF EXISTS "User_email_idx";
DROP INDEX IF EXISTS "Job_publicToken_idx";
DROP INDEX IF EXISTS "Invitation_token_idx";
DROP INDEX IF EXISTS "Assessment_resultToken_idx";
DROP INDEX IF EXISTS "ItemResponse_assessmentId_idx";
DROP INDEX IF EXISTS "ScenarioResponse_assessmentId_idx";

CREATE INDEX IF NOT EXISTS "Assessment_organizationId_status_completedAt_idx"
  ON "Assessment" ("organizationId", "status", "completedAt");

CREATE INDEX IF NOT EXISTS "Invitation_organizationId_status_idx"
  ON "Invitation" ("organizationId", "status");
