# Estado do projeto

O que está em aberto, quem consegue resolver cada coisa, e o que precisa estar de
pé antes de começar a próxima implementação.

Atualizado em 18/08/2026, com a `main` em `2558cc3`.

---

## 1. Bloqueia trabalhar agora

### O banco de desenvolvimento não existe mais

O `DATABASE_URL` do `.env` aponta para um Prisma Postgres temporário criado por
`create-db` em 17/08, com aviso no próprio arquivo de que seria apagado em
18/08 às 15:51 UTC se ninguém o reivindicasse. Ninguém reivindicou.

```
P1001: Can't reach database server at db.prisma.io:5432
```

Sem banco, `pnpm dev` sobe mas nenhuma tela do painel abre, e nenhum seed roda.
**É o primeiro item a resolver**, e nenhuma implementação começa sem ele.

Três saídas, em ordem de durabilidade:

1. **Um Postgres no próprio Coolify, para desenvolvimento.** Resolve de vez, fica
   ao lado do de produção e não expira. É o que eu recomendo.
2. **Um Neon ou Supabase gratuito.** Também permanente, fora do servidor.
3. **Outro `pnpm dlx create-db`.** Funciona hoje e evapora em 24 h de novo — foi
   exatamente assim que chegamos aqui.

Depois de apontar o `.env` para o banco novo:

```bash
pnpm exec prisma migrate deploy
pnpm exec tsx prisma/seed.ts
pnpm exec tsx prisma/dados-de-teste.ts
```

### A chave do Coolify está exposta

Uma chave de API com controle total da instância foi colada em conversa em texto
puro. Ela alcança também o `jukeboxs`, que roda no mesmo servidor. **Gere outra em
Coolify → Keys & Tokens e revogue a antiga.**

---

## 2. Promessas que o produto faz e não cumpre

Não quebram nada hoje. Cada uma é uma frase na tela que não corresponde ao que
acontece — e é assim que a confiança no produto se perde.

| Promessa | Onde | O que falta |
|---|---|---|
| "as respostas são apagadas no prazo informado pela empresa" | rodapé do relatório do candidato | `prisma/manutencao.ts` existe, é idempotente e **não está agendado**. Uma tarefa diária no Coolify. |
| "a falha foi registrada" | `src/app/error.tsx` | Não há coletor de erro. Ou se instala um, ou a frase muda. |

---

## 3. Riscos abertos

### O gabarito do SJT está num repositório público

`src/lib/instrument/sjt.ts` guarda, por cenário, qual alternativa vale 2, 1 e 0
ponto. O código inteiro é construído para esse gabarito nunca chegar ao navegador
do candidato — as funções `*ParaCandidato` existem só para isso. Só que
`Dev-Simplex/baliza` é **público**.

Duas saídas: tornar o repositório privado, ou tirar o banco de cenários do código
e passá-lo a dado semeado. A segunda resolve de vez e é mais trabalho.

### O container sobe sem teto de memória

`limits_memory = "0"` no Coolify. Sem limite de cgroup, o V8 dimensiona o heap
pela RAM da máquina inteira e coleta tarde: a memória sobe e não volta. Definir um
teto (768 MB ou 1 GB) é uma linha na interface, e é a primeira coisa a tentar
contra o consumo alto.

### Não há integração contínua

Não existe `.github/`. Os 342 testes só rodam quando alguém lembra. Um workflow
com `tsc --noEmit`, `vitest run` e `pnpm build` a cada push teria pego pelo menos
um dos defeitos de 18/08.

---

## 4. O que aprendemos publicando com gente usando

Três defeitos do dia 18/08 tinham a **mesma causa**: publicar troca os nomes dos
arquivos de código *e* o identificador de cada Server Action, e a aba que já
estava aberta continua com os antigos.

- **Login em laço** — corrigido por `25a552b` (`trustHost`).
- **Tela de erro oferecendo "Tentar de novo"**, que não tinha como funcionar —
  corrigido por `6207e93`. A regra de detecção virou `src/lib/versao-velha.ts`,
  com teste.
- **Candidato preso no meio da prova**, com a fila repetindo para sempre uma
  gravação que o servidor não aceitaria mais — corrigido por `2558cc3`.

O terceiro é o que mais custa: o "Concluir" fica desabilitado enquanto há
pendência, e prova incompleta não vira relatório.

**Consequência para o processo:** publicar enquanto há prova em andamento agora
pede um recarregamento à pessoa, em vez de deixá-la presa — mas ainda é uma
interrupção no meio de um teste comportamental. Vale checar antes de publicar.

---

## 5. Sem risco, só fora do lugar

- **A branch `feat/rebranding-baliza`** está em `89ec397`, atrás da `main`. Todo
  o conteúdo dela já foi para a `main`. Pode ser apagada.
- **Cinco planilhas `.xlsx` soltas na raiz**, não versionadas. São a origem dos
  bancos de itens. Ficaram de fora por decisão — vale escolher entre versionar
  numa pasta própria ou pôr no `.gitignore`, para pararem de aparecer no
  `git status`.
- **`CultureProfile`** existe no schema e nada o lê.
- **`ApiKey.scopes`** existe, é `Json` livre e ninguém preenche. Quando a API
  nascer, tem que usar o vocabulário de `permissoes.ts` — dois vocabulários de
  permissão no mesmo sistema divergem em silêncio.

---

## 6. Onde cada coisa está documentada

| Documento | Responde |
|---|---|
| `README.md` | como rodar, o que é o produto, o que ainda não existe |
| `docs/instrumento.md` | o que o produto **mede** |
| `docs/funcionamento.md` | quem existe, o que cada um pode, por quais estados se passa |
| `docs/estado.md` | este — o que está em aberto e quem resolve |

---

## 7. Antes da próxima implementação

Checklist curto:

1. [ ] Banco de desenvolvimento novo, com `migrate deploy` e os dois seeds
2. [ ] Chave do Coolify rotacionada
3. [ ] Teto de memória definido no container
4. [ ] Decisão sobre o repositório público (gabarito do SJT)
5. [ ] `manutencao.ts` agendado
6. [ ] Branch `feat/rebranding-baliza` apagada

Os itens 1 e 2 são bloqueantes. Do 3 ao 5 dá para conviver, mas cada um é uma
promessa quebrada ou um risco conhecido rodando em produção.
