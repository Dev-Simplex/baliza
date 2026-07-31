import type { Metadata } from "next";

import { AvisoJuridico, Secao } from "@/components/site/texto-legal";

export const metadata: Metadata = { title: "Termos de uso" };

export default function PaginaDeTermos() {
  return (
    <article>
      <p className="etiqueta">Termos</p>
      <h1 className="t-titulo mt-3">Termos de uso</h1>
      <p className="t-corpo mt-4 text-muted-foreground">
        As regras abaixo descrevem o que o produto é, o que ele não é e o que se
        espera de quem o usa.
      </p>

      <AvisoJuridico />

      <Secao titulo="O que este serviço é">
        <p>
          Um questionário de <strong>autopercepção de comportamento no trabalho</strong>,
          construído com itens de domínio público, que devolve um perfil
          descritivo e um índice de aderência a um perfil-alvo de vaga.
        </p>
      </Secao>

      <Secao titulo="O que este serviço não é">
        <p>
          Não é teste psicológico, avaliação psicológica, laudo ou diagnóstico.
          Não mede inteligência, capacidade técnica nem caráter.
        </p>
        <p>
          No Brasil, a aplicação de testes psicológicos é atividade privativa de
          psicólogo. Este produto foi desenhado, no instrumento e no vocabulário,
          para ficar fora desse território — e não substitui o trabalho de um
          profissional habilitado.
        </p>
      </Secao>

      <Secao titulo="Uso responsável — a obrigação de quem contrata">
        <p>
          O resultado é <strong>insumo para a entrevista</strong>. Usá-lo como
          critério único de seleção contraria a finalidade do produto e a
          orientação do próprio Conselho Federal de Psicologia sobre instrumento
          único decisivo.
        </p>
        <p>
          O sistema ordena candidatos e explica o porquê de cada posição. Ele não
          elimina ninguém, e não oferece nem vai oferecer funcionalidade de corte
          automático por nota.
        </p>
      </Secao>

      <Secao titulo="Conta e acesso">
        <p>
          A empresa é responsável pelas credenciais dos seus usuários e pelo que
          é feito com elas. Cada conta enxerga apenas os próprios dados.
        </p>
        <p>
          Podemos suspender contas que usem o serviço para discriminar
          candidatos, coletar dados sensíveis por fora do instrumento ou
          contornar as regras desta seção.
        </p>
      </Secao>

      <Secao titulo="Limites do plano">
        <p>
          Cada plano define teto de vagas ativas, respostas por mês e usuários.
          Ao atingir o teto, novas respostas são recusadas com aviso — nada é
          apagado nem cobrado sem contratação.
        </p>
      </Secao>

      <Secao titulo="Disponibilidade e limitação">
        <p>
          O serviço é fornecido no estado em que se encontra. Trabalhamos para
          mantê-lo disponível e correto, sem garantir ausência de interrupção.
        </p>
        <p>
          A decisão de contratar é sempre de quem contrata. Não respondemos por
          decisões tomadas com base no resultado, especialmente quando ele for
          usado fora do propósito descrito acima.
        </p>
      </Secao>
    </article>
  );
}
