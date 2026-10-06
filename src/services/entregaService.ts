import { apiGet, apiPut, CD_EMPRESA, dataDeHojeIso, TP_PEDIDO_ENTREGA } from './api';
import { Entrega, SituacaoEntrega } from './types';

/**
 * Resposta de `GET /PedidoNr` (servidorGerencePlus, uDMNova.fGetPedidoNr /
 * uFuncoesDM.qPedidoNr — consulta em NOTA_VENDA). Todo campo vem como
 * string, mesmo os numéricos.
 *
 * Importante: essa consulta só traz dados financeiros do pedido — não faz
 * JOIN com PESSOAS nem FUNCIONARIO, então não há nome/endereço do cliente
 * nem entregador na resposta. Quando o pedido não é encontrado, o servidor
 * não retorna 404: ele devolve o mesmo formato de objeto com todos os
 * campos vazios (o dataset fica sem registros, mas o código do servidor
 * lê os campos do cursor do mesmo jeito).
 */
type PedidoNrApi = {
  COD_NOTA_VENDA: string;
  ID_CLIENTE: string;
  TP_PEDIDO: string;
  NR_PEDIDO: string;
  DS_DESCRICAO: string;
  TP_SITUACAOPEDIDO: string;
  DS_LOCAL: string;
  DATA_EMISSAO: string;
  HORA_EMISSAO: string;
  VALOR_TOTAL: string;
  VL_PAGAR: string;
  [campo: string]: string | undefined;
};

/**
 * TP_SITUACAOPEDIDO só distingue "pendente" ('P') de outra situação em
 * aberto — a rota filtra para só trazer pedidos em P/L e não cancelados,
 * então qualquer coisa fora de 'P' aqui é tratada como já em rota.
 */
function mapearSituacao(situacao: string): SituacaoEntrega {
  return situacao === 'P' ? 'PENDENTE' : 'EM_ROTA';
}

function mapearPedido(codigo: string, pedido: PedidoNrApi): Entrega {
  return {
    id: pedido.COD_NOTA_VENDA,
    codigo,
    numeroPedido: pedido.NR_PEDIDO,
    // TODO(api): /PedidoNr não traz nome/endereço do cliente (só dados
    // financeiros do pedido) — sem rota própria para isso hoje.
    cliente: `Cliente ${pedido.ID_CLIENTE}`,
    endereco: '',
    situacao: mapearSituacao(pedido.TP_SITUACAOPEDIDO),
  };
}

/**
 * Consulta uma entrega/pedido pelo código lido no código de barras.
 *
 * Usa `GET /PedidoNr`, única rota viva do servidorGerencePlus que busca um
 * pedido por número — não existe rota dedicada para entrega/delivery.
 */
export async function buscarPorCodigo(codigo: string): Promise<Entrega | null> {
  const pedido = await apiGet<PedidoNrApi>('PedidoNr', {
    empresa: CD_EMPRESA,
    data: dataDeHojeIso(),
    numero: codigo,
    tipoPedido: TP_PEDIDO_ENTREGA,
  });

  if (!pedido.NR_PEDIDO) {
    return null;
  }

  return mapearPedido(codigo, pedido);
}

/**
 * Resposta de `GET /pedido/entregador/:id/pedido` (servidorGerencePlus,
 * uDMNova.fListaVendasEntregador / uFuncoesDM.qCEListaVendasEntregador —
 * NOTA_VENDA + JOIN com PESSOAS/FUNCIONARIO). Ao contrário de `/PedidoNr`,
 * já traz nome/endereço do cliente e dados do entregador vinculado.
 */
type VendaEntregadorApi = {
  EMPRESA: string;
  COD_NOTA_VENDA: string;
  DATA_EMISSAO: string;
  NR_PEDIDO: string;
  TP_SITUACAOPEDIDO: string;
  SITUACAO: string;
  VALOR_TOTAL: string;
  NOME_PESSOA: string;
  ENDERECO: string;
  NR_LOGRADOURO: string;
  DS_LATITUDE: string;
  DS_LONGITUDE: string;
  ID_FUNCIONARIO: string;
  NOME_FUNCIONARIO: string;
  [campo: string]: string | undefined;
};

/** PESSOAS.DS_LATITUDE/DS_LONGITUDE vêm vazios quando o cliente não tem coordenada cadastrada. */
function paraNumeroOuUndefined(valor: string | undefined): number | undefined {
  if (!valor) {
    return undefined;
  }
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : undefined;
}

/**
 * Com TP_SITUACAOPEDIDO disponível dá pra distinguir "pendente" (ainda não
 * saiu) de "a caminho" (já vinculado a um entregador, TP_SITUACAOPEDIDO =
 * 'A' — mesmo valor que a rota PUT grava). Fora isso, cai para a situação
 * financeira do pedido (SITUACAO = 'C' cancelado, senão considera entregue).
 */
function mapearSituacaoVenda(tpSituacaoPedido: string, situacao: string): SituacaoEntrega {
  if (tpSituacaoPedido === 'P') {
    return 'PENDENTE';
  }
  if (tpSituacaoPedido === 'A') {
    return 'EM_ROTA';
  }
  return situacao === 'C' ? 'CANCELADA' : 'ENTREGUE';
}

function mapearVenda(venda: VendaEntregadorApi): Entrega {
  return {
    id: venda.COD_NOTA_VENDA,
    codigo: venda.NR_PEDIDO,
    numeroPedido: venda.NR_PEDIDO,
    cliente: venda.NOME_PESSOA,
    endereco: [venda.ENDERECO, venda.NR_LOGRADOURO].filter(Boolean).join(', '),
    latitude: paraNumeroOuUndefined(venda.DS_LATITUDE),
    longitude: paraNumeroOuUndefined(venda.DS_LONGITUDE),
    situacao: mapearSituacaoVenda(venda.TP_SITUACAOPEDIDO, venda.SITUACAO),
  };
}

/**
 * Lista as vendas de entrega já vinculadas a um entregador no dia (mesma
 * consulta que a tela de Controle de Entregas do Delphi usa ao informar o
 * código do entregador).
 */
export async function buscarVendasDoEntregador(idEntregador: string): Promise<Entrega[]> {
  const vendas = await apiGet<VendaEntregadorApi[]>(`pedido/entregador/${idEntregador}/pedido`, {
    empresa: CD_EMPRESA,
    data: dataDeHojeIso(),
  });

  return vendas.map(mapearVenda);
}

/**
 * Vincula o entregador a um pedido e marca como despachado ("saiu para
 * entrega") — mesma ação que o botão de lançar entrega faz na tela de
 * Controle de Entregas do Delphi. Retorna `false` se o pedido não existir
 * ou não estiver mais em aberto (a rota responde 404 nesse caso).
 */
export async function vincularEntregador(
  idEntregador: string,
  idPedido: string,
): Promise<boolean> {
  return apiPut(`pedido/entregador/${idEntregador}/pedido/${idPedido}`, {
    empresa: CD_EMPRESA,
    data: dataDeHojeIso(),
  });
}

export const entregaService = {
  buscarPorCodigo,
  buscarVendasDoEntregador,
  vincularEntregador,
};
