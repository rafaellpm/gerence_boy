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

/**
 * Confirma a entrega podendo registrar mais de um pagamento pra mesma venda
 * (ex.: parte em dinheiro, parte no cartão) — "+ Adicionar outro pagamento"
 * guarda o forma/valor atual na lista e limpa os campos pro próximo; o
 * "Confirmar entrega" sempre inclui o que estiver preenchido no momento,
 * então um pagamento único continua sendo só selecionar a forma e digitar
 * o valor, sem precisar desse botão extra.
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
  const rascunhoValido = !!formaSelecionada && valorAtual > 0;
  const pagamentosFinais: Pagamento[] = rascunhoValido
    ? [...pagamentosAdicionados, { formaPagamento: formaSelecionada!, valor: valorAtual }]
    : pagamentosAdicionados;
  const totalFinal = pagamentosFinais.reduce((soma, item) => soma + item.valor, 0);
  const podeConfirmar = pagamentosFinais.length > 0 && !confirmando;

  function handleAdicionarPagamento() {
    if (!rascunhoValido) {
      return;
    }
    setPagamentosAdicionados(atual => [...atual, { formaPagamento: formaSelecionada!, valor: valorAtual }]);
    setFormaSelecionada(null);
    setDigitosValor('');
  }

  function handleRemoverPagamento(indice: number) {
    setPagamentosAdicionados(atual => atual.filter((_, i) => i !== indice));
  }

  function handleConfirmar() {
    if (pagamentosFinais.length > 0) {
      onConfirmar(pagamentosFinais);
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
            <View style={styles.campoValor}>
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
              accessibilityLabel="Adicionar outro pagamento"
            >
              <Icon name="plus" size={22} color={cores.primariaTexto} />
            </Pressable>
          </View>

          {pagamentosAdicionados.length > 0 && (
            <Text style={styles.totalGeral}>Total: {formatarMoeda(totalFinal)}</Text>
          )}

          <BotaoGrande
            titulo="Confirmar entrega"
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
    width: 48,
    height: 48,
    borderRadius: 12,
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
