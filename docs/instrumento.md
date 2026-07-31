# O Instrumento — versão 2.0.0

> Especificação psicométrica do mapeamento comportamental.
> Este documento é a fonte da verdade. Código, banco e telas derivam daqui — nunca o contrário.

---

## 1. O que este instrumento é (e o que ele não é)

**É:** um questionário de **autopercepção de comportamento no trabalho**, baseado no modelo de
cinco fatores (Big Five), construído com itens de domínio público, que devolve um perfil
descritivo e um índice de aderência a um perfil-alvo de vaga.

**Não é:** teste psicológico, avaliação psicológica, laudo, diagnóstico, medida de inteligência,
medida de competência técnica, nem preditor de caráter.

Essa distinção não é jurídica-defensiva apenas: ela define o vocabulário do produto inteiro.

### 1.1 Vocabulário obrigatório

| Nunca escrever | Sempre escrever |
|---|---|
| teste psicológico | mapeamento comportamental / questionário |
| avaliação psicológica | análise de perfil |
| laudo, diagnóstico | relatório, leitura de perfil |
| aprovado / reprovado | maior aderência / menor aderência |
| traço de personalidade | comportamento no trabalho, tendência |
| o candidato **é** X | o candidato **tende a** X / **relatou** X |

### 1.2 Por quê

No Brasil, a **Resolução CFP nº 31/2022** (que substituiu a 09/2018) regulamenta o SATEPSI e
firma a aplicação de testes psicológicos como prática privativa do psicólogo — posição
reconhecida pelo STF. O CFP também veda que um instrumento único seja decisivo numa seleção.

Consequências de design, não de rodapé:

1. **Não usamos nenhum instrumento do SATEPSI.** Usamos itens derivados do **IPIP**
   (International Personality Item Pool, Goldberg), que é **domínio público** e mede o mesmo
   Big Five que os concorrentes vendem como diferencial — sem licença, sem custo, sem amarra.
2. **Todo relatório carrega, no corpo (não em rodapé):**
   *"Este resultado é um insumo para a entrevista. Ele não substitui a conversa com a pessoa e
   não deve ser o único critério de decisão."*
3. **Toda tela de ranking exige** que o recrutador tenha visto pelo menos uma ficha completa
   antes de exportar — pequena fricção deliberada contra o uso como filtro automático.

---

## 2. Estrutura de construtos

Cinco fatores, três facetas cada. Os nomes técnicos ficam no banco; a UI usa os nomes de
mercado.

| Cód | Nome técnico | Nome na UI | Facetas |
|---|---|---|---|
| **C** | Conscienciosidade | **Organização e Entrega** | Organização · Realização · Confiabilidade |
| **E** | Estabilidade Emocional | **Estabilidade sob Pressão** | Serenidade · Resiliência · Autoconfiança |
| **X** | Extroversão | **Energia Social** | Assertividade · Sociabilidade · Entusiasmo |
| **A** | Amabilidade | **Cooperação** | Cooperação · Empatia · Confiança |
| **O** | Abertura | **Abertura ao Novo** | Curiosidade · Criatividade · Flexibilidade |

**E é medido no polo positivo** (estabilidade), não como neuroticismo. Motivo: o relatório vai
para o próprio candidato, e "você pontuou alto em neuroticismo" é uma frase que não deveria
existir num produto de recrutamento.

### 2.1 Por que estes cinco, e o que cada um vale

- **C — Conscienciosidade** é o único fator que prevê desempenho em praticamente **qualquer**
  cargo (meta-análise clássica de Barrick & Mount, 1991, replicada desde então). É o carro-chefe
  do fit score e deve ter peso alto no perfil-alvo padrão de quase toda vaga.
- **E — Estabilidade** é o segundo mais generalizável, e domina em cargos de pressão,
  atendimento e lidar com público.
- **X — Extroversão** **não** prevê desempenho em geral. Prevê em **vendas e liderança**, e
  principalmente pela faceta de **assertividade** (não pela sociabilidade). Peso alto só quando
  a vaga justificar.
- **A — Amabilidade** prevê em trabalho de equipe e atendimento. **Atenção:** alta demais
  atrapalha negociação, cobrança e gestão de performance. É o exemplo canônico de dimensão
  **"faixa ótima"**, não "quanto mais melhor".
- **O — Abertura** prevê aprendizagem, adaptação a mudança e criatividade. Peso alto em vagas
  de produto, criação e ambientes que mudam muito.

### 2.2 O que deliberadamente NÃO medimos

- **Capacidade cognitiva.** É o preditor isolado mais forte de desempenho — e exatamente por
  isso é o mais perigoso: gera *adverse impact* racial e socioeconômico documentado, e nos
  aproxima do território privativo do psicólogo. Fora do escopo, e essa decisão é permanente.
- **Qualquer dado sensível** (LGPD art. 5º, II): origem racial/étnica, religião, opinião
  política, filiação sindical, saúde, vida sexual, genética, biometria. Nenhum item toca nisso,
  nem de forma indireta ("você costuma faltar por motivo de saúde?" está proibido).
- **Contexto de vida pessoal.** Todos os itens são ancorados em comportamento **no trabalho**.
  Isso aumenta a relevância percebida pelo candidato e reduz a superfície de invasão.

---

## 3. Formato: a decisão psicométrica central

Havia três caminhos, e o terceiro é o que resolve.

| Formato | Comparável entre pessoas? | Resiste a fraude? | Viável no dia 1? |
|---|---|---|---|
| Likert puro | ✅ sim (normativo) | ❌ não | ✅ |
| Escolha forçada pura | ❌ **não** (ipsativo) | ✅ | ✅ |
| Escolha forçada com IRT Thurstoniano | ✅ | ✅ | ❌ exige milhares de respostas pra calibrar |

**O problema fatal da escolha forçada pura:** um escore ipsativo só compara dimensões *dentro*
da mesma pessoa. Ele responde "a Maria é mais organizada do que sociável?", mas **não responde
"a Maria é mais organizada que o João?"** — que é literalmente a única pergunta que o produto
precisa responder. Muito produto de mercado erra aqui e ranqueia candidatos com escore
ipsativo, o que é estatisticamente inválido.

### 3.1 A solução: instrumento de duas partes

**Parte A — Núcleo normativo (44 itens Likert de 5 pontos).**
É o que gera o escore comparável entre candidatos. É o que alimenta o ranking. Itens redigidos
como **comportamento concreto**, nunca como adjetivo abstrato.

**Parte B — 8 blocos de cenário com escolha forçada.**
O candidato lê uma situação real de trabalho e escolhe **o que faria primeiro** e **o que
deixaria por último** entre 4 ações ancoradas em fatores diferentes.

A Parte B **não entra no escore principal**. Ela serve a três coisas:

1. **Convergência.** Se a pessoa marcou Likert alto em Cooperação mas nos cenários sempre
   escolhe a ação de confronto por último... beleza, converge. Se marcou alto e escolhe
   confronto **primeiro** repetidamente, algo não fecha → **derruba o índice de confiança**.
2. **Matéria-prima do relatório.** "Diante de conflito, ele tende a agir antes de alinhar" é
   uma frase útil pro recrutador. Escore não gera isso; cenário gera.
3. **Engajamento.** É a parte que faz o candidato terminar. Likert puro tem abandono alto no
   celular; cenário tem cara de jogo.

**Por que isso é honesto e defensável:** funciona no dia 1 sem amostra normativa, é mais
resistente a fraude que Likert puro, e ainda produz o sinal de confiabilidade de graça. Quando
houver ~2.000 respostas acumuladas, dá pra calibrar normas brasileiras reais e, se quiser,
migrar a Parte B pra escoragem normativa. A arquitetura já está pronta pra isso.

### 3.2 Escala Likert

5 pontos, ancorados em frequência/concordância — **sem ponto "neutro" nomeado como fuga**:

| Valor | Rótulo |
|---|---|
| 1 | Discordo totalmente |
| 2 | Discordo mais que concordo |
| 3 | Fico no meio |
| 4 | Concordo mais que discordo |
| 5 | Concordo totalmente |

O ponto 3 existe (forçar 4 pontos aumenta ruído em quem genuinamente é médio), mas é rotulado
como posição legítima, não como "não sei".

### 3.3 Regras de redação dos itens

Toda item novo precisa passar por estas sete regras:

1. **Comportamento observável, não adjetivo.** ✅ "Eu deixo tarefas pra última hora."
   ❌ "Eu sou organizado."
2. **Contexto de trabalho.** Nunca vida pessoal, família, saúde, dinheiro.
3. **Uma ideia por item.** Sem duplo-barril ("eu cumpro prazos **e** aviso quando atraso" mede
   duas coisas e não se sabe qual foi respondida).
4. **Leitura de 6º ano.** Sem jargão de RH, sem "proatividade", "resiliência", "sinergia".
5. **Sem dupla negativa.**
6. **~40% invertidos**, distribuídos, contra aquiescência e resposta em linha reta.
7. **Sem carga moral óbvia.** Um item onde a resposta "certa" é evidente não mede nada —
   exceto nos 4 itens de desejabilidade social, onde a carga óbvia é justamente o instrumento.

### 3.4 Duração

44 itens Likert (~6 s cada) + 8 blocos de cenário (~25 s cada) ≈ **8 a 10 minutos**.
Se ultrapassar 12 minutos em teste de campo, cortar itens — abandono cresce muito rápido
depois disso no celular.

---

## 4. Escoragem

### 4.1 Escore bruto por fator

```
item invertido        → valor = 6 − resposta
escore_bruto(fator)   = média dos 8 itens do fator          → [1, 5]
escore_0_100(fator)   = (escore_bruto − 1) / 4 × 100        → [0, 100]
```

Média, não soma: mantém o escore válido mesmo se um item for descartado no futuro.

### 4.2 Facetas

Cada faceta tem 2 ou 3 itens. **Isso é pouco para confiabilidade estatística** — a consistência
interna de uma faceta de 2 itens é fraca por construção.

**Regra dura, e ela não é negociável:**

- O **fator** (8 itens, alfa esperado 0,78–0,85) é reportado com confiança, aparece em gráfico
  e **entra no fit score**.
- A **faceta** aparece apenas como **nuance qualitativa em texto**, nunca em número, nunca em
  gráfico, e **nunca no ranking**.

Prometer precisão de faceta com 2 itens é o tipo de mentira que derruba a credibilidade do
produto na primeira vez que um cliente com formação em psicologia olhar de perto.

### 4.3 Normas e percentis — o problema do dia 1

No lançamento não existe norma brasileira própria. As opções e a escolha:

- ❌ Escala bruta 0–100: todo mundo cai entre 55 e 75. Não discrimina, não informa.
- ⚠️ Normas internacionais publicadas do IPIP: aceitável, mas a amostra não é brasileira nem
  do contexto de trabalho.
- ✅ **Percentil contra a amostra acumulada do próprio produto, exibindo o N.**

Regra de exibição:

| N acumulado | O que o relatório mostra |
|---|---|
| < 200 | Só faixa qualitativa (Baixo / Médio-baixo / Médio / Médio-alto / Alto) por corte teórico. **Nenhum percentil.** |
| 200 – 1.000 | Percentil **com o N visível**: *"acima de 68% das 412 pessoas que já responderam"* |
| > 1.000 | Percentil + recorte por família de cargo, quando houver N ≥ 200 no recorte |

Isso é honesto, melhora sozinho conforme o produto roda, e transforma a base de respostas em
ativo defensável — que é a única barreira de entrada real num mercado onde o instrumento é
domínio público.

### 4.4 Fit Score — aderência à vaga

**Não é média.** É distância ponderada a um perfil-alvo, e cada dimensão tem um **tipo**:

| Tipo | `ideal` da dimensão | Exemplo |
|---|---|---|
| `maior_melhor` | topo da faixa | Conscienciosidade em quase toda vaga |
| `faixa_otima` | meio da faixa; penaliza dos dois lados | Amabilidade em cobrança/negociação |
| `menor_melhor` | base da faixa | raro, mas existe |
| `irrelevante` | peso 0 — não entra na conta | Extroversão numa vaga técnica |

```
ideal(d)  = definido pelo tipo (ou declarado explicitamente no perfil)
dentro?   = escore está entre os limites da faixa alvo

desvio(d) = |escore − ideal| / 100 × ( dentro? ? 0,35 : 1,0 )

fit = 100 − Σ( peso(d) × desvio(d) ) / Σ( peso(d) ) × 100
```

**Por que a atenuação de 0,35, e não penalidade zero dentro da faixa.**
Esta é a correção mais importante do modelo, e ela só apareceu ao rodar
`docs/scorer_referencia.rb` com candidatos simulados:

> Com penalidade **zero** dentro da faixa, qualquer candidato acima do piso em
> todas as dimensões marca **exatamente 100**. Numa vaga real, metade dos
> inscritos satura no teto e o ranking perde resolução justamente no topo — que
> é o único lugar onde o recrutador realmente olha.

Com a atenuação, os mesmos três candidatos simulados que antes davam
`100,0 / 89,7 / 89,5` (praticamente empatados) passam a dar
`93,5 / 77,8 / 68,6`. O fator 0,35 é deliberado: alto o bastante pra discriminar
dentro da faixa, baixo o bastante pra que **estar fora da faixa continue sendo
qualitativamente pior** que qualquer variação interna.

`irrelevante` tem **peso 0** e fica listada de propósito no perfil da vaga: o
recrutador precisa ver que a dimensão foi considerada e descartada, não que foi
esquecida.

**Explicabilidade é obrigatória, não opcional.** Todo fit score exibido carrega:

- as **3 dimensões que mais puxaram pra cima**
- as **3 que mais puxaram pra baixo**
- o **selo de confiança** ao lado (§5) — nunca um sem o outro

Sem isso, o direito de revisão de decisão automatizada (LGPD art. 20) fica descoberto, e o
recrutador não tem como usar o número com juízo.

---

## 5. Índice de Confiança — a aposta de honestidade

Todo mundo sabe que candidato responde o que acha que o recrutador quer ouvir. Nenhum
concorrente mostra isso. Nós mostramos.

Cinco sinais, combinados num selo **Alta / Média / Baixa**.

### 5.1 Desejabilidade social (4 itens)

Afirmações positivas mas improvavelmente verdadeiras para qualquer pessoa
("Eu nunca me irritei com um colega de trabalho"). Concordar com todas = está se pintando de
santo.

```
ds = nº de itens D respondidos com 4 ou 5     → [0, 4]
```

### 5.2 Pares de consistência (3 pares)

Mesmo conteúdo, redação diferente, posicionados longe um do outro no questionário. Divergência
alta = respondeu no automático ou está construindo um personagem.

```
inconsistencia = média( |resposta_a − resposta_b| ) dos 3 pares    → [0, 4]
```

### 5.3 Resposta em linha reta

```
straight_line = maior sequência de itens consecutivos com a mesma resposta
```

Como 42,5% dos itens são invertidos, uma sequência longa idêntica é logicamente contraditória —
não é preferência, é desatenção.

### 5.4 Velocidade

Mediana de tempo por item. Abaixo de ~1,8 s a pessoa não leu o enunciado.
*(Limiar provisório — recalibrar com dados reais depois de ~500 respostas.)*

### 5.5 Convergência Parte A × Parte B

Correlação entre o vetor ipsativo dos cenários e o perfil normativo do Likert. Divergência
sistemática = as duas partes contam histórias diferentes.

### 5.6 Composição

| Selo | Condição |
|---|---|
| 🟢 **Alta** | nenhum sinal disparado |
| 🟡 **Média** | 1 sinal disparado |
| 🔴 **Baixa** | 2 ou mais sinais disparados |

**Texto exibido no selo 🔴, literalmente:**

> *"O padrão de respostas sugere que esta pessoa respondeu pensando em causar boa impressão —
> algo comum e compreensível num processo seletivo. Trate este perfil como pista fraca e
> confirme na entrevista."*

Note o "comum e compreensível": o selo não acusa o candidato de desonestidade. Ele calibra a
confiança do recrutador. A diferença importa — ética e juridicamente.

---

## 6. Arquétipos — camada de comunicação

Seis arquétipos derivados dos fatores. Definidos em `data/arquetipos.yml`.

**Regra dura:** o arquétipo é **rótulo de comunicação**, o escore é o dado.

- ✅ Usar arquétipo em: título do relatório, e-mail, conversa, material de venda
- ❌ **Nunca** usar arquétipo em: ranking, fit score, filtro, exportação, qualquer comparação

Um arquétipo é uma discretização com perda — dois candidatos "Executor" podem ter perfis
bem diferentes. Ranquear por arquétipo joga fora exatamente a informação pela qual o cliente
está pagando.

---

## 7. Ética operacional

Estas cinco regras vão para o código, não para a política de privacidade:

1. **Zero dado sensível** coletado, em qualquer campo, em qualquer etapa.
2. **Nenhum corte automático.** O produto **ordena** candidatos; ele nunca elimina. Não existe
   nem existirá funcionalidade "descartar abaixo de X".
3. **O candidato sempre recebe o próprio resultado**, integral, sem depender da empresa
   liberar.
4. **Monitoramento de impacto adverso.** Se o instrumento passar a ser usado em volume, comparar
   distribuição de fit por faixa etária e gênero autodeclarado **opcionalmente** (coleta
   separada, anônima, desacoplada do escore, sem entrar no cálculo). Se aparecer disparidade
   sistemática, é bug do instrumento — e vira prioridade.
5. **Retenção com prazo.** Resposta bruta expurgada em 12 meses por padrão. O candidato pode
   apagar antes, sozinho, sem pedir para ninguém.

---

## 8. Onde isto vive no código

| Arquivo | Conteúdo |
|---|---|
| `src/lib/instrument/items.ts` | 128 itens com fator, faceta, inversão e pares de consistência |
| `src/lib/instrument/scenarios.ts` | 8 blocos de cenário com ancoragem por fator |
| `src/lib/instrument/archetypes.ts` | 6 arquétipos: como brilha, onde trava, o que o gestor precisa dar |
| `src/lib/instrument/presets.ts` | 7 perfis-alvo prontos, para o recrutador não partir do zero |
| `src/lib/instrument/form.ts` | sorteio da prova e ordenação sob restrição |
| `src/lib/instrument/scoring.ts` | a escoragem — porte fiel do scorer de referência |
| `src/lib/instrument/*.test.ts` | 44 testes, incluindo as regressões do modelo |

---

## 10. O que mudou da versão 1.0.0 para a 2.0.0

Duas mudanças, e nenhuma delas afrouxa uma regra do modelo.

### 10.1 O banco cresceu de 44 para 128 itens

Cada faceta passou de 2–3 itens para 8 (4 diretos e 4 invertidos), e a
desejabilidade social de 4 para 8. **A prova continua com 44 itens** — 8 por
fator + 4 de desejabilidade —, então o §4.1 e o §4.2 valem sem alteração: o
fator segue medido por 8 itens, e faceta segue sem virar número.

O banco maior existe por três motivos:

1. **Sorteio real por pessoa.** Duas pessoas não recebem a mesma prova, o que
   torna combinar respostas inútil.
2. **Candidato recorrente recebe itens novos.** Reaplicar os MESMOS itens mede
   memória, não mudança — e o §diferencial de "histórico de evolução" só é
   honesto com banco grande.
3. **Item ruim pode ser aposentado** sem encurtar a prova.

### 10.2 A ordem passou a ser gerada, não fixa

A v1 dizia "não randomizar a ordem: ela é parte do instrumento", e estava certa:
a ordem fixa garantia três invariantes (pares de consistência distantes, fatores
nunca adjacentes, desejabilidade espalhada). Mas ordem fixa em produto real vicia
e permite combinar respostas.

A saída foi separar **sorteio** de **ordenação**. A ordem não é embaralhada — é
**gerada por um guloso com reinício que só aceita posições respeitando as mesmas
invariantes**, com afrouxamento progressivo se não fechar (a restrição de fatores
adjacentes nunca é relaxada). Tudo derivado de uma semente gravada na avaliação,
então a prova é reconstruível — o que sustenta retomada e auditoria.

Verificado em `form.test.ts`: 200 sorteios sem uma violação, distância média
entre pares de consistência acima de 15 posições, e todo item do banco aparecendo
ao menos uma vez em 200 provas.

---

## 9. Referências

- Goldberg, L. R. — International Personality Item Pool (IPIP), domínio público — <https://ipip.ori.org>
- Barrick, M. R. & Mount, M. K. (1991) — *The Big Five personality dimensions and job performance: a meta-analysis*
- Conselho Federal de Psicologia — Resolução CFP nº 31/2022 (SATEPSI) — <https://satepsi.cfp.org.br/legislacao.cfm>
- Lei nº 13.709/2018 (LGPD) — arts. 5º II, 9º, 18 e 20
