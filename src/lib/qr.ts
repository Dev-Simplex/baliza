import QRCode from "qrcode";

/**
 * QR Code de um link, sempre gerado no SERVIDOR.
 *
 * Gerar no cliente parecia natural — o link só existe depois que a ação
 * responde —, mas custava um modo de falha invisível: quando a promessa do
 * `qrcode` era rejeitada no navegador, o estado voltava a vazio e a tela ficava
 * dizendo "Gerando…" para sempre, um rótulo que mente. Aqui o QR chega junto
 * com o link, sem estado intermediário para dar errado.
 *
 * Devolve `null` em vez de propagar o erro: o QR é a terceira via de acesso, e
 * perder a página inteira (ou o cadastro do candidato) porque um desenho falhou
 * seria trocar um problema pequeno por um grande. Quem chama mostra o link e o
 * código, que continuam valendo.
 */
export async function gerarQr(texto: string): Promise<string | null> {
  try {
    return await QRCode.toDataURL(texto, {
      width: 440,
      margin: 1,
      // A mesma paleta em todo QR do produto: tinta do texto sobre branco puro,
      // porque o leitor precisa de contraste alto e o papel impresso é branco.
      color: { dark: "#0b0e14", light: "#ffffff" },
    });
  } catch {
    return null;
  }
}
