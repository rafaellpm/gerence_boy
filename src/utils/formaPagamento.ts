import { FormaPagamento } from '../services';

export const FORMAS_PAGAMENTO: { valor: FormaPagamento; rotulo: string; icone: string }[] = [
  { valor: 'DINHEIRO', rotulo: 'Dinheiro', icone: 'cash' },
  { valor: 'CARTAO_CREDITO', rotulo: 'Cartão de Crédito', icone: 'credit-card-outline' },
  { valor: 'CARTAO_DEBITO', rotulo: 'Cartão de Débito', icone: 'credit-card-outline' },
  { valor: 'PIX', rotulo: 'Pix', icone: 'qrcode' },
];

export function rotuloFormaPagamento(forma: FormaPagamento): string {
  return FORMAS_PAGAMENTO.find(item => item.valor === forma)?.rotulo ?? forma;
}

export function iconeFormaPagamento(forma: FormaPagamento): string {
  return FORMAS_PAGAMENTO.find(item => item.valor === forma)?.icone ?? 'cash';
}
