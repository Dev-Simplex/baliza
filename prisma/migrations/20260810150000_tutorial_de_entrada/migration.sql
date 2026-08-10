-- A apresentação que abre sozinha na primeira entrada.
--
-- Aditiva e idempotente. Anulável: NULL significa "ainda não viu", que é a
-- verdade para todo mundo que já existe. Quem já usa o produto vai ver a
-- apresentação uma vez — e é isso mesmo: ela também serve para quem entrou
-- antes dela existir.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "welcomeTourAt" TIMESTAMP(3);
