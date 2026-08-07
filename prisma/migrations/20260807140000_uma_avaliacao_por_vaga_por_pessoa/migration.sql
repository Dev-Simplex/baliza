-- Uma avaliação por pessoa por vaga.
--
-- O código já assumia isto ("duas avaliações da mesma pessoa na mesma vaga
-- bagunçam o ranking", convite.ts) mas nada garantia: `entrarPeloLinkDaVaga` lê
-- e depois escreve, sem transação, e dois envios concorrentes do formulário
-- público passavam pelos dois lados.
--
-- Idempotente de propósito: pode rodar em base que já tem o índice.
CREATE UNIQUE INDEX IF NOT EXISTS "Assessment_jobId_candidateId_key"
  ON "Assessment"("jobId", "candidateId");
