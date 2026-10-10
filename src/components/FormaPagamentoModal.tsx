import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Entrega, FormaPagamento } from '../services';
import { cores } from '../theme/colors';
import { FORMAS_PAGAMENTO } from '../utils/formaPagamento';
import { BotaoGrande } from './BotaoGrande';
import { BottomSheet } from './BottomSheet';

type FormaPagamentoModalProps = {
  entrega: Entrega | null;
  onFechar: () => void;
  onConfirmar: (formaPagamento: FormaPagamento, valor: number) => void;
  confirmando?: boolean;
};

function digitosParaValor(digitos: string): number {
  return Number(digitos || '0') / 100;
}

export function FormaPagamentoModal({
  entrega,
  onFechar,
  onConfirmar,
  confirmando = false,
}: FormaPagamentoModalProps) {
  const [formaSelecionada, setFormaSelecionada] = useState<FormaPagamento | null>(null);
  const [digitosValor, setDigitosValor] = useState('');
  const [tecladoVisivel, setTecladoVisivel] = useState(false);

  useEffect(() => {
    if (entrega) {
      setFormaSelecionada(null);
      setDigitosValor('');
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

  const valor = digitosParaValor(digitosValor);
  const podeConfirmar = !!formaSelecionada && valor > 0 && !confirmando;

  function handleConfirmar() {
    if (formaSelecionada && valor > 0) {
      onConfirmar(formaSelecionada, valor);
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

          <Text style={styles.rotulo}>Forma de pagamento</Text>
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
          <View style={styles.campoValor}>
            <Text style={styles.prefixoValor}>R$</Text>
            <TextInput
              style={styles.inputValor}
              keyboardType="numeric"
              placeholder="0,00"
              placeholderTextColor={cores.textoPlaceholder}
              value={valor > 0 ? valor.toFixed(2).replace('.', ',') : ''}
              onChangeText={texto => setDigitosValor(texto.replace(/\D/g, ''))}
              editable={!confirmando}
            />
          </View>

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
  campoValor: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: cores.bordaForte,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
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
