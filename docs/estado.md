# Estado do projeto

O que está em aberto, quem consegue resolver cada coisa, e o que precisa estar de
pé antes de começar a próxima implementação.

Atualizado em 19/08/2026, com a `main` em `796fa52`.

---

## 1. Bloqueia trabalhar agora

### ~~O banco de desenvolvimento não existe mais~~ — resolvido em 19/08/2026

O Prisma Postgres temporário morreu como previsto. No lugar dele há agora um
Postgres permanente no próprio Coolify (opção 1 do que estava recomendado aqui):

| | |
|---|---|
| Recurso | `postgres-baliza-dev`, `postgres:16-alpine` |
| Onde | projeto SPX, ambiente `development` (uuid `gkcn4meeska6ucw2ljfr5gou`) |
| Container | **separado** do `postgres-prumo` de produção |
| Acesso | porta pública 5433 — `192.168.8.141:5433` pela LAN, `177.22.187.7:5433` de fora |

O container é separado de propósito: erro de `DATABASE_URL` em desenvolvimento
não pode cair na base com dados reais de candidato. Custa ~40 MB a mais no
servidor, que é apertado — se apertar demais, o caminho é um `CREATE DATABASE`
dentro do `postgres-prumo`, mais barato e menos seguro.

Migrações aplicadas e os dois seeds rodados: 1 organização, 4 usuários, 14
candidatos, 128 itens, 8 blocos de cenário. `pnpm dev` sobe e as telas abrem.

Duas coisas ficam em aberto:

- A porta 5433 está exposta no host. Na LAN não incomoda; se o roteador
  encaminhar essa porta, o que protege é só a senha aleatória de 32 caracteres.
- `limits_memory` do novo container também é `"0"`, mesmo problema descrito
  mais abaixo para a aplicação.

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

### A verificação agora roda sozinha

O hook `.githooks/pre-push` roda tipos, lint e os 342 testes antes de todo push,
e o build junto quando o destino é a `main`. Em clone novo é preciso ligar uma
vez: `git config core.hooksPath .githooks`.

Ele é local, e essa é a diferença que importa em relação a um workflow: pega o
erro antes de sair da máquina, sem depender de escopo de token nem de rodada
remota. Em troca, não cobre quem publicar de outro clone sem o `hooksPath`
configurado.

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

1. [x] ~~Banco de desenvolvimento novo, com `migrate deploy` e os dois seeds~~
2. [ ] Chave do Coolify rotacionada
3. [ ] Teto de memória definido no container
4. [ ] Decisão sobre o repositório público (gabarito do SJT)
5. [ ] `manutencao.ts` agendado
6. [x] ~~Branch `feat/rebranding-baliza` apagada~~

O item 2 é o que resta de bloqueante. Do 3 ao 5 dá para conviver, mas cada um é uma
promessa quebrada ou um risco conhecido rodando em produção.
