"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type VagaDoPrumo = { nome: string; fit: number; rotulo: string };

/* ─── Paleta ────────────────────────────────────────────────────────────── */

const TINTA = "#E8E6E3";
const TINTA_FRACA = "rgba(232,230,227,0.45)";
const TEXTO = "rgba(232,230,227,0.55)";
const COBRE = "#BC6C32";
const COBRE_ESCURO = "#8A4E24";
const FIO = "rgba(232,230,227,0.18)";

/* ─── Física ────────────────────────────────────────────────────────────── */

/**
 * Por que um pêndulo integrado e não `Math.sin(tempo)`.
 *
 * O atalho do seno é uma oscilação perfeita, eterna e de amplitude fixa: ela
 * não tem inércia, não responde a empurrão e não sabe voltar ao repouso. Um
 * prumo que balança assim parece um GIF. O que a peça precisa transmitir é
 * PESO — que o objeto resiste a começar a se mover e resiste a parar. Isso só
 * existe se a aceleração for calculada a cada passo a partir do estado atual,
 * porque é daí que sai o overshoot ao trocar de referência e o retorno
 * assimétrico depois que o ponteiro solta. Então: integração de verdade.
 *
 *   α = −(g/L)·sen(θ − θ_repouso) − c·ω + torque_do_ponteiro
 *
 * O `sen` fica: com ângulo pequeno ele quase empata com a aproximação linear,
 * mas quando o ponteiro arrasta o peso para longe a diferença aparece como
 * uma leve "preguiça" no topo do arco, que é exatamente o que dá corpo.
 */
const G = 9.81;

/**
 * Comprimento FÍSICO do fio (metros), separado do comprimento em pixels de
 * propósito. Se o período viesse do tamanho da tela, o mesmo prumo balançaria
 * lento no desktop e rápido no celular — o objeto pareceria outro. Mantendo L
 * fixo, o período é sempre o mesmo (T = 2π√(L/g) ≈ 2,15 s): um balanço
 * pausado, de coisa pesada, que ainda cabe confortavelmente dentro dos 4,5 s
 * de cada vaga.
 */
const COMPRIMENTO_FISICO = 1.15;

/**
 * Amortecimento. ω₀ = √(g/L) ≈ 2,92 rad/s, então ζ = c/(2ω₀) ≈ 0,15 — bem
 * subamortecido. Escolhido por tentativa contra dois extremos ruins: acima de
 * ~0,35 o peso "cola" no lugar novo sem passar do ponto e a troca de vaga fica
 * sem drama; abaixo de ~0,08 ele ainda está tremendo quando a próxima vaga
 * entra e a leitura nunca acalma. Com 0,9 a envoltória cai a ~13% em 4,5 s:
 * dá dois ou três vaivéns visíveis e sobra silêncio antes da troca.
 */
const AMORTECIMENTO = 0.9;

/**
 * Passo fixo de 1/120 s com acumulador. Integrar com o Δt do rAF faria a
 * física mudar conforme o FPS — a mesma cena com energias diferentes em 60 Hz
 * e 144 Hz. O acumulador é limitado a 0,25 s porque, ao voltar de uma aba
 * parada, um Δt de vários segundos viraria centenas de passos de uma vez
 * (trava a thread e cospe o pêndulo para fora da tela).
 */
const PASSO = 1 / 120;
const ACUMULADOR_MAXIMO = 0.25;

/** Força do ponteiro e o raio onde ela ainda existe. */
const FORCA_PONTEIRO = 12;
const RAIO_PONTEIRO = 200;

/** Inclinação máxima de repouso: ~17°, o bastante para ler sem virar piada. */
const INCLINACAO_MAXIMA = 0.3;

/** Ritmo da narrativa. */
const TROCA_DE_VAGA = 4.5;
const MIGRACAO_DO_REPOUSO = 1.6; // 1/s → o repouso leva ~0,6 s para migrar
const INICIO_DA_SAIDA = 3.6; // texto começa a sumir bem antes da próxima troca
/**
 * Quanto o peso precisa sair do repouso para a leitura se considerar
 * atrapalhada. Bem acima da oscilação residual (que sozinha faria o texto
 * piscar durante a acomodação) e bem abaixo de um arrasto deliberado — só o
 * ponteiro chega aqui.
 */
const PERTURBACAO = 0.12;
const TROCA_SEM_MOVIMENTO = 6000; // ms, no modo prefers-reduced-motion

/* ─── Geometria ─────────────────────────────────────────────────────────── */

const LARGURA_PESO = 34;
const ALTURA_PESO = 72;
const ALTURA_COLAR = 11;
const PARTICULAS = 40;

type Particula = { x: number; y: number; vx: number; vy: number; a: number };

/**
 * O ângulo de repouso de cada vaga.
 *
 * Fit alto = quase no prumo; fit baixo = torto. O lado alterna com o índice
 * porque a ideia da peça é "a referência mudou, não a pessoa": jogar o repouso
 * para o outro lado torna a troca de referencial fisicamente visível mesmo
 * entre duas vagas de fit parecido.
 */
function anguloDaVaga(vaga: VagaDoPrumo, indice: number): number {
  const desvio = 1 - Math.min(100, Math.max(0, vaga.fit)) / 100;
  return (indice % 2 === 0 ? -1 : 1) * INCLINACAO_MAXIMA * desvio;
}

/**
 * O prumo de pedreiro digital.
 *
 * Um único peso, sempre o mesmo objeto, trocando de ponto de equilíbrio a cada
 * vaga. É a tese do produto em movimento: a pessoa não mudou entre uma vaga e
 * outra — o que mudou foi a linha contra a qual ela está sendo medida.
 *
 * Preenche o pai (que precisa ser `position: relative`) e não pinta fundo:
 * o preto é da página, o canvas só põe luz em cima.
 */
export function PrumoInterativo({
  vagas,
  className,
}: {
  vagas: VagaDoPrumo[];
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // O array costuma chegar como literal inline, ou seja, com identidade nova a
  // cada render do pai. Reiniciar a simulação por causa disso jogaria o peso
  // de volta ao repouso sem motivo, então o efeito depende do CONTEÚDO.
  const assinatura = vagas.map((v) => `${v.nome}:${v.fit}:${v.rotulo}`).join("|");
  const vagasRef = useRef(vagas);
  useEffect(() => {
    vagasRef.current = vagas;
  });

  // matchMedia direto em vez do hook da motion: aqui o valor não decora um
  // componente, ele decide se existe loop de animação — e precisa ser booleano
  // desde o primeiro efeito, sem o `null` de hidratação.
  const [semMovimento, setSemMovimento] = useState(false);
  useEffect(() => {
    const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");
    const aplicar = () => setSemMovimento(consulta.matches);
    aplicar();
    consulta.addEventListener("change", aplicar);
    return () => consulta.removeEventListener("change", aplicar);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const lista = vagasRef.current;

    /* ── Dimensões e retina ───────────────────────────────────────────── */

    let largura = 0;
    let altura = 0;
    const particulas: Particula[] = [];

    const medir = () => {
      const caixa = canvas.getBoundingClientRect();
      const anterior = { largura, altura };
      largura = Math.max(1, caixa.width);
      altura = Math.max(1, caixa.height);

      // Teto de 2 no DPR: acima disso o ganho é invisível e o custo de
      // preenchimento é real em telas grandes de celular.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(largura * dpr);
      canvas.height = Math.round(altura * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (particulas.length === 0) {
        for (let i = 0; i < PARTICULAS; i += 1) {
          particulas.push({
            x: Math.random() * largura,
            y: Math.random() * altura,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            a: 0.04 + Math.random() * 0.1,
          });
        }
      } else if (anterior.largura > 0 && anterior.altura > 0) {
        // Reposicionar proporcionalmente em vez de re-sortear: re-sortear
        // faria a poeira "piscar" de lugar a cada resize do navegador.
        const fx = largura / anterior.largura;
        const fy = altura / anterior.altura;
        for (const p of particulas) {
          p.x *= fx;
          p.y *= fy;
        }
      }
    };

    /* ── Estado da simulação ──────────────────────────────────────────── */

    // Começa no prumo — vertical, parado — e com o repouso da primeira vaga já
    // como alvo. Assim a entrada da peça é a própria tese acontecendo: o objeto
    // estava aprumado e é a referência que chega e o desloca.
    let angulo = 0; // θ, rad, medido a partir da vertical
    let velocidade = 0; // ω, rad/s
    let repouso = 0;
    let repousoAlvo = lista.length > 0 ? anguloDaVaga(lista[0], 0) : 0;
    let indice = 0;
    let relogioDaVaga = 0;
    let opacidadeDoTexto = 0;
    let textoLiberado = false;

    let ponteiroX = Number.NaN;
    let ponteiroY = Number.NaN;

    /* ── Geometria derivada ───────────────────────────────────────────── */

    const geometria = () => {
      const pivoX = largura / 2;
      const comprimento = Math.max(
        70,
        Math.min(altura * 0.5, altura - ALTURA_PESO - 58),
      );
      return { pivoX, comprimento };
    };

    /* ── Desenho ──────────────────────────────────────────────────────── */

    const desenharParticulas = (dt: number) => {
      ctx.save();
      for (const p of particulas) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < 0) p.x += largura;
        if (p.x > largura) p.x -= largura;
        if (p.y < 0) p.y += altura;
        if (p.y > altura) p.y -= altura;
        ctx.fillStyle = `rgba(232,230,227,${p.a})`;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
      }
      ctx.restore();
    };

    /**
     * O "chão" abaixo da ponta. Sombra preta em fundo preto não aparece, então
     * o apoio é sugerido por um halo de luz cobre, não por escuro. Ele abre e
     * enfraquece conforme o peso se afasta da vertical — é assim que sombra de
     * objeto suspenso se comporta quando a fonte de luz fica parada.
     */
    const desenharHalo = (x: number, y: number, inclinacao: number) => {
      const abertura = 1 + Math.min(1, Math.abs(inclinacao) / 0.5) * 0.35;
      const forca = 0.13 * (1 - Math.min(1, Math.abs(inclinacao) / 0.5) * 0.5);
      const raio = 46 * abertura;

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, 0.15);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, raio);
      grad.addColorStop(0, `rgba(188,108,50,${forca})`);
      grad.addColorStop(0.55, `rgba(188,108,50,${forca * 0.35})`);
      grad.addColorStop(1, "rgba(188,108,50,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, raio, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    /**
     * O fio. Não é uma reta: o topo já está no ângulo novo enquanto a ponta
     * ainda está atrasada, então a corda arqueia contra o sentido da
     * velocidade. É um detalhe de um pixel que decide se a coisa parece um
     * barbante ou um vetor desenhado.
     */
    const desenharFio = (
      pivoX: number,
      fimX: number,
      fimY: number,
      omega: number,
    ) => {
      const atraso = Math.max(-14, Math.min(14, -omega * 6));
      ctx.save();
      ctx.strokeStyle = FIO;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pivoX, 0);
      ctx.quadraticCurveTo(
        (pivoX + fimX) / 2 + atraso,
        fimY / 2,
        fimX,
        fimY,
      );
      ctx.stroke();

      // O ponto de fixação no topo, para o fio não nascer do nada.
      ctx.fillStyle = TINTA_FRACA;
      ctx.fillRect(pivoX - 1.5, 0, 3, 2);
      ctx.restore();
    };

    /**
     * O peso. Cone com barriga, colar de cobre no topo, ponta polida embaixo.
     *
     * O que faz parecer metal e não um triângulo chapado são três coisas, nesta
     * ordem de importância: (1) o gradiente atravessa a peça PERPENDICULAR à
     * luz, com a aresta clara logo depois da borda escura de contorno — não do
     * centro para fora; (2) existe luz de rebote na quina oposta, senão o lado
     * escuro fica morto e a peça vira plástico; (3) o especular é estreito e
     * some antes da ponta. Sem os três, é só um degradê.
     */
    const desenharPeso = (x: number, y: number, inclinacao: number) => {
      const meia = LARGURA_PESO / 2;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(inclinacao); // o peso pende alinhado ao fio, não à tela

      const corpo = new Path2D();
      corpo.moveTo(-meia, ALTURA_COLAR);
      corpo.lineTo(meia, ALTURA_COLAR);
      corpo.quadraticCurveTo(meia * 0.82, ALTURA_PESO * 0.5, 0, ALTURA_PESO);
      corpo.quadraticCurveTo(-meia * 0.82, ALTURA_PESO * 0.5, -meia, ALTURA_COLAR);
      corpo.closePath();

      const aco = ctx.createLinearGradient(
        -meia,
        ALTURA_COLAR * 0.4,
        meia,
        ALTURA_PESO * 0.42,
      );
      aco.addColorStop(0, "#26241f");
      aco.addColorStop(0.1, "#a7a29a");
      aco.addColorStop(0.22, "#7b766d");
      aco.addColorStop(0.42, "#514c45");
      aco.addColorStop(0.68, "#332f2b");
      aco.addColorStop(0.86, "#211f1c");
      aco.addColorStop(1, "#4a443d");
      ctx.fillStyle = aco;
      ctx.fill(corpo);

      // Especular: fatia estreita no terço iluminado, apagando antes da ponta.
      ctx.save();
      ctx.clip(corpo);
      const brilho = ctx.createLinearGradient(0, ALTURA_COLAR, 0, ALTURA_PESO);
      brilho.addColorStop(0, "rgba(232,230,227,0.72)");
      brilho.addColorStop(0.45, "rgba(232,230,227,0.22)");
      brilho.addColorStop(1, "rgba(232,230,227,0)");
      ctx.fillStyle = brilho;
      ctx.beginPath();
      ctx.moveTo(-meia * 0.66, ALTURA_COLAR + 2);
      ctx.lineTo(-meia * 0.4, ALTURA_COLAR + 2);
      ctx.lineTo(-1.5, ALTURA_PESO * 0.88);
      ctx.lineTo(-3.5, ALTURA_PESO * 0.88);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Aresta iluminada (esquerda) e aresta de sombra (direita).
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(232,230,227,0.45)";
      ctx.beginPath();
      ctx.moveTo(-meia, ALTURA_COLAR);
      ctx.quadraticCurveTo(-meia * 0.82, ALTURA_PESO * 0.5, 0, ALTURA_PESO);
      ctx.stroke();

      ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.beginPath();
      ctx.moveTo(meia, ALTURA_COLAR);
      ctx.quadraticCurveTo(meia * 0.82, ALTURA_PESO * 0.5, 0, ALTURA_PESO);
      ctx.stroke();

      // Colar de cobre: mesma lógica de luz do corpo, cores da paleta.
      const colar = new Path2D();
      colar.moveTo(-meia * 0.84, 0);
      colar.lineTo(meia * 0.84, 0);
      colar.lineTo(meia, ALTURA_COLAR);
      colar.lineTo(-meia, ALTURA_COLAR);
      colar.closePath();

      const cobre = ctx.createLinearGradient(-meia, 0, meia, ALTURA_COLAR);
      cobre.addColorStop(0, COBRE_ESCURO);
      cobre.addColorStop(0.16, COBRE);
      cobre.addColorStop(0.45, "#9d5a2a");
      cobre.addColorStop(0.82, "#5e3418");
      cobre.addColorStop(1, "#7a4520");
      ctx.fillStyle = cobre;
      ctx.fill(colar);

      ctx.fillStyle = "rgba(232,230,227,0.3)";
      ctx.fillRect(-meia * 0.84, 0, meia * 1.68, 1);
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(-meia, ALTURA_COLAR - 1, meia * 2, 1);

      // A ponta polida. É o pixel que o olho procura para saber onde o prumo
      // está apontando, então é o único ponto da peça que recebe a tinta cheia
      // — todo o resto do metal vive em cinzas abaixo dela.
      ctx.fillStyle = "rgba(232,230,227,0.22)";
      ctx.beginPath();
      ctx.arc(0, ALTURA_PESO - 1, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = TINTA;
      ctx.beginPath();
      ctx.arc(0, ALTURA_PESO - 1, 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const familiaMono = () => {
      const declarada = getComputedStyle(canvas)
        .getPropertyValue("--fonte-mono")
        .trim();
      return declarada ? `${declarada}, monospace` : "monospace";
    };

    const desenharLeitura = (
      pesoX: number,
      pesoY: number,
      opacidade: number,
      vaga: VagaDoPrumo | undefined,
    ) => {
      if (!vaga || opacidade <= 0.01) return;

      const mono = familiaMono();
      const linhas = [
        `VACANCY / ${vaga.nome.toUpperCase()}`,
        `FIT / ${Math.round(vaga.fit)}%`,
        vaga.rotulo,
      ];

      ctx.save();
      ctx.font = `10px ${mono}`;
      ctx.textBaseline = "middle";

      const larguraMaior = Math.max(...linhas.map((l) => ctx.measureText(l).width));
      const folga = LARGURA_PESO / 2 + 22;

      /* Três posições, e não duas.

         A troca de lado resolve a borda no desktop. No celular ela não resolve
         nada: a legenda é mais larga que meia tela, então NENHUM dos dois lados
         cabe — e a versão anterior escolhia a esquerda e imprimia
         "/ DESENVOLVEDOR FRONT-END" com o "VACANCY" cortado fora da tela.
         Visto num iPhone de 390px.

         Não cabendo de lado nenhum, o texto desce para baixo do peso e
         centraliza. Perde a leitura de etiqueta lateral e mantém a de legenda,
         que é a que sobrevive em tela estreita. */
      const cabeADireita = pesoX + folga + larguraMaior < largura - 12;
      const cabeAEsquerda = pesoX - folga - larguraMaior > 12;
      const embaixo = !cabeADireita && !cabeAEsquerda;

      const x = embaixo ? pesoX : cabeADireita ? pesoX + folga : pesoX - folga;
      ctx.textAlign = embaixo ? "center" : cabeADireita ? "left" : "right";

      const y = embaixo
        ? pesoY + ALTURA_PESO * 0.5 + 44
        : pesoY + ALTURA_PESO * 0.42;
      const entrelinha = 15;
      ctx.globalAlpha = opacidade;

      ctx.fillStyle = TEXTO;
      ctx.fillText(linhas[0], x, y - entrelinha);

      // Segunda linha em duas cores: o número é o dado, e o dado é cobre.
      const rotuloFit = "FIT / ";
      const valorFit = `${Math.round(vaga.fit)}%`;
      const larguraRotulo = ctx.measureText(rotuloFit).width;
      const larguraValor = ctx.measureText(valorFit).width;
      if (embaixo) {
        /* Centralizado, o par tem de ser tratado como UM bloco.
           Com `textAlign: "center"`, desenhar "FIT / " e "94%" no mesmo x
           centraliza cada pedaço separadamente — os dois saem empilhados um
           sobre o outro. Aqui o alinhamento vira `left` só para esta linha, e o
           início é calculado a partir da largura somada. */
        const inicio = x - (larguraRotulo + larguraValor) / 2;
        ctx.textAlign = "left";
        ctx.fillStyle = TEXTO;
        ctx.fillText(rotuloFit, inicio, y);
        ctx.fillStyle = COBRE;
        ctx.fillText(valorFit, inicio + larguraRotulo, y);
        ctx.textAlign = "center";
      } else if (cabeADireita) {
        ctx.fillStyle = TEXTO;
        ctx.fillText(rotuloFit, x, y);
        ctx.fillStyle = COBRE;
        ctx.fillText(valorFit, x + larguraRotulo, y);
      } else {
        ctx.fillStyle = COBRE;
        ctx.fillText(valorFit, x, y);
        ctx.fillStyle = TEXTO;
        ctx.fillText(rotuloFit, x - larguraValor, y);
      }

      // O rótulo é a glosa da linha de cima, então entra abaixo do texto base
      // na hierarquia — mesma família, menos presença.
      ctx.fillStyle = "rgba(232,230,227,0.42)";
      ctx.fillText(linhas[2], x, y + entrelinha);

      // Um tique de cobre alinhado à leitura, ancorando o bloco ao peso.
      ctx.globalAlpha = opacidade * 0.8;
      ctx.fillStyle = COBRE_ESCURO;
      const tique = cabeADireita ? x - 10 : x + 10;
      ctx.fillRect(tique - (cabeADireita ? 0 : 1), y - entrelinha - 6, 1, entrelinha * 2 + 12);

      ctx.restore();
    };

    const pintar = (dtVisual: number) => {
      const { pivoX, comprimento } = geometria();
      const pesoX = pivoX + Math.sin(angulo) * comprimento;
      const pesoY = Math.cos(angulo) * comprimento;

      ctx.clearRect(0, 0, largura, altura);
      desenharParticulas(dtVisual);
      desenharHalo(
        pivoX + Math.sin(angulo) * (comprimento + ALTURA_PESO),
        pesoY + ALTURA_PESO + 24,
        angulo,
      );
      desenharFio(pivoX, pesoX, pesoY, velocidade);
      desenharPeso(pesoX, pesoY, angulo);
      desenharLeitura(pesoX, pesoY, opacidadeDoTexto, lista[indice]);
    };

    /* ── Modo sem movimento ───────────────────────────────────────────── */

    if (semMovimento) {
      // Sem rAF nenhum: quem pediu redução de movimento não deve pagar por um
      // loop de animação que só desenha o mesmo quadro. O prumo fica no lugar
      // dele — na vertical, que é justamente o que um prumo faz — e a única
      // coisa que muda é qual vaga está escrita ao lado.
      angulo = 0;
      velocidade = 0;
      opacidadeDoTexto = 1;

      const redesenhar = () => {
        medir();
        pintar(0);
      };

      redesenhar();
      // A fonte mono pode não estar pronta no primeiro quadro; como aqui só há
      // um desenho, sem isso o texto ficaria com a métrica da fonte de sistema.
      void document.fonts?.ready.then(redesenhar);

      const observador = new ResizeObserver(redesenhar);
      observador.observe(canvas);
      window.addEventListener("resize", redesenhar);

      const ciclo =
        lista.length > 1
          ? window.setInterval(() => {
              indice = (indice + 1) % lista.length;
              pintar(0);
            }, TROCA_SEM_MOVIMENTO)
          : undefined;

      return () => {
        observador.disconnect();
        window.removeEventListener("resize", redesenhar);
        if (ciclo !== undefined) window.clearInterval(ciclo);
      };
    }

    /* ── Simulação ────────────────────────────────────────────────────── */

    const passoFisico = (dt: number) => {
      const { pivoX, comprimento } = geometria();

      // O repouso migra suavemente para a vaga da vez. Se ele saltasse, o
      // pêndulo receberia um degrau e chicotearia; migrando em ~0,6 s o peso
      // é ARRASTADO até o novo equilíbrio — e é esse arrasto, com o overshoot
      // no fim, que conta a história de "a referência se moveu".
      repouso += (repousoAlvo - repouso) * (1 - Math.exp(-MIGRACAO_DO_REPOUSO * dt));

      let aceleracao =
        -(G / COMPRIMENTO_FISICO) * Math.sin(angulo - repouso) -
        AMORTECIMENTO * velocidade;

      // Ponteiro: torque que puxa o peso na direção do cursor, com força que
      // cai a zero no raio. Atração e não repulsão porque o gesto que a peça
      // pede é "pegar o prumo e soltar" — repelir daria a impressão de que o
      // objeto foge de quem chega perto, o oposto da leitura pretendida.
      if (!Number.isNaN(ponteiroX)) {
        const pesoX = pivoX + Math.sin(angulo) * comprimento;
        const pesoY = Math.cos(angulo) * comprimento + ALTURA_PESO * 0.5;
        const distancia = Math.hypot(ponteiroX - pesoX, ponteiroY - pesoY);
        if (distancia < RAIO_PONTEIRO) {
          const bruto = 1 - distancia / RAIO_PONTEIRO;
          const influencia = bruto * bruto * (3 - 2 * bruto); // suaviza a borda
          const anguloDoPonteiro = Math.atan2(ponteiroX - pivoX, Math.max(1, ponteiroY));
          aceleracao +=
            FORCA_PONTEIRO * influencia * Math.sin(anguloDoPonteiro - angulo);
        }
      }

      velocidade += aceleracao * dt;
      angulo += velocidade * dt;
    };

    const passoNarrativo = (dt: number) => {
      if (lista.length === 0) return;
      relogioDaVaga += dt;

      if (relogioDaVaga >= TROCA_DE_VAGA) {
        relogioDaVaga -= TROCA_DE_VAGA;
        indice = (indice + 1) % lista.length;
        repousoAlvo = anguloDaVaga(lista[indice], indice);
        textoLiberado = false;
      }

      // O texto não entra por cronômetro, entra quando o peso ACOMODA — a
      // leitura só aparece depois que o prumo respondeu à nova referência.
      //
      // Mas "acomodado" sozinho pisca duas vezes, e as duas foram medidas
      // antes de virar código: (1) logo após a troca o repouso ainda não
      // migrou, então o peso está tecnicamente parado — só que no equilíbrio
      // VELHO, e o texto novo aparecia por ~0,25 s antes de sumir; (2) na
      // cauda da oscilação a velocidade cruza o limiar para os dois lados e o
      // texto tremia. Daí a trava por vaga (só libera uma vez, depois que o
      // repouso terminou de migrar) e a histerese: uma vez visível, só sai por
      // perturbação de verdade — ou seja, pelo ponteiro — ou na hora da saída.
      const repousoChegou = Math.abs(repousoAlvo - repouso) < 0.01;
      const acomodado =
        Math.abs(angulo - repouso) < 0.035 && Math.abs(velocidade) < 0.22;
      if (!textoLiberado && repousoChegou && acomodado) textoLiberado = true;
      else if (textoLiberado && Math.abs(angulo - repouso) > PERTURBACAO)
        textoLiberado = false;

      const alvo = textoLiberado && relogioDaVaga < INICIO_DA_SAIDA ? 1 : 0;
      opacidadeDoTexto += (alvo - opacidadeDoTexto) * (1 - Math.exp(-4 * dt));
    };

    /* ── Laço ─────────────────────────────────────────────────────────── */

    let quadro = 0;
    let ultimo = 0;
    let acumulador = 0;
    let naTela = true;
    let rodando = false;

    const laco = (agora: number) => {
      quadro = requestAnimationFrame(laco);
      const dt = ultimo === 0 ? PASSO : (agora - ultimo) / 1000;
      ultimo = agora;

      acumulador = Math.min(acumulador + dt, ACUMULADOR_MAXIMO);
      while (acumulador >= PASSO) {
        passoFisico(PASSO);
        passoNarrativo(PASSO);
        acumulador -= PASSO;
      }

      pintar(Math.min(dt, 0.05));
    };

    const ligar = () => {
      if (rodando) return;
      rodando = true;
      ultimo = 0; // zera o relógio: sem isso o primeiro dt seria o tempo parado
      acumulador = 0;
      quadro = requestAnimationFrame(laco);
    };

    const desligar = () => {
      if (!rodando) return;
      rodando = false;
      cancelAnimationFrame(quadro);
    };

    // Duas razões independentes para parar, e as duas importam: aba escondida
    // (o rAF costuma ser estrangulado, mas em alguns casos segue rodando e
    // queima bateria à toa) e canvas fora da viewport (rolar a página para
    // longe do herói não deveria custar CPU nenhuma).
    const reavaliar = () => {
      if (naTela && !document.hidden) ligar();
      else desligar();
    };

    const observadorDeTela = new IntersectionObserver(
      (entradas) => {
        naTela = entradas.some((e) => e.isIntersecting);
        reavaliar();
      },
      { threshold: 0 },
    );
    observadorDeTela.observe(canvas);

    const aoTrocarVisibilidade = () => reavaliar();
    document.addEventListener("visibilitychange", aoTrocarVisibilidade);

    /* ── Ponteiro ─────────────────────────────────────────────────────── */

    // Ouvir na janela e não no canvas: o elemento é decorativo e fica atrás do
    // conteúdo com pointer-events desligado, então ele nunca receberia eventos
    // — e não pode receber, sob pena de roubar cliques do texto do herói.
    const aoMover = (evento: PointerEvent) => {
      const caixa = canvas.getBoundingClientRect();
      ponteiroX = evento.clientX - caixa.left;
      ponteiroY = evento.clientY - caixa.top;
    };
    const aoSair = () => {
      ponteiroX = Number.NaN;
      ponteiroY = Number.NaN;
    };

    window.addEventListener("pointermove", aoMover, { passive: true });
    window.addEventListener("pointerup", aoSair, { passive: true });
    window.addEventListener("pointercancel", aoSair, { passive: true });
    document.addEventListener("pointerleave", aoSair);

    /* ── Tamanho ──────────────────────────────────────────────────────── */

    const observadorDeTamanho = new ResizeObserver(medir);
    observadorDeTamanho.observe(canvas);
    // O ResizeObserver não dispara quando só o devicePixelRatio muda (zoom ou
    // troca de monitor), e aí o canvas fica borrado até o próximo resize real.
    window.addEventListener("resize", medir);

    medir();
    reavaliar();

    return () => {
      desligar();
      observadorDeTela.disconnect();
      observadorDeTamanho.disconnect();
      document.removeEventListener("visibilitychange", aoTrocarVisibilidade);
      window.removeEventListener("resize", medir);
      window.removeEventListener("pointermove", aoMover);
      window.removeEventListener("pointerup", aoSair);
      window.removeEventListener("pointercancel", aoSair);
      document.removeEventListener("pointerleave", aoSair);
    };
  }, [assinatura, semMovimento]);

  return (
    <div className={cn("pointer-events-none absolute inset-0", className)}>
      <canvas ref={canvasRef} aria-hidden className="block h-full w-full" />

      {/* O canvas é enfeite; o conteúdo é este. Leitor de tela recebe as vagas
          em texto corrido, sem depender de nada que só existe pintado. */}
      <div className="sr-only">
        {vagas.map((vaga, i) => (
          <p key={`${vaga.nome}-${i}`}>
            Vaga {vaga.nome}: aderência de {Math.round(vaga.fit)} por cento,{" "}
            {vaga.rotulo}.
          </p>
        ))}
      </div>
    </div>
  );
}
