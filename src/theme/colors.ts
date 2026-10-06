/**
 * Paleta de cores centralizada do app.
 *
 * `marcaAzul`/`marcaAzulEscuro`/`marcaAzulClaro` foram estimadas visualmente
 * a partir do site institucional da Gerence Sistemas (fundo azul-marinho
 * escuro, azul vibrante nos botões de destaque) — não são os hex exatos da
 * marca. Ajuste esses três valores quando houver um guia de marca oficial;
 * como todo o app referencia `cores.primaria` (que aponta para
 * `marcaAzul`) em vez de repetir hex soltos, a troca é feita em um só lugar.
 *
 * `primaria` já coincide com o azul usado no app antes desta paleta existir
 * — a centralização não mudou a aparência atual, só tirou os hex repetidos
 * dos componentes.
 */

const marcaAzulEscuro = '#0B1830';
const marcaAzul = '#1F6FEB';
const marcaAzulClaro = '#4C8DFF';

export const cores = {
  // Marca (Gerence Sistemas) — ver nota acima.
  marcaAzulEscuro,
  marcaAzul,
  marcaAzulClaro,

  // Barra de abas: fundo azul-marinho da marca, aba selecionada em azul
  // claro, abas inativas em um azul acinzentado (legível sobre o fundo
  // escuro sem competir com a cor de destaque).
  tabFundo: marcaAzulEscuro,
  tabAtivo: marcaAzulClaro,
  tabInativo: '#8CA0C4',

  // Ações / variantes de botão
  primaria: marcaAzul,
  primariaTexto: '#FFFFFF',
  secundaria: '#E7ECF3',
  secundariaTexto: '#0B1220',
  perigo: '#D64545',
  perigoTexto: '#FFFFFF',

  // Status / feedback
  sucesso: '#1B8A4A',
  aviso: '#B98900',

  // Superfícies
  fundo: '#F3F6FA',
  superficie: '#FFFFFF',
  borda: '#E7ECF3',
  bordaForte: '#C7D0DC',
  divisor: '#EEF1F5',
  handleBottomSheet: '#D7DEE8',

  // Texto
  texto: '#0B1220',
  textoSecundario: '#4B5768',
  textoPlaceholder: '#8A93A3',

  // Utilitárias
  branco: '#FFFFFF',
  preto: '#000000',
};
