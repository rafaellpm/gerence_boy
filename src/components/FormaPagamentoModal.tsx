import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Entrega, FormaPagamento, Pagamento } from '../services';
import { cores } from '../theme/colors';
import { formatarMoeda } from '../utils/dataHora';
import { FORMAS_PAGAMENTO, iconeFormaPagamento, rotuloFormaPagamento } from '../utils/formaPagamento';
import { BotaoGrande } from './BotaoGrande';
import { BottomSheet } from './BottomSheet';

type FormaPagamentoModalProps = {
  entrega: Entrega | null;
  onFechar: () => void;
  onConfirmar: (pagamentos: Pagamento[]) => void;
  confirmando?: boolean;
};

function digitosParaValor(digitos: string): number {
  return Number(digitos || '0') / 100;
}

function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Confirma a entrega podendo registrar mais de um pagamento pra mesma venda
 * (ex.: parte em dinheiro, parte no cartão). O botão "+" é obrigatório pra
 * todo pagamento, inclusive o único — ele que registra o valor na lista; o
 * "Finalizar entrega" só muda a situação da venda e só habilita quando a
 * soma do que já foi adicionado cobre o valor total.
 */
export function FormaPagamentoModal({
  entrega,
  onFechar,
  onConfirmar,
  confirmando = false,
}: FormaPagamentoModalProps) {
  const [formaSelecionada, setFormaSelecionada] = useState<FormaPagamento | null>(null);
  const [digitosValor, setDigitosValor] = useState('');
  const [pagamentosAdicionados, setPagamentosAdicionados] = useState<Pagamento[]>([]);
  const [tecladoVisivel, setTecladoVisivel] = useState(false);

  useEffect(() => {
    if (entrega) {
      setFormaSelecionada(null);
      setDigitosValor('');
      setPagamentosAdicionados([]);
    }
  }, [entrega]);

  // Só interessa no iOS: é lá que o Modal não redimensiona a tela sozinho,
  // então o botão flutuante serve de atalho pra confirmar sem precisar
  // rolar até o fim do sheet por baixo do teclado.
  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }

    const mostrar = Keyboard.addListener('keyboardWillShow', () => setTecladoVisivel(true));
    const esconder = Keyboard.addListener('keyboardWillHide', () => setTecladoVisivel(false));

    return () => {
      mostrar.remove();
      esconder.remove();
    };
  }, []);

  const valorAtual = digitosParaValor(digitosValor);

  const valorTotal = entrega?.valorTotal;
  const totalAdicionado = pagamentosAdicionados.reduce((soma, item) => soma + item.valor, 0);
  const restante = valorTotal != null ? arredondar(valorTotal - totalAdicionado) : null;

  // Só dinheiro pode passar do restante (gera troco) — as demais formas têm
  // que caber exatamente no que falta, sem "troco" de cartão/Pix.
  const excedeLimite =
    !!formaSelecionada &&
    formaSelecionada !== 'DINHEIRO' &&
    restante != null &&
    valorAtual > restante + 0.001;

  const trocoAtual =
    formaSelecionada === 'DINHEIRO' && restante != null && valorAtual > restante
      ? arredondar(valorAtual - Math.max(restante, 0))
      : 0;
  const valorAplicado = arredondar(valorAtual - trocoAtual);

  const rascunhoValido = !!formaSelecionada && valorAtual > 0 && !excedeLimite;

  // "Finalizar" só habilita com o que já foi registrado pelo "+" — o
  // rascunho ainda não adicionado não conta, por mais que esteja preenchido.
  const faltante = valorTotal != null ? arredondar(Math.max(valorTotal - totalAdicionado, 0)) : 0;
  const cobreValorTotal = valorTotal == null || faltante <= 0.001;
  const podeConfirmar = pagamentosAdicionados.length > 0 && cobreValorTotal && !confirmando;

  function handleAdicionarPagamento() {
    if (!rascunhoValido) {
      return;
    }
    setPagamentosAdicionados(atual => [...atual, { formaPagamento: formaSelecionada!, valor: valorAplicado }]);
    setFormaSelecionada(null);
    setDigitosValor('');
  }

  function handleRemoverPagamento(indice: number) {
    setPagamentosAdicionados(atual => atual.filter((_, i) => i !== indice));
  }

  function handleConfirmar() {
    if (podeConfirmar) {
      onConfirmar(pagamentosAdicionados);
    }
  }

  function handleConfirmarEOcultarTeclado() {
    Keyboard.dismiss();
    handleConfirmar();
  }

  return (
    <BottomSheet visible={!!entrega} onClose={onFechar}>
      {entrega && (
        <>
          <Text style={styles.titulo}>Confirmar entrega</Text>
          <Text style={styles.pedido}>
            {entrega.numeroPedido} · {entrega.cliente}
          </Text>

          {entrega.valorTotal != null && (
            <View style={styles.valorVenda}>
              <Text style={styles.valorVendaRotulo}>
                {pagamentosAdicionados.length > 0 ? 'Restante' : 'Valor a cobrar'}
              </Text>
              <Text style={styles.valorVendaValor}>
                {formatarMoeda(pagamentosAdicionados.length > 0 ? (restante ?? entrega.valorTotal) : entrega.valorTotal)}
              </Text>
            </View>
          )}

          {entrega.trocoPedido != null && (
            <View style={styles.trocoPedido}>
              <Icon name="cash-refund" size={16} color={cores.textoSecundario} />
              <Text style={styles.trocoPedidoTexto}>
                Troco: {formatarMoeda(entrega.trocoPedido)}
              </Text>
            </View>
          )}

          {pagamentosAdicionados.length > 0 && (
            <View style={styles.listaAdicionados}>
              {pagamentosAdicionados.map((pagamento, indice) => (
                <View key={`${pagamento.formaPagamento}-${indice}`} style={styles.linhaAdicionada}>
                  <Icon
                    name={iconeFormaPagamento(pagamento.formaPagamento)}
                    size={16}
                    color={cores.textoSecundario}
                  />
                  <Text style={styles.linhaAdicionadaTexto}>
                    {rotuloFormaPagamento(pagamento.formaPagamento)}
                  </Text>
                  <Text style={styles.linhaAdicionadaValor}>{formatarMoeda(pagamento.valor)}</Text>
                  <Pressable onPress={() => handleRemoverPagamento(indice)} hitSlop={8}>
                    <Icon name="close" size={18} color={cores.textoSecundario} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.rotulo}>
            {pagamentosAdicionados.length > 0 ? 'Outro pagamento' : 'Forma de pagamento'}
          </Text>
          <View style={styles.opcoesPagamento}>
            {FORMAS_PAGAMENTO.map(forma => {
              const selecionada = formaSelecionada === forma.valor;
              return (
                <Pressable
                  key={forma.valor}
                  accessibilityRole="button"
                  onPress={() => setFormaSelecionada(forma.valor)}
                  style={[
                    styles.opcaoPagamento,
                    selecionada && styles.opcaoPagamentoSelecionada,
                  ]}
                >
                  <Icon
                    name={forma.icone}
                    size={20}
                    color={selecionada ? cores.primariaTexto : cores.textoSecundario}
                  />
                  <Text
                    style={[
                      styles.opcaoPagamentoTexto,
                      selecionada && styles.opcaoPagamentoTextoSelecionado,
                    ]}
                  >
                    {forma.rotulo}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.rotulo}>Valor recebido</Text>
          <View style={styles.linhaValor}>
            <View style={[styles.campoValor, excedeLimite && styles.campoValorErro]}>
              <Text style={styles.prefixoValor}>R$</Text>
              <TextInput
                style={styles.inputValor}
                keyboardType="numeric"
                placeholder="0,00"
                placeholderTextColor={cores.textoPlaceholder}
                value={valorAtual > 0 ? valorAtual.toFixed(2).replace('.', ',') : ''}
                onChangeText={texto => setDigitosValor(texto.replace(/\D/g, ''))}
                editable={!confirmando}
              />
            </View>

            <Pressable
              onPress={handleAdicionarPagamento}
              disabled={!rascunhoValido || confirmando}
              style={[styles.botaoAdicionar, !rascunhoValido && styles.botaoAdicionarDesabilitado]}
              accessibilityRole="button"
              accessibilityLabel="Adicionar pagamento"
            >
              <Icon name="plus" size={30} color={cores.primariaTexto} />
            </Pressable>
          </View>

          {excedeLimite && restante != null && (
            <Text style={styles.mensagemErro}>
              {rotuloFormaPagamento(formaSelecionada!)} não pode passar de {formatarMoeda(Math.max(restante, 0))}.
            </Text>
          )}

          {trocoAtual > 0 && (
            <Text style={styles.mensagemTroco}>Troco a devolver: {formatarMoeda(trocoAtual)}</Text>
          )}

          {pagamentosAdicionados.length > 0 && !cobreValorTotal && (
            <Text style={styles.mensagemErro}>
              Faltam {formatarMoeda(faltante)} pra completar o valor da entrega.
            </Text>
          )}

          {pagamentosAdicionados.length > 0 && (
            <Text style={styles.totalGeral}>Total: {formatarMoeda(totalAdicionado)}</Text>
          )}

          <BotaoGrande
            titulo="Finalizar entrega"
            icone="check-circle-outline"
            onPress={handleConfirmar}
            desabilitado={!podeConfirmar}
            carregando={confirmando}
            style={styles.botaoConfirmar}
          />

          {tecladoVisivel && (
            <Pressable
              style={[styles.fabConfirmar, !podeConfirmar && styles.fabConfirmarDesabilitado]}
              onPress={handleConfirmarEOcultarTeclado}
              disabled={!podeConfirmar}
              accessibilityRole="button"
              accessibilityLabel="Confirmar e ocultar teclado"
            >
              <Icon name="check" size={26} color={cores.primariaTexto} />
            </Pressable>
          )}
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  titulo: {
    fontSize: 18,
    fontWeight: '800',
    color: cores.texto,
    marginBottom: 2,
  },
  pedido: {
    fontSize: 14,
    color: cores.textoSecundario,
    marginBottom: 16,
  },
  valorVenda: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: cores.fundo,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  valorVendaRotulo: {
    fontSize: 14,
    fontWeight: '600',
    color: cores.textoSecundario,
  },
  valorVendaValor: {
    fontSize: 18,
    fontWeight: '800',
    color: cores.sucesso,
  },
  trocoPedido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -8,
    marginBottom: 16,
  },
  trocoPedidoTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: cores.textoSecundario,
  },
  rotulo: {
    fontSize: 13,
    fontWeight: '700',
    color: cores.textoSecundario,
    marginBottom: 8,
  },
  listaAdicionados: {
    gap: 6,
    marginBottom: 16,
  },
  linhaAdicionada: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: cores.fundo,
  },
  linhaAdicionadaTexto: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: cores.texto,
  },
  linhaAdicionadaValor: {
    fontSize: 14,
    fontWeight: '700',
    color: cores.texto,
  },
  opcoesPagamento: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  opcaoPagamento: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.fundo,
  },
  opcaoPagamentoSelecionada: {
    backgroundColor: cores.primaria,
    borderColor: cores.primaria,
  },
  opcaoPagamentoTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: cores.texto,
  },
  opcaoPagamentoTextoSelecionado: {
    color: cores.primariaTexto,
  },
  linhaValor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  campoValor: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: cores.bordaForte,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: cores.superficie,
  },
  campoValorErro: {
    borderColor: cores.perigo,
  },
  mensagemErro: {
    fontSize: 13,
    fontWeight: '600',
    color: cores.perigo,
    marginTop: -6,
    marginBottom: 12,
  },
  mensagemTroco: {
    fontSize: 13,
    fontWeight: '700',
    color: cores.sucesso,
    marginTop: -6,
    marginBottom: 12,
  },
  prefixoValor: {
    fontSize: 18,
    fontWeight: '700',
    color: cores.textoSecundario,
    marginRight: 8,
  },
  inputValor: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: cores.texto,
    paddingVertical: 14,
  },
  botaoAdicionar: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoAdicionarDesabilitado: {
    opacity: 0.4,
  },
  totalGeral: {
    fontSize: 14,
    fontWeight: '700',
    color: cores.texto,
    marginBottom: 12,
    textAlign: 'right',
  },
  botaoConfirmar: {
    marginBottom: 4,
  },
  fabConfirmar: {
    position: 'absolute',
    right: 4,
    bottom: 76,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: cores.preto,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabConfirmarDesabilitado: {
    opacity: 0.5,
  },
});
