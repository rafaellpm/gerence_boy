export type Entregador = {
  id: string;
  codigo: string;
  nome: string;
  documento?: string;
  ativo: boolean;
};

export type SituacaoEntrega = 'PENDENTE' | 'EM_ROTA' | 'ENTREGUE' | 'CANCELADA';

export type FormaPagamento = 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'PIX';

export type Entrega = {
  id: string;
  codigo: string;
  numeroPedido: string;
  cliente: string;
  endereco: string;
  latitude?: number;
  longitude?: number;
  situacao: SituacaoEntrega;
  formaPagamento?: FormaPagamento;
  valor?: number;
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
