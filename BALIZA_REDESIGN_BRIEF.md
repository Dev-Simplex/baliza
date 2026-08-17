# BALIZA — REDESIGN COMPLETO DO PRODUTO

> Briefing de implementação para Claude Code / Codex.
> Repositório: `Dev-Simplex/baliza`
> Objetivo: transformar integralmente a identidade antiga do Prumo em **Baliza**, sem quebrar regras de negócio, psicometria, segurança, LGPD ou fluxos existentes.

---

## 0. Antes de tocar no código

Leia este documento inteiro e depois audite o repositório completo. Não comece trocando cores isoladamente.

Mapeie primeiro:
- `src/app/(site)` — landing pública;
- `src/app/(auth)` — login/cadastro;
- `src/app/(app)` — painel autenticado;
- `src/app/vaga/[token]` — entrada pública da vaga;
- `src/app/t/[token]` — questionário do candidato;
- `src/app/acesso` — acesso por código;
- `src/components/app` — componentes do produto;
- `src/components/teste` — fluxo do questionário;
- `src/components/ui` — primitives/shadcn;
- `src/components/faixa.tsx` — elemento visual mais importante do produto;
- `src/components/marca.tsx` — marca antiga que deverá ser substituída;
- `src/app/globals.css` — tokens e sistema visual atual;
- `src/app/layout.tsx` — fontes, metadata e viewport;
- `README.md` — regras de produto que NÃO podem ser quebradas.

Antes de alterar comportamento, rode:

```bash
pnpm install
pnpm exec vitest run
pnpm exec tsc --noEmit
pnpm build
```

Registre o baseline. O redesign é visual/UX + branding. **Não refatore o motor de scoring, sorteio, segurança, tenant, permissões, retenção ou regras psicométricas sem necessidade direta.**

---

# 1. A MARCA NOVA

## Nome

**baliza**

Sempre em minúsculas no wordmark. Em texto corrido, “Baliza”.

Empresa mãe, quando necessário: **Baliza by SPXIA**. Não usar “BalizaSPX”.

## Conceito aprovado: FIT

A marca representa a relação entre **pessoa e vaga**.

- lado A = candidato / sinais comportamentais;
- lado B = contexto / perfil-alvo da vaga;
- espaço negativo central = FIT / aderência interpretada;
- o sistema não “aprova” alguém; ele cria **clareza para decisão**.

Mensagem conceitual:

> Baliza não decide por você. Baliza dá referência para decidir melhor.

Não transformar isso em ícone literal de RH. O símbolo aprovado já está em `brand/svg/` no pacote entregue.

## Posicionamento

O produto não é “mais um teste comportamental”.

O diferencial é:
1. comparar a pessoa com **esta vaga**, não com um ideal genérico;
2. mostrar faixa-alvo e desvio;
3. explicar por que a aderência subiu/desceu;
4. mostrar confiança da resposta;
5. gerar roteiro de entrevista;
6. ordenar, nunca eliminar automaticamente.

Frase institucional preferencial:

> **Veja além do currículo. Decida com referência.**

Alternativa para contextos internos:

> **Pessoa + vaga. Aderência explicada.**

---

# 2. ASSETS DA MARCA

Copie o conteúdo do brand kit para:

```text
public/brand/
  baliza-symbol-color.svg
  baliza-symbol-black.svg
  baliza-symbol-white.svg
  baliza-horizontal-color.svg
  baliza-horizontal-black.svg
  baliza-horizontal-white.svg
  favicon.svg
  baliza.ico
  app-icon-light-1024.png
  app-icon-dark-1024.png
  app-icon-orange-1024.png
```

O **SVG é a fonte de verdade**, não um PNG rasterizado.

Atualize `src/components/marca.tsx` para usar os SVGs aprovados. A API do componente pode continuar parecida (`href`, `tamanho`, `className`), mas a forma desenhada deve ser a nova identidade.

Use símbolo sozinho em:
- favicon;
- avatar do produto;
- sidebar colapsada;
- loading/splash;
- telas pequenas quando espaço for crítico.

Use lockup horizontal em:
- landing;
- login/cadastro;
- sidebar desktop;
- relatórios/documentos quando houver espaço.

---

# 3. PALETA OFICIAL

## Marca

```css
--baliza-ink: #151515;
--baliza-orange: #FF5A1F;
--baliza-bone: #F6F4F1;
--baliza-stone: #B7B3AC;
--baliza-fog: #E7E4E0;
--baliza-white: #FFFFFF;
```

### Hierarquia

- **Ink `#151515`**: texto principal, navegação, superfícies dark.
- **Signal Orange `#FF5A1F`**: marca, CTA primário, seleção, foco, pequenos sinais de atividade.
- **Bone `#F6F4F1`**: fundo claro principal. Evitar branco clínico em toda a interface.
- **Fog `#E7E4E0`**: bordas, separadores e superfícies discretas.
- **Stone `#B7B3AC`**: informação secundária.

## Cores semânticas de dados

A cor de marca NÃO deve significar “bom” ou “ruim”.

```css
--fit-positive: #2E7D6E;
--fit-positive-soft: #E4F0ED;
--outside-attention: #A45A3F;
--outside-attention-soft: #F4E7E1;
--danger: #B42318;
```

`outside-attention` é atenção/desvio, não reprovação. Não transformar “fora da faixa” em vermelho.

---

# 4. DIREÇÃO VISUAL

A interface deve parecer uma **ferramenta profissional de decisão**, não uma plataforma genérica de RH e não uma startup “AI purple”.

Referências de sensação, sem copiar layout:
- Linear: hierarquia, densidade e foco;
- Notion: clareza e neutralidade;
- Stripe: acabamento e tipografia;
- Ashby/Attio: produto B2B moderno;
- Vercel: disciplina visual.

## Regras

- muito espaço em branco/bone;
- bordas finas e discretas;
- sombras mínimas;
- nada de glassmorphism pesado;
- nada de gradiente decorativo no logo;
- nada de cards dentro de cards sem função;
- poucos raios e tamanhos consistentes;
- laranja em doses pequenas e deliberadas;
- números grandes e claros onde ajudam decisão;
- conteúdo e dados primeiro, decoração depois;
- dark mode precisa parecer projetado, não apenas invertido.

## Geometria

- controles: 10px de raio;
- cards/painéis: 14px;
- blocos de destaque/modal: 18px;
- chips: pill somente quando realmente são chips/estado;
- evitar arredondar absolutamente tudo.

---

# 5. TIPOGRAFIA

Simplifique a identidade antiga.

Recomendação:
- Interface, headings e corpo: **Inter Tight**;
- dados técnicos, códigos, labels e valores tabulares: **JetBrains Mono**;
- retire Bricolage Grotesque do papel de display principal para a Baliza não carregar o sotaque visual do Prumo.

Pesos:
- 400 corpo;
- 500 controles/labels;
- 600 headings e números-chave;
- evitar 700/800 em excesso.

Não espalhe `text-[Npx]` pelo código. Preserve a ideia atual de escala tipográfica centralizada, mas redesenhe os degraus para a Baliza.

---

# 6. DESIGN TOKENS / GLOBALS.CSS

Refaça `src/app/globals.css` como sistema Baliza.

Mantenha os princípios bons já existentes:
- tokens semânticos;
- `color-scheme` correto;
- foco visível;
- suporte a reduced motion;
- impressão/PDF;
- cores de dados separadas da marca;
- escala tipográfica central.

Substitua toda a narrativa de “latão/instrumento/prumo” por Baliza/FIT/referência.

Mapeamento sugerido:

```css
:root {
  --background: #F6F4F1;
  --foreground: #151515;
  --card: #FFFFFF;
  --card-foreground: #151515;
  --primary: #151515;
  --primary-foreground: #FFFFFF;
  --accent: #FFF0E9;
  --accent-foreground: #8A2F0D;
  --border: #E7E4E0;
  --ring: #FF5A1F;
  --brand: #FF5A1F;
}

.dark {
  --background: #101010;
  --foreground: #F7F5F2;
  --card: #171717;
  --card-foreground: #F7F5F2;
  --primary: #F7F5F2;
  --primary-foreground: #101010;
  --accent: #2A1B15;
  --accent-foreground: #FF8B60;
  --border: #2B2B2B;
  --ring: #FF5A1F;
  --brand: #FF5A1F;
}
```

Não copie cegamente os valores acima se contraste WCAG falhar. Ajuste mantendo a intenção.

---

# 7. COMPONENTE-ASSINATURA: FAIXA

`src/components/faixa.tsx` é uma das melhores ideias do produto e deve sobreviver ao rebrand.

Não substitua por radar genérico.

Redesenhe para Baliza:
- trilho mais limpo;
- faixa-alvo com preenchimento suave;
- marcador do candidato mais preciso;
- ideal sutil;
- desvio claramente visível sem “alarme vermelho”;
- tooltip/aria-label preservados;
- animação curta e funcional;
- excelente leitura em 320px de largura;
- impressão legível.

A **faixa** deve ser um elemento visual reconhecível da Baliza em landing, relatório e produto.

---

# 8. SHELL DO APP

Hoje o app usa sidebar + header sticky. Preserve a arquitetura, repagine completamente.

## Desktop

- sidebar 232–248px;
- fundo ligeiramente diferente do conteúdo;
- logo horizontal no topo;
- item ativo com fundo discreto + pequeno sinal laranja;
- ícones Lucide 16–18px;
- sem barras decorativas grossas;
- seção “Plataforma” para admin permanece clara.

## Header

- 60–64px;
- título contextual/breadcrumb quando útil;
- ações principais à direita;
- tema e menu de usuário discretos;
- blur apenas se realmente melhorar a leitura.

## Mobile

- navegação por sheet continua;
- touch targets >= 44px;
- nenhuma tabela crítica pode exigir desktop;
- ações secundárias vão para menu quando necessário.

---

# 9. LANDING PÚBLICA

A landing precisa vender **decisão melhor**, não “um questionário”.

## Hero

Eyebrow:
> Inteligência comportamental para recrutamento

Headline preferencial:
> **Veja além do currículo.**

Complemento:
> Compare o perfil comportamental de cada candidato com o que a vaga realmente pede. Receba a aderência explicada e as perguntas certas para a entrevista.

CTA primário:
> Criar minha primeira vaga

CTA secundário:
> Ver como funciona

Não usar ilustração genérica de pessoas felizes. O hero visual deve usar o próprio produto: faixa-alvo, ranking e trecho de relatório.

## Estrutura

1. Hero com produto real.
2. “Currículo mostra histórico. Baliza mostra contexto para a decisão.”
3. 3 passos: vaga → link → ranking/roteiro.
4. Demonstração de FIT candidato × vaga.
5. Explicação visual de faixa-alvo.
6. Confiança/resposta defensável.
7. Segurança e decisões humanas.
8. FAQ.
9. CTA final.

Evite marketing vazio como “revolucione seu RH com IA”.

---

# 10. LOGIN / CADASTRO

As páginas de auth devem parecer parte do mesmo produto:
- fundo Bone;
- logo Baliza horizontal;
- card central limpo;
- no máximo uma pequena composição do símbolo FIT como detalhe;
- inputs grandes, labels claros, estados de erro acessíveis;
- sem painel ilustrado desnecessário;
- mobile impecável.

---

# 11. DASHBOARD

O dashboard atual tem uma estrutura boa e deve ganhar mais hierarquia.

Prioridade visual:
1. vagas/respostas que exigem ação;
2. maiores aderências;
3. volume e base;
4. insights complementares.

Os KPI cards não devem parecer quatro caixas iguais. Use hierarquia:
- números fortes;
- labels menores;
- um destaque controlado para aderência média;
- variação visual discreta.

“Maiores aderências” deve ser o bloco central do dashboard, com ranking, vaga, confiança e score claramente legíveis.

---

# 12. VAGAS

Refaça lista, criação e detalhe.

A tela de vaga deve deixar evidente:
- status;
- perfil-alvo;
- link / QR / código;
- candidatos aguardando/em andamento/concluídos;
- ranking;
- ações de compartilhar/convidar;
- editar perfil-alvo.

O perfil-alvo não pode parecer um formulário técnico escondido. Ele é o contexto que define o FIT e precisa ser visualmente protagonista.

---

# 13. CANDIDATOS E RELATÓRIO

O relatório deve responder rapidamente:

> “Por que esta pessoa ficou com esta aderência para esta vaga?”

Ordem sugerida:
1. identidade do candidato + vaga;
2. aderência + confiança;
3. resumo explicativo;
4. dimensões que puxaram para cima/baixo;
5. faixas por dimensão;
6. roteiro de entrevista;
7. nuances/facetas em texto;
8. observações e disclaimer.

Não esconder explicação atrás de tabs demais.

O score nunca aparece sozinho. Preserve essa regra.

---

# 14. QUESTIONÁRIO DO CANDIDATO

Este fluxo precisa ser mais calmo que o painel do recrutador.

- logo Baliza discreto;
- fundo Bone/white;
- largura confortável;
- uma pergunta por foco visual;
- progresso claro, não ansioso;
- botões/touch targets grandes;
- nada que pareça “prova psicológica”;
- confirmação final simples e humana;
- não mostrar resultado ao candidato se a regra atual não prevê isso.

Não altere seleção, ordem, persistência, retomada ou cálculo do instrumento.

---

# 15. MICROINTERAÇÕES

Use `motion` somente onde comunica estado:
- marcador entrando na faixa;
- painel/modal;
- feedback de copiar link;
- progresso do questionário;
- loading/skeleton.

Duração padrão 120–240ms. Nada flutuando infinitamente.

O símbolo FIT pode ter uma animação de abertura/encaixe no splash: as duas partes se aproximam e o espaço central se resolve. Respeitar `prefers-reduced-motion`.

---

# 16. ACESSIBILIDADE

Obrigatório:
- WCAG AA para texto e controles;
- foco visível;
- não depender só de cor;
- labels reais;
- `aria-current` na navegação;
- gráficos com alternativa textual;
- touch targets adequados;
- dark mode com contraste real;
- reduced motion preservado.

---

# 17. O QUE NÃO PODE SER QUEBRADO

Leia o README atual e preserve integralmente estas regras:

1. nunca chamar de “teste psicológico”, “avaliação psicológica”, “laudo”, “aprovado/reprovado”;
2. Baliza ordena, nunca elimina automaticamente;
3. aderência sempre explicada e acompanhada de confiança;
4. faceta não vira score numérico;
5. escore ipsativo não entra no ranking;
6. roteiro de entrevista não sai vazio;
7. resultado continua sob controle da empresa aplicadora;
8. edição do perfil-alvo continua recalculando aderência com a régua nova;
9. links/tokens/códigos e rate-limit continuam seguros;
10. isolamento multiempresa/tenant e permissões não mudam.

**Não transforme redesign em refatoração de domínio.**

---

# 18. RENOMEAR PRUMO → BALIZA

Faça busca global por referências visíveis a `Prumo`, `prumo` e metáforas antigas.

Atualize pelo menos:
- `package.json` → `name: "baliza"`;
- metadata / OpenGraph / applicationName;
- `Marca`;
- landing;
- auth;
- mensagens e emails exibidos ao usuário;
- favicon/ícones;
- documentação e comentários de design system;
- títulos de relatório/PDF;
- acessibilidade (`aria-label`, alt etc.).

Não renomeie tabelas, campos, migrations, chaves ou identificadores internos só por estética. Evite risco desnecessário.

Credenciais de demonstração podem ser revisadas separadamente, sem quebrar seeds existentes.

---

# 19. ORDEM DE IMPLEMENTAÇÃO

Faça em commits/etapas pequenas e verificáveis:

### Etapa A — Auditoria
- mapa de rotas/componentes;
- lista de referências Prumo;
- baseline de testes/build;
- screenshots antes.

### Etapa B — Brand foundation
- assets em `public/brand`;
- Marca;
- favicon;
- metadata;
- tokens;
- tipografia.

### Etapa C — Primitives
- Button;
- Input;
- Select;
- Card/Painel;
- Dialog/Sheet;
- Badge;
- Table/List row;
- Empty state;
- Tooltip;
- Toast;
- Skeleton.

### Etapa D — Shell
- sidebar;
- header;
- mobile navigation.

### Etapa E — Landing + Auth + fluxo público
- site;
- login/cadastro;
- vaga pública;
- acesso por código;
- questionário.

### Etapa F — Core app
- dashboard;
- vagas;
- candidatos;
- relatórios;
- configurações;
- admin.

### Etapa G — QA
- light/dark;
- 320, 375, 768, 1024, 1440, 1920px;
- teclado;
- reduced motion;
- impressão/PDF;
- testes + tsc + build.

---

# 20. CRITÉRIO DE PRONTO

O trabalho só termina quando:

```bash
pnpm exec vitest run
pnpm exec tsc --noEmit
pnpm build
```

passarem.

Além disso:
- não pode restar `Prumo` visível na UI;
- não pode restar latão como cor de marca;
- marca Baliza deve estar consistente em todas as superfícies;
- light e dark precisam parecer do mesmo sistema;
- mobile não pode ser uma versão espremida do desktop;
- impressão/relatório precisa continuar funcional;
- nenhuma regra de ranking ou psicometria pode ter mudado sem intenção explícita.

Antes de finalizar, entregue um resumo com:
1. arquivos alterados;
2. decisões de design;
3. mudanças de branding;
4. testes executados;
5. pontos que ficaram para depois.
