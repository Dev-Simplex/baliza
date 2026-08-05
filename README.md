# Prumo

> Mapeamento comportamental para processos seletivos.

O prumo é o instrumento de precisão mais antigo que existe: um peso na ponta de
um fio, que diz onde está o vertical verdadeiro. **"Fora de prumo"** já significa,
em português corrente, exatamente o que este produto mede — fora do alinhamento
que aquele trabalho pede. O nome, o símbolo e o gráfico principal dizem a mesma
coisa, de propósito.

**A frase do produto:**

> Cole um link na sua vaga. Em oito minutos o candidato responde.
> Você recebe o ranking — e as perguntas exatas que precisa fazer pra cada um.

O produto não é o teste. É a decisão do dia seguinte.

---

## Rodando

```bash
pnpm install
pnpm exec prisma migrate deploy          # ou `migrate dev` em desenvolvimento
pnpm exec tsx prisma/seed.ts             # instrumento (itens + cenários)
SEED_DEMO=1 pnpm exec tsx prisma/seed.ts # + empresa e candidatos de exemplo
pnpm dev                                 # http://localhost:3300
```

O banco esperado é PostgreSQL. Configure `DATABASE_URL` no `.env`.

**Atrás de proxy?** Declare quantos em `TRUSTED_PROXIES`. É o que decide se
`x-forwarded-for` é a origem de verdade ou um campo que o cliente preencheu — e
o limite de tentativas do código de 4 dígitos depende disso. Ver `src/lib/ip.ts`.

**Manutenção** (expurgo por retenção, devolução de códigos, faxina de contadores):

```bash
pnpm exec tsx prisma/manutencao.ts             # mostra o que faria
pnpm exec tsx prisma/manutencao.ts --aplicar   # aplica — no cron, 1x por dia
```

**Acessos criados pelo seed de demonstração:**

| Perfil | E-mail | Senha |
|---|---|---|
| Empresa (dona da conta) | `recrutador@acme.com` | `prumo123` |
| Operação da plataforma | `admin@prumo.app` | `prumo123` |

**Atenção em desenvolvimento:** abra por `localhost:3300`, não por
`127.0.0.1:3300`. O Next 16 bloqueia recursos de dev vindos de outra origem — a
página carrega, mas não hidrata, e tudo parece quebrado sem nenhum erro no
console. Os IPs liberados estão em `allowedDevOrigins`, no `next.config.ts`.

---

## Verificando

```bash
pnpm exec vitest run     # 44 testes do instrumento
pnpm exec tsc --noEmit   # tipos
pnpm build               # build de produção
```

O teste que mais importa está em `src/lib/instrument/scoring.test.ts`:
**"com penalidade zero, quem está dentro da faixa satura em 100 e empata"**.
Ele prova, com três candidatos dentro de todas as faixas, que sem a atenuação de
0,35 os três marcam 100 exato e o ranking morre no topo — que é o único lugar
onde o recrutador olha. Se alguém mexer nessa constante, esse teste cai.

---

## Estrutura

```
src/
  app/
    (site)/          landing pública
    (auth)/          entrar, cadastrar
    (app)/           painel da empresa — exige sessão E empresa
    vaga/[token]/    link público da vaga (candidato entra por aqui)
    t/[token]/       o questionário
    r/[token]/       o resultado do candidato
    api/auth/        NextAuth

  lib/
    instrument/      O INSTRUMENTO. Fonte da verdade do produto.
      items.ts       128 itens (120 de conteúdo + 8 de desejabilidade social)
      scenarios.ts   8 blocos de cenário com escolha forçada
      archetypes.ts  6 arquétipos — camada de comunicação, nunca de ranking
      presets.ts     7 perfis-alvo prontos, editáveis
      form.ts        sorteio da prova + ordenação sob restrição
      scoring.ts     motor de escoragem, fit, confiança e arquétipo
      *.test.ts      44 testes, incluindo as regressões do modelo

    analise/roteiro.ts   roteiro de entrevista a partir dos desvios
    actions/             Server Actions (auth, vaga, avaliação)
    dados/               consultas do painel, sempre escopadas por empresa
    tenant.ts            ponto único do escopo multiempresa
    rate-limit.ts        limitação de taxa com contador em banco
    audit.ts             trilha de auditoria

  components/
    faixa.tsx        O ELEMENTO-ASSINATURA: o medidor de faixa
    app/             painel do recrutador
    teste/           fluxo do candidato
    ui/              shadcn (Base UI — usa `render`, não `asChild`)

prisma/
  schema.prisma      multiempresa: tudo carrega organizationId
  seed.ts            instrumento + demonstração opcional
```

---

## As regras que não se negociam

Vieram da especificação psicométrica e estão espalhadas pelo código com
referência ao parágrafo que as justifica. Mudar qualquer uma é decisão de
produto, não refatoração.

1. **Vocabulário.** Nunca "teste psicológico", "avaliação psicológica", "laudo",
   "aprovado/reprovado". A Resolução CFP nº 31/2022 faz da aplicação de teste
   psicológico prática privativa de psicólogo. Isso define o vocabulário do
   produto inteiro, não só o rodapé.

2. **O produto ordena, nunca elimina.** Não existe e não vai existir corte
   automático por nota.

3. **A aderência nunca aparece sozinha.** Sempre com as dimensões que a puxaram
   pra cima e pra baixo, e com o selo de confiança ao lado. Sem isso, o direito
   de revisão de decisão automatizada (LGPD art. 20) fica descoberto.

4. **Faceta nunca vira número.** Com 2–3 itens a confiabilidade é fraca por
   construção. Faceta aparece só como nuance em texto.

5. **Escore ipsativo (os cenários) nunca entra no ranking.** Ele compara
   dimensões dentro da mesma pessoa; usá-lo para comparar pessoas é
   estatisticamente inválido — erro comum no mercado.

6. **O roteiro de entrevista nunca sai vazio.** Ver `src/lib/analise/roteiro.ts`.

7. **O candidato sempre recebe o próprio resultado**, integral, sem depender de
   a empresa liberar.

---

## Decisões de projeto que valem explicação

### Por que 128 itens se a prova usa 44

O fator continua sendo medido por 8 itens — é isso que sustenta a confiabilidade.
O banco maior serve a três coisas: sorteio real por pessoa; candidato recorrente
recebendo itens que ainda não viu (reaplicar os mesmos itens mede memória, não
mudança); e a possibilidade de aposentar um item ruim sem encurtar a prova.

### Como "ordem aleatória" convive com a ordem projetada

A especificação original dizia, com razão, "não randomizar a ordem: ela é parte
do instrumento" — a ordem fixa garantia que pares de consistência ficassem a 27+
posições de distância, que dois itens do mesmo fator nunca fossem adjacentes e
que os itens de desejabilidade ficassem espalhados. Embaralhar destruiria as três.

A saída foi separar **sorteio** de **ordenação**: quais 44 itens (sorteio real,
balanceado por fator, faceta e proporção de inversão) e em que ordem (**gerada**
sob as mesmas restrições, não embaralhada). Tudo derivado de uma semente, então a
mesma prova é reconstruível — o que torna retomada e auditoria possíveis.
Ver `src/lib/instrument/form.ts` e os 18 testes de invariante.

### De onde sai o endereço que vai dentro do link

O link é o produto. Ele não pode depender de onde o servidor *acha* que está:
com `NEXT_PUBLIC_APP_URL` no valor padrão (`http://localhost:3300`), todo convite
saía apontando para a máquina de quem copiou — e o candidato abria em nada.

`src/lib/url-publica.ts` resolve a base assim: `NEXT_PUBLIC_APP_URL` vence quando
aponta para um endereço **não-local** (produção atrás de domínio, onde confiar no
cabeçalho `Host` deixaria alguém forjar o domínio de um link que vai por e-mail);
fora isso vale o host da requisição, que é o que acerta sozinho em rede local.

### As duas formas de a vaga receber gente

A vaga tem **modo**, escolhido na criação e trocável depois:

- **Aberta** — link público, o candidato se cadastra sozinho. É a promessa da
  landing: cole o link no anúncio.
- **Por convite** — só responde quem o RH cadastrou. Quem abrir o endereço
  público vê "esta vaga é por convite" e o caminho do código, e não o
  formulário. Fechada **não é** encerrada, e a tela diz isso: uma pede o acesso,
  a outra acabou.

É o `publicEnabled`, que já existia no banco e não tinha interface.

### Editar o perfil-alvo recalcula o que já entrou

O preset é copiado na criação para que a vaga tenha vida própria, e a tela de
criação sempre prometeu "depois você ajusta cada faixa". Agora ajusta — em
"Perfil-alvo", na página da vaga.

O que não é óbvio é o efeito colateral: mudar o perfil muda a régua. A aderência
das respostas que já chegaram foi calculada contra as faixas antigas, e deixar as
duas conviverem daria um ranking que mistura duas réguas — o pior tipo de erro,
porque nada na tela denuncia. Por isso salvar recalcula `fitScore` e `fitDetail`
de todas as respostas concluídas da vaga, na mesma transação. É seguro porque
`calcularFit` é pura e depende só de `scores` (que ficam gravados) e do perfil:
nenhuma resposta bruta é lida ou reescrita. A tela avisa quantas serão
recalculadas antes de salvar.

A validação recusa duas coisas: faixa com menos de 10 pontos de largura numa
dimensão que pesa (abaixo do erro de medida, ela separa ruído em vez de pessoas)
e perfil em que nenhuma dimensão pesa (o peso total iria a zero e a aderência de
todo mundo com ele). Ver `src/lib/perfil-alvo.ts` e seus testes.

### Três vias para a mesma prova

Escolhidas no momento do cadastro, porque cadastrar e entregar o acesso são o
mesmo momento:

1. **link pessoal** (`/t/<token>`) — cai direto no questionário, sem repetir
   nome e e-mail;
2. **QR** do mesmo link, por pessoa — para mostrar na tela ou imprimir;
3. **código de 4 dígitos** em `/acesso` — o que dá para ditar no telefone.

O código **não é senha**: quem tem o código entra, igual a quem tem o link. O
que faz 4 dígitos caberem é (a) a **reciclagem** — o código volta ao acervo
quando a prova conclui, então os 10.000 governam só os convites em aberto, nunca
o histórico — e (b) o **limite de 6 tentativas por hora por IP**, que transforma
a varredura das 10.000 combinações em quase dois anos.

O código continua visível na vaga, em "Aguardando resposta". Sem isso ele seria
de uso único: fechou o diálogo, perdeu.

### Por que só o link da VAGA é legível

`/vaga/executivo-de-vendas-prospeccao-u2587v` em vez de um `cuid`. Este é o
único token que uma pessoa lê, digita e dita no telefone — ele vai colado no
anúncio. O sufixo aleatório não é enfeite: sem ele, duas vagas de mesmo título
colidiriam e o endereço seria adivinhável a partir do anúncio.

Os outros continuam opacos **de propósito**: o do convite (`/t/…`) e o do
resultado (`/r/…`) são credenciais — quem tem o token responde ou lê o relatório
de alguém. Legível, ali, é adivinhável.

Vagas criadas antes disso mantêm o endereço antigo. Para trocar,
`prisma/tornar-links-legiveis.ts` — lembrando que **isso invalida link já
distribuído**.

### O convite por e-mail entrega um link PESSOAL

O link da vaga é público e pede nome e e-mail. O convite (`/t/<token>`) já sabe
quem é: cai direto no questionário e ainda deixa a vaga saber quem foi chamado e
não respondeu. Sem SMTP configurado o envio **não acontece e não finge que
aconteceu** — a ação devolve o link para a tela oferecer o caminho manual.

### Por que "fora da faixa" é argila e não vermelho

Cor é vocabulário. O produto se proíbe de dizer "reprovado"; a paleta não pode
dizer por ele. Fora da faixa é atenção, não alarme.

---

## Pendente

Escopo declarado que ainda não foi construído:

- Integração com OpenAI (a camada determinística já entrega o roteiro; a IA
  entraria por cima dela, com o mesmo contrato)
- Exportação em PDF e Excel, e compartilhamento de relatório
- Comparação de candidatos lado a lado
- Painel administrativo da plataforma
- API pública para ATS/ERP
- Perfil de cultura organizacional e matching
- Agendamento do `prisma/manutencao.ts` — a rotina existe e roda à mão; falta
  entrar no cron do servidor

**Não há planos, cobrança nem limite de uso.** O produto é a ferramenta de
mapeamento, não um SaaS para vender assinatura: nenhuma vaga ou resposta é
recusada por teto.

Os depoimentos da landing são **de exemplo** e estão marcados como tal no código
(`src/app/(site)/page.tsx`). Troque por depoimentos reais, com autorização de
quem falou, antes de publicar.

---

## Referências

- Goldberg, L. R. — International Personality Item Pool (IPIP), domínio público
- Barrick & Mount (1991) — *The Big Five personality dimensions and job performance*
- Conselho Federal de Psicologia — Resolução CFP nº 31/2022 (SATEPSI)
- Lei nº 13.709/2018 (LGPD) — arts. 5º II, 9º, 18 e 20
