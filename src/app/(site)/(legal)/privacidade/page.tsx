import type { Metadata } from "next";

import { AvisoJuridico, Secao } from "@/components/site/texto-legal";

export const metadata: Metadata = { title: "Privacidade" };

export default function PaginaDePrivacidade() {
  return (
    <article>
      <p className="etiqueta">Privacidade</p>
      <h1 className="t-titulo mt-3">Como tratamos os dados de quem responde</h1>
      <p className="t-corpo mt-4 text-muted-foreground">
        Este texto descreve o que o sistema faz de fato — não o que seria
        conveniente prometer. Cada afirmação abaixo corresponde a um
        comportamento implementado.
      </p>

      <AvisoJuridico />

      <Secao titulo="O que coletamos">
        <p>
          Do candidato: <strong>nome, e-mail e as respostas ao questionário</strong>.
          Registramos também o tempo gasto por item, porque ele alimenta o índice
          de confiança, e um identificador derivado do endereço IP, guardado
          apenas como resumo criptográfico para limitar abuso.
        </p>
        <p>
          Da empresa: nome, dados de acesso dos usuários e o conteúdo das vagas
          que ela cria.
        </p>
      </Secao>

      <Secao titulo="O que não coletamos, em nenhuma etapa">
        <p>
          Nenhum dado sensível na acepção do art. 5º, II da LGPD: origem racial
          ou étnica, convicção religiosa, opinião política, filiação sindical,
          dados de saúde, vida sexual, genéticos ou biométricos.
        </p>
        <p>
          Nenhum item do questionário toca nesses assuntos, nem de forma
          indireta. Também não medimos capacidade cognitiva — decisão permanente
          de projeto, tomada porque esse tipo de medida produz impacto adverso
          documentado.
        </p>
      </Secao>

      <Secao titulo="Para que usamos">
        <p>
          Exclusivamente para calcular a aderência do candidato ao perfil-alvo da
          vaga a que ele se candidatou, e para gerar o relatório que a empresa e
          o próprio candidato recebem.
        </p>
        <p>
          Respostas entram, de forma agregada e anônima, no cálculo de normas
          usadas para comparação estatística. Nunca de forma identificável.
        </p>
      </Secao>

      <Secao titulo="Quem vê">
        <p>
          A empresa que publicou a vaga vê o resultado do candidato que respondeu
          àquela vaga. Nenhuma empresa vê dado de outra: o isolamento é aplicado
          em cada consulta ao banco, não por filtro de tela.
        </p>
        <p>
          O candidato <strong>não</strong> vê o resultado nem as respostas
          registradas por conta própria: quem aplicou o teste é quem conduz a
          devolutiva. Isso não retira dele nenhum direito — muda o caminho, que
          passa a ser o pedido descrito em <em>Direitos do titular</em>, abaixo.
        </p>
      </Secao>

      <Secao titulo="Por quanto tempo">
        <p>
          As respostas brutas ficam guardadas pelo prazo definido pela empresa,
          que por padrão é de <strong>12 meses</strong>, e depois são apagadas.
          A leitura consolidada continua, porque é dela que a empresa precisa
          para responder a um pedido de acesso feito depois desse prazo.
        </p>
      </Secao>

      <Secao titulo="Direitos do titular">
        <p>
          O candidato pode pedir acesso, correção ou exclusão dos seus dados a
          qualquer momento, respondendo ao e-mail do convite ou falando com a
          empresa que enviou o link. Esse é o caminho para receber tanto as
          respostas que ele deu quanto a leitura gerada a partir delas, e a
          empresa é quem responde por ele como controladora.
        </p>
        <p>
          Sobre decisão automatizada (art. 20): o resultado é um{" "}
          <strong>insumo</strong>, não uma decisão. O sistema não possui, e não
          vai possuir, funcionalidade de corte automático por nota. Toda
          aderência exibida vem acompanhada das dimensões que a puxaram para cima
          e para baixo, justamente para que a pessoa possa questioná-la.
        </p>
      </Secao>

      <Secao titulo="Segurança">
        <p>
          Senhas são guardadas apenas como hash. O acesso ao painel exige sessão
          autenticada e o escopo por empresa é aplicado no servidor. Operações
          relevantes ficam registradas em trilha de auditoria.
        </p>
      </Secao>
    </article>
  );
}
