import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
import { BotaoGrande } from '../../components/BotaoGrande';
import { BottomSheet } from '../../components/BottomSheet';
import { SairHeaderButton } from '../../components/SairHeaderButton';
import { SeletorHora } from '../../components/SeletorHora';
import { useEntregadorContext } from '../../contexts/EntregadorContext';
import { MainTabParamList } from '../../navigation/types';
import { Entrega } from '../../services';
import { localDb } from '../../services/localDb';
import { cores } from '../../theme/colors';
import { dataIsoDeHoje, formatarDataBr, formatarHoraExibicao, formatarMoeda, somarDias } from '../../utils/dataHora';
import { FORMAS_PAGAMENTO, iconeFormaPagamento, rotuloFormaPagamento } from '../../utils/formaPagamento';

type Props = BottomTabScreenProps<MainTabParamList, 'Concluidas'>;

export function PagamentosScreen(_props: Props) {
  const { entregador } = useEntregadorContext();

  const [dataIso, setDataIso] = useState(dataIsoDeHoje());
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [filtroAberto, setFiltroAberto] = useState(false);

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

  function totalDaEntrega(entrega: Entrega): number {
    return (entrega.pagamentos ?? []).reduce((soma, pagamento) => soma + pagamento.valor, 0);
  }

  const totalGeral = entregas.reduce((soma, item) => soma + totalDaEntrega(item), 0);

  // Resumo geral por forma de pagamento — soma todos os pagamentos de todas
  // as vendas no período, sem distinguir de qual venda cada um veio.
  const todosPagamentos = entregas.flatMap(item => item.pagamentos ?? []);

  const totaisPorForma = FORMAS_PAGAMENTO.map(forma => {
    const doFormato = todosPagamentos.filter(pagamento => pagamento.formaPagamento === forma.valor);
    return {
      ...forma,
      quantidade: doFormato.length,
      total: doFormato.reduce((soma, pagamento) => soma + pagamento.valor, 0),
    };
  }).filter(item => item.quantidade > 0);

  return (
    <View style={styles.raiz}>
      <AppHeader
        titulo="Concluídas"
        subtitulo={`${entregas.length} entrega(s) · ${formatarMoeda(totalGeral)}`}
        direita={<SairHeaderButton />}
      />

      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <Pressable style={styles.botaoFiltro} onPress={() => setFiltroAberto(true)}>
          <Icon name="filter-variant" size={18} color={cores.texto} />
          <Text style={styles.botaoFiltroTexto}>
            {formatarDataBr(dataIso)}
            {(horaInicio || horaFim) ? ` · ${horaInicio || '00:00'}–${horaFim || '23:59'}` : ''}
          </Text>
          <Icon name="chevron-down" size={18} color={cores.textoSecundario} />
        </Pressable>

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
                <View style={styles.cardFormas}>
                  {(item.pagamentos ?? []).map((pagamento, indice) => (
                    <View key={`${pagamento.formaPagamento}-${indice}`} style={styles.cardForma}>
                      <Icon
                        name={iconeFormaPagamento(pagamento.formaPagamento)}
                        size={14}
                        color={cores.textoSecundario}
                      />
                      <Text style={styles.cardFormaTexto}>
                        {rotuloFormaPagamento(pagamento.formaPagamento)} · {formatarMoeda(pagamento.valor)}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.cardValor}>{formatarMoeda(totalDaEntrega(item))}</Text>
              </View>
            </View>
          )}
        />

        <BottomSheet visible={filtroAberto} onClose={() => setFiltroAberto(false)}>
          <Text style={styles.tituloFiltro}>Filtrar período</Text>

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

          <BotaoGrande
            titulo="Concluído"
            onPress={() => setFiltroAberto(false)}
            style={styles.botaoConcluirFiltro}
          />
        </BottomSheet>
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
  botaoFiltro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: cores.bordaForte,
    backgroundColor: cores.superficie,
  },
  botaoFiltroTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: cores.texto,
  },
  tituloFiltro: {
    fontSize: 18,
    fontWeight: '800',
    color: cores.texto,
    marginBottom: 16,
  },
  botaoConcluirFiltro: {
    marginTop: 8,
    marginBottom: 4,
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
    alignItems: 'flex-start',
    marginTop: 4,
  },
  cardFormas: {
    gap: 4,
    flex: 1,
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
