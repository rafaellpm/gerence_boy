export type Entregador = {
  id: string;
  codigo: string;
  nome: string;
  documento?: string;
  ativo: boolean;
};

export type SituacaoEntrega = 'PENDENTE' | 'EM_ROTA' | 'ENTREGUE' | 'CANCELADA';

export type FormaPagamento = 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'PIX';

export type Pagamento = {
  formaPagamento: FormaPagamento;
  valor: number;
};

export type Entrega = {
  id: string;
  codigo: string;
  numeroPedido: string;
  cliente: string;
  endereco: string;
  latitude?: number;
  longitude?: number;
  situacao: SituacaoEntrega;
  /** Valor total da venda (NOTA_VENDA.VALOR_TOTAL) — quanto o entregador deve cobrar do cliente. */
  valorTotal?: number;
  /** Uma venda pode ter mais de um pagamento (ex.: parte em dinheiro, parte no cartão) — só preenchido pra entregas já ENTREGUE (ver `localDb.listarEntreguesPorDia`). */
  pagamentos?: Pagamento[];
  entregueEm?: string;
};

export type ResultadoOperacao<T> =
  | { sucesso: true; dados: T }
  | { sucesso: false; erro: string };

/** IP/porta do servidorGerencePlus, configurados pelo usuário na `ConfiguracaoScreen`. */
export type ConfiguracaoServidor = {
  ip: string;
  porta: string;
};
