import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
import { SairHeaderButton } from '../../components/SairHeaderButton';
import { SeletorHora } from '../../components/SeletorHora';
import { useEntregadorContext } from '../../contexts/EntregadorContext';
import { MainTabParamList } from '../../navigation/types';
import { Entrega } from '../../services';
import { localDb } from '../../services/localDb';
import { cores } from '../../theme/colors';
import { dataIsoDeHoje, formatarDataBr, formatarHoraExibicao, formatarMoeda, somarDias } from '../../utils/dataHora';
import { FORMAS_PAGAMENTO, iconeFormaPagamento, rotuloFormaPagamento } from '../../utils/formaPagamento';

type Props = BottomTabScreenProps<MainTabParamList, 'Pagamentos'>;

export function PagamentosScreen(_props: Props) {
  const { entregador } = useEntregadorContext();

  const [dataIso, setDataIso] = useState(dataIsoDeHoje());
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(() => {
    if (!entregador) {
      return;
    }

    setCarregando(true);

    localDb
      .listarEntreguesPorDia(entregador.codigo, dataIso, horaInicio || undefined, horaFim || undefined)
      .then(setEntregas)
      .finally(() => setCarregando(false));
  }, [entregador, dataIso, horaInicio, horaFim]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const totalGeral = entregas.reduce((soma, item) => soma + (item.valor ?? 0), 0);

  const totaisPorForma = FORMAS_PAGAMENTO.map(forma => {
    const doFormato = entregas.filter(item => item.formaPagamento === forma.valor);
    return {
      ...forma,
      quantidade: doFormato.length,
      total: doFormato.reduce((soma, item) => soma + (item.valor ?? 0), 0),
    };
  }).filter(item => item.quantidade > 0);

  return (
    <View style={styles.raiz}>
      <AppHeader
        titulo="Pagamentos"
        subtitulo={`${entregas.length} entrega(s) · ${formatarMoeda(totalGeral)}`}
        direita={<SairHeaderButton />}
      />

      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <View style={styles.filtroData}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setDataIso(atual => somarDias(atual, -1))}
            style={styles.botaoData}
          >
            <Icon name="chevron-left" size={24} color={cores.texto} />
          </Pressable>

          <View style={styles.dataAtual}>
            <Text style={styles.dataAtualTexto}>{formatarDataBr(dataIso)}</Text>
            {dataIso !== dataIsoDeHoje() && (
              <Pressable accessibilityRole="button" onPress={() => setDataIso(dataIsoDeHoje())}>
                <Text style={styles.linkHoje}>Voltar para hoje</Text>
              </Pressable>
            )}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => setDataIso(atual => somarDias(atual, 1))}
            style={styles.botaoData}
          >
            <Icon name="chevron-right" size={24} color={cores.texto} />
          </Pressable>
        </View>

        <View style={styles.filtroHorario}>
          <View style={styles.campoHorario}>
            <Text style={styles.rotuloHorario}>De</Text>
            <SeletorHora valor={horaInicio} placeholder="00:00" onAlterar={setHoraInicio} />
          </View>
          <View style={styles.campoHorario}>
            <Text style={styles.rotuloHorario}>Até</Text>
            <SeletorHora valor={horaFim} placeholder="23:59" onAlterar={setHoraFim} />
          </View>
        </View>

        {totaisPorForma.length > 0 && (
          <View style={styles.resumo}>
            {totaisPorForma.map(item => (
              <View key={item.valor} style={styles.resumoLinha}>
                <Icon name={item.icone} size={18} color={cores.textoSecundario} />
                <Text style={styles.resumoRotulo}>
                  {item.rotulo} ({item.quantidade})
                </Text>
                <Text style={styles.resumoValor}>{formatarMoeda(item.total)}</Text>
              </View>
            ))}
          </View>
        )}

        <FlatList
          data={entregas}
          keyExtractor={item => item.codigo}
          contentContainerStyle={styles.lista}
          refreshing={carregando}
          onRefresh={carregar}
          ListEmptyComponent={
            <Text style={styles.vazio}>
              {carregando ? 'Carregando…' : 'Nenhuma entrega entregue nesse período.'}
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardCabecalho}>
                <Text style={styles.cardPedido}>{item.numeroPedido}</Text>
                <Text style={styles.cardHora}>
                  {item.entregueEm ? formatarHoraExibicao(item.entregueEm) : ''}
                </Text>
              </View>
              <Text style={styles.cardCliente}>{item.cliente}</Text>
              <View style={styles.cardRodape}>
                <View style={styles.cardForma}>
                  {item.formaPagamento && (
                    <>
                      <Icon
                        name={iconeFormaPagamento(item.formaPagamento)}
                        size={16}
                        color={cores.textoSecundario}
                      />
                      <Text style={styles.cardFormaTexto}>
                        {rotuloFormaPagamento(item.formaPagamento)}
                      </Text>
                    </>
                  )}
                </View>
                <Text style={styles.cardValor}>{formatarMoeda(item.valor ?? 0)}</Text>
              </View>
            </View>
          )}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
    padding: 20,
    gap: 14,
  },
  filtroData: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  botaoData: {
    padding: 8,
  },
  dataAtual: {
    alignItems: 'center',
    gap: 2,
  },
  dataAtualTexto: {
    fontSize: 17,
    fontWeight: '800',
    color: cores.texto,
  },
  linkHoje: {
    fontSize: 12,
    fontWeight: '700',
    color: cores.primaria,
  },
  filtroHorario: {
    flexDirection: 'row',
    gap: 12,
  },
  campoHorario: {
    flex: 1,
    gap: 6,
  },
  rotuloHorario: {
    fontSize: 12,
    fontWeight: '700',
    color: cores.textoSecundario,
  },
  resumo: {
    backgroundColor: cores.superficie,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: 14,
    gap: 10,
  },
  resumoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resumoRotulo: {
    flex: 1,
    fontSize: 14,
    color: cores.texto,
    fontWeight: '600',
  },
  resumoValor: {
    fontSize: 14,
    fontWeight: '800',
    color: cores.texto,
  },
  lista: {
    gap: 10,
    paddingBottom: 20,
  },
  vazio: {
    textAlign: 'center',
    color: cores.textoSecundario,
    marginTop: 40,
  },
  card: {
    backgroundColor: cores.superficie,
    borderRadius: 14,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  cardCabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPedido: {
    fontSize: 15,
    fontWeight: '700',
    color: cores.texto,
  },
  cardHora: {
    fontSize: 13,
    color: cores.textoSecundario,
  },
  cardCliente: {
    fontSize: 14,
    color: cores.textoSecundario,
  },
  cardRodape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  cardForma: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardFormaTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: cores.textoSecundario,
  },
  cardValor: {
    fontSize: 15,
    fontWeight: '800',
    color: cores.sucesso,
  },
});
