# Funcionamento da Baliza

Quem existe no sistema, o que cada um pode fazer, e por quais estados uma vaga e
um candidato passam. Este documento descreve **o que está construído hoje** — o
que falta está na última seção, marcado como tal.

Fonte da verdade em código: `src/lib/permissoes.ts` (a matriz), `src/lib/tenant.ts`
(quem é quem numa requisição) e `prisma/schema.prisma` (os estados).

---

## 1. Os três sujeitos

A primeira coisa a entender é que **não existe um único tipo de usuário com
níveis diferentes**. Existem três sujeitos, com naturezas diferentes, e confundi-los
é o erro mais caro que se pode cometer aqui.

| Sujeito | Tem conta? | Escopo | Entra por |
|---|---|---|---|
| **Time de RH** | sim, com papel | uma empresa | e-mail e senha |
| **Candidato** | **não** | a própria resposta | link, QR ou código de 4 dígitos |
| **Operador da plataforma** | sim, sem empresa | todas as empresas | e-mail e senha |

### Por que o candidato não é um papel

Vai dar vontade de criar um valor `CANDIDATE` no enum de papéis quando a área
logada do candidato existir. Três coisas quebram:

1. A régua de papéis é uma escada com pesos. `CANDIDATE` entraria com peso 0, e a
   primeira checagem escrita como "ao menos VIEWER" — que parece a checagem mais
   inofensiva do mundo — abriria o painel da empresa para ele.
2. `exigirTenant()` exige `organizationId`. O candidato ou não tem empresa, e cai
   no redirecionamento de erro, ou é amarrado à empresa contratante e **herda o
   escopo dela** — que é exatamente o que não pode acontecer.
3. O direito dele é sobre **os próprios dados** (LGPD art. 18). A consulta é
   escopada por `candidateId`, não por `organizationId`. É outra forma de
   pergunta, não outra permissão.

O candidato já vive numa tabela própria (`Candidate`), sem senha e sem sessão de
painel. Quando a área logada nascer, ela precisa de um `exigirCandidato()`
próprio.

### Por que o operador também não é

`isPlatformAdmin` é booleano e vive **fora** do escopo de empresa
(`organizationId` nulo). Ele não é o topo da escada da empresa — está fora dela.
Consequência prática: **o operador não abre o painel da empresa.** `exigirTenant()`
manda todo usuário sem empresa direto para `/admin`.

Concessão só por script, nunca por tela: `pnpm exec tsx prisma/super-admin.ts`.
Um botão "virar super admin" em qualquer lugar do painel seria o caminho para
quem administra uma empresa alcançar as outras.

---

## 2. Quem pode o quê

Papel **não é um degrau de escada** — é um preset de permissões nomeadas. A
distinção importa: "ver o ranking da vaga" e "ler o relatório comportamental de
uma pessoa" não são dois níveis do mesmo eixo, são dados de sensibilidade
diferente. Com uma escada, negar o relatório a alguém obrigava a negar a lista, a
vaga e o painel junto.

O código sempre pergunta pela permissão — `pode("dados:exportar")` —, nunca pelo
papel.

### A matriz

| Permissão | VIEWER | RECRUITER | ADMIN | OWNER |
|---|:---:|:---:|:---:|:---:|
| `vaga:ler` — ver vagas e andamento | ✓ | ✓ | ✓ | ✓ |
| `candidato:ler` — lista, aderência e selo | ✓ | ✓ | ✓ | ✓ |
| `vaga:criar` — abrir vaga nova | — | ✓ | ✓ | ✓ |
| `vaga:editar` — vaga, perfil-alvo, bateria | — | ✓ | ✓ | ✓ |
| `vaga:encerrar` — encerrar e reabrir | — | ✓ | ✓ | ✓ |
| `candidato:ler_perfil` — relatório completo | — | ✓ | ✓ | ✓ |
| `candidato:convidar` — convidar e revogar | — | ✓ | ✓ | ✓ |
| `parecer:escrever` — decisão e anotação | — | ✓ | ✓ | ✓ |
| `dados:exportar` — CSV da base, PDF da pessoa | — | ✓ | ✓ | ✓ |
| `equipe:gerenciar` — papéis e acessos | — | — | ✓ | ✓ |
| `empresa:editar` — dados da empresa | — | — | ✓ | ✓ |
| `retencao:configurar` — prazo de expurgo | — | — | — | ✓ |
| `chave_api:gerenciar` — criar e revogar chaves | — | — | — | ✓ |

### As duas permissões que existem separadas de propósito

**`candidato:ler` vs `candidato:ler_perfil`.** A primeira é o pipeline: quem
entrou, em que vaga, qual a aderência, qual a decisão. A segunda é o relatório
comportamental inteiro — faixas, facetas, arquétipo, DISC, roteiro de entrevista.
É o dado mais sensível que o sistema guarda, e **dá para conduzir um processo sem
lê-lo**. É essa separação que faz o VIEWER ser um papel útil em vez de decorativo.

**`candidato:ler_perfil` vs `dados:exportar`.** Ler na tela fica dentro da
ferramenta, com auditoria e sujeito ao expurgo por retenção. Baixar vira um `.csv`
na pasta de Downloads de alguém, fora do alcance dos dois. São permissões
diferentes porque são riscos diferentes.

### Sobre o OWNER ter tudo

A minimização de dados (LGPD art. 6º, III) argumenta que o dono da conta — quem
paga, quem administra — não precisa ler o perfil psicométrico de ninguém. O
argumento é bom, e **o modelo consegue expressá-lo**: basta remover
`candidato:ler_perfil` da linha do OWNER em `permissoes.ts`.

Não é o default porque na empresa pequena o OWNER *é* o recrutador — a mesma
pessoa que criou a conta e vai ler os relatórios. Negar por padrão trancaria o
usuário solo para fora do próprio produto no primeiro minuto. O ganho do modelo é
que a linha existe e é editável, não que ela venha marcada.

### Quem concede papel

Ninguém concede papel acima do próprio, e ninguém altera quem está acima. Sem
isso, `equipe:gerenciar` viraria escada para virar OWNER — bastaria promover um
cúmplice. Mais duas travas: ninguém muda o próprio papel (senão o único OWNER se
rebaixa por engano e a conta fica sem quem administre), e a empresa nunca fica sem
OWNER ativo.

As quatro valem no **servidor** (`src/lib/actions/equipe.ts`). A tela desabilita
as opções por gentileza; quem manda é o servidor.

### Revogação é imediata

O papel é lido do **banco** a cada requisição protegida, não do token de sessão.
A sessão é JWT de 8 horas com o papel dentro; se a autorização confiasse nele,
rebaixar ou desligar alguém só faria efeito no próximo login — até 8 horas de
acesso depois de revogado. Um sistema de permissão em que revogar demora 8 horas
não é um sistema de permissão.

O custo é uma consulta por chave primária por requisição, reduzida a uma por
render pelo `cache()` do React.

---

## 3. O ciclo de vida de uma vaga

```
DRAFT ──► OPEN ──► PAUSED ──► OPEN
             │        │
             └────────┴──► CLOSED
```

| Estado | O que significa |
|---|---|
| `DRAFT` | Criada, ainda não recebe candidato |
| `OPEN` | Recebendo respostas |
| `PAUSED` | Suspensa; convites já emitidos continuam valendo |
| `CLOSED` | Encerrada |

Duas portas de entrada, independentes:

- **Link público** (`publicToken` + `publicEnabled`) — qualquer pessoa com o link
  responde. Vive em `/vaga/<token>`.
- **Convite individual** — gerado para uma pessoa, com link, QR e código de 4
  dígitos.

Encerrar desliga as duas de uma vez. Fechar o link público sem encerrar a vaga é
um estado válido e útil: a entrada existe, só não é por ali.

### A bateria

Cada vaga escolhe quais dos **seis** testes aplica, e a ordem de aplicação é
canônica (não é a ordem de clique do recrutador — senão dois candidatos da mesma
vaga responderiam sequências diferentes por acidente de interface):

| Teste | Telas | Tempo | Produz os 5 fatores? |
|---|---:|---:|:---:|
| Mapeamento Baliza | 39 | ~6 min | **sim** |
| Big Five (Mini-IPIP) | 20 | ~5 min | **sim** |
| DISC — estilo de trabalho | 25 | ~8 min | não |
| Inventário de Perfil Comportamental | 51 | ~17 min | não |
| Estilo Emocional do Cérebro | 60 | ~10 min | não |
| Julgamento situacional (SJT) | 8 | ~12 min | não |

A coluna da direita é a linha que separa "dá para calcular aderência" de "não
dá". Uma vaga que aplique só DISC e SJT **não tem aderência** — e isso não é
defeito a esconder, é a resposta correta. O que não pode acontecer é a tela
mostrar 0, que se lê como "candidato péssimo".

Regra vaga mínima: pelo menos um teste. Vaga sem teste não é uma vaga mais
simples — é uma vaga que manda o candidato para uma prova de zero telas.

---

## 4. O ciclo de vida de um candidato

```
convite            PENDING ─► SENT ─► OPENED ─► STARTED ─► COMPLETED
                       └──────────────────────► EXPIRED / REVOKED

avaliação          PENDING ─► IN_PROGRESS ─► COMPLETED
                       └──────────────────► EXPIRED / ABANDONED

parecer                          ADVANCE  /  DOUBT  /  REJECT
```

### Como ele entra

Três vias para a **mesma** chave, e nenhuma delas é senha:

1. o link do convite;
2. o QR do mesmo link;
3. um código de **4 dígitos**, que dá para ditar no telefone.

Quatro dígitos bastam porque o código é **devolvido ao acervo** quando a prova
termina: o espaço de 10.000 governa só os convites em aberto, nunca o histórico.
Quem tem o código entra, exatamente como quem tem o link — tratá-lo como segredo
forte seria mentir sobre o que ele é. O que protege é o limite de tentativas por
IP.

### O que ele responde

A prova é sorteada **uma vez**, no nascimento do convite, e fica congelada. Duas
razões: retomar tem que mostrar a mesma prova, e o escore de duas sessões não
pode misturar dois sorteios. A forma é função pura da semente gravada, então dá
para reconstruí-la exatamente.

Cada resposta é salva a cada clique. Prova incompleta **não vira relatório** — a
conclusão confere pendência item a item e recusa fechar com resposta faltando.

### O que ele nunca vê

- O fator, a faceta e a inversão de cada afirmação.
- A letra D/I/S/C de cada alternativa.
- O gabarito e a competência dos cenários do SJT — nem depois de terminar. Expor
  queima o banco de cenários.

Por isso a saída para o navegador do candidato passa por funções `*ParaCandidato`,
que existem exatamente para ser a única porta, e devolvem só `id` e `texto`.

### O que a empresa recebe

- **Aderência (fit)** — distância ponderada entre os cinco fatores do candidato e
  o perfil-alvo da vaga. `null` quando a bateria não mede os cinco fatores.
- **Selo de confiança** — e aqui vale a regra mais rígida do produto: **o fit
  nunca aparece sozinho.** Sem selo, o número não é exibido; fit sem selo vira
  nota de aprovação.
- **Arquétipo** — camada de comunicação, nunca de ranking.
- **Roteiro de entrevista** — as perguntas exatas a fazer, derivadas dos desvios.
- **Ficha dos módulos** — Big Five, DISC, Perfil Comportamental, Estilo Emocional
  e SJT, cada um no seu cartão.

### O parecer

Registrar a decisão é o que fecha o ciclo: `ADVANCE`, `DOUBT` ou `REJECT`, com
anotação livre e autor. Reescrever é permitido de propósito — mudar de ideia
depois da entrevista é o caminho normal, e cada mudança entra na auditoria com o
valor anterior.

Fica registrado que houve **pessoa** decidindo, que é o que o art. 20 da LGPD pede
quando alguém questiona uma decisão tomada com apoio de sistema.

---

## 5. As regras que o sistema garante

Invariantes. Se alguma cair, é defeito, não escolha.

**Escopo de empresa.** Nenhuma consulta a dado de empresa é escrita sem
`organizationId` vindo de `exigirTenant()`. O id **nunca** vem de parâmetro de
rota, corpo de requisição ou query string — só da sessão assinada. É isso que
impede que trocar um id na URL leia a base de outro cliente.

**O fit nunca aparece sozinho.** Garantido na leitura *e* na escrita, na mesma
função, porque a regra já escapou uma vez por estar só na leitura.

**Ausência não é zero.** Bateria que não mede os cinco fatores grava fit `null`.
Zero na tela se lê como "candidato péssimo", e é a leitura que decide quem vai
para a entrevista.

**Prova incompleta não vira relatório.** A bateria conclui inteira ou não conclui.

**Retenção.** A resposta bruta é apagada depois do prazo de cada empresa
(`retentionMonths`, 12 por padrão) e a avaliação é carimbada. O resultado
consolidado fica, e o link do candidato continua funcionando. Roda por
`prisma/manutencao.ts`, idempotente, uma vez por dia no cron.

**Auditoria.** Seis categorias: `AUTH`, `ACCESS`, `MUTATION`, `EXPORT`, `ADMIN`,
`PRIVACY`. Toda exportação e toda mudança de acesso entram — "quem podia ver o
quê, e desde quando" não se responde com o estado de agora.

**Migração no start.** O app roda `prisma migrate deploy` antes de subir. Custo
assumido: migração que falha impede o app de subir. É melhor que a alternativa
já vivida — container saudável, healthcheck verde, produto quebrado.

---

## 6. O que ainda não existe

Dito com precisão, para ninguém contar com o que não está lá.

### Permissões declaradas sem tela

| Permissão | Situação |
|---|---|
| `chave_api:gerenciar` | A tabela `ApiKey` existe com um campo `scopes` que **ninguém lê nem preenche**. Quando for implementado, tem que usar o mesmo vocabulário de `permissoes.ts` — não inventar um segundo. |

As doze outras têm porta. `empresa:editar` e `retencao:configurar` ganharam
formulário em Configurações; `vaga:ler` e `candidato:ler` passaram a ser exigidas
nas listas e nas fichas.

Sobre `vaga:ler` e `candidato:ler`: exigi-las não muda comportamento nenhum hoje,
porque os quatro papéis têm as duas. Muda o **contrato**. Enquanto a porta só
pedia sessão, a permissão existia no papel e não existia no caminho — e bastaria
criar um papel sem ela para descobrir, em produção, que ninguém nunca perguntou.

### Dados para conferir

`pnpm exec tsx prisma/dados-de-teste.ts` monta uma empresa de teste com uma
pessoa por papel e uma vaga por situação que precisa ser olhada — inclusive a que
aplica só DISC e SJT, que **não tem aderência** e serve para conferir que o fit
aparece como ausente e nunca como zero. Cada módulo é escorado pela mesma função
que a conclusão da prova usa; nada de número inventado.

### Fluxos que faltam

- **Convidar alguém para a equipe por e-mail.** Só dá para mudar papel e ligar ou
  desligar acesso de quem já existe. Criar acesso novo é fora do painel. Precisa
  de token de convite, envio e página de aceite.
- **Área logada do candidato** — ver a própria devolutiva, pedir exclusão dos
  dados (LGPD art. 18). Quando existir, com autenticação própria, nunca como um
  papel de `UserRole`.
- **Uma pessoa em mais de uma empresa.** `User.organizationId` é coluna, não
  tabela de vínculo. Um consultor que atenda três clientes precisa de três contas.
- **Escopo por vaga** — "o gestor da área vê só a vaga dele". Não existe, e foi
  deliberadamente descartado: os sujeitos do produto hoje são time de RH,
  candidato e operador.
