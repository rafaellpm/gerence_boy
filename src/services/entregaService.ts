import { api, CD_EMPRESA, dataDeHojeServidor } from './api';
import { Entrega, SituacaoEntrega } from './types';

/**
 * Resposta de `GET /pedido/entregador/:id/pedido` (servidorGerencePlus,
 * uDMNova.fListaVendasEntregador / uFuncoesDM.qCEListaVendasEntregador —
 * NOTA_VENDA + JOIN com PESSOAS/FUNCIONARIO).
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
  const { data: vendas } = await api.get<VendaEntregadorApi[]>(`pedido/entregador/${idEntregador}/pedido`, {
    params: { empresa: CD_EMPRESA, data: dataDeHojeServidor() },
  });

  return vendas.map(mapearVenda);
}

/**
 * Resposta de `PUT /pedido/entregador/:id/pedido/:idPedido`
 * (uDMNova.fVinculaEntregadorPedido). O servidor faz toda a validação da
 * venda (existe? já tem entregador vinculado?) — o app não consulta antes
 * de vincular, só bipa o código e chama essa rota direto.
 */
type VinculoEntregadorApi = {
  status:
    | 'VINCULADO'
    | 'JA_VINCULADO_VOCE'
    | 'JA_VINCULADO_OUTRO'
    | 'NAO_ENCONTRADO'
    | 'CODIGO_INVALIDO'
    | 'ERRO_AO_VINCULAR';
  entregadorAtual?: string;
  COD_NOTA_VENDA?: string;
  NR_PEDIDO?: string;
  NOME_PESSOA?: string;
  ENDERECO?: string;
  NR_LOGRADOURO?: string;
  DS_LATITUDE?: string;
  DS_LONGITUDE?: string;
  [campo: string]: string | undefined;
};

export type VinculoResultado =
  | { status: 'VINCULADO' | 'JA_VINCULADO_VOCE'; entrega: Entrega }
  | { status: 'JA_VINCULADO_OUTRO'; entregadorAtual: string }
  | { status: 'NAO_ENCONTRADO' | 'CODIGO_INVALIDO' | 'ERRO_AO_VINCULAR' };

function mapearVinculo(venda: VinculoEntregadorApi): Entrega {
  return {
    id: venda.COD_NOTA_VENDA ?? '',
    codigo: venda.NR_PEDIDO ?? '',
    numeroPedido: venda.NR_PEDIDO ?? '',
    cliente: venda.NOME_PESSOA ?? '',
    endereco: [venda.ENDERECO, venda.NR_LOGRADOURO].filter(Boolean).join(', '),
    latitude: paraNumeroOuUndefined(venda.DS_LATITUDE),
    longitude: paraNumeroOuUndefined(venda.DS_LONGITUDE),
    situacao: 'EM_ROTA',
  };
}

/**
 * Vincula o entregador ao pedido lido no código de barras e marca como
 * despachado ("saiu para entrega"). Sem consulta prévia: o servidor
 * identifica o pedido pelo código (removendo o prefixo `22222` do código de
 * barras da venda) e valida tudo — se não existir, ou se já estiver
 * vinculado a outro entregador, devolve o motivo em `status` sem alterar nada.
 */
export async function vincularEntregador(
  idEntregador: string,
  idPedido: string,
): Promise<VinculoResultado> {
  const { data } = await api.put<VinculoEntregadorApi>(
    `pedido/entregador/${idEntregador}/pedido/${idPedido}`,
    null,
    { params: { empresa: CD_EMPRESA, data: dataDeHojeServidor() } },
  );

  if (data.status === 'VINCULADO' || data.status === 'JA_VINCULADO_VOCE') {
    return { status: data.status, entrega: mapearVinculo(data) };
  }
  if (data.status === 'JA_VINCULADO_OUTRO') {
    return { status: data.status, entregadorAtual: data.entregadorAtual ?? 'outro entregador' };
  }
  return { status: data.status };
}

export const entregaService = {
  buscarVendasDoEntregador,
  vincularEntregador,
};
