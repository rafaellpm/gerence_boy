import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppHeader } from '../../components/AppHeader';
import { BotaoGrande } from '../../components/BotaoGrande';
import { CardEntrega } from '../../components/CardEntrega';
import { FormaPagamentoModal } from '../../components/FormaPagamentoModal';
import { OpcoesEntregaBottomSheet } from '../../components/OpcoesEntregaBottomSheet';
import { SairHeaderButton } from '../../components/SairHeaderButton';
import { ScannerCodigoModal } from '../../components/ScannerCodigoModal';
import { useEntregadorContext } from '../../contexts/EntregadorContext';
import { MainTabParamList } from '../../navigation/types';
import { entregaService, Entrega, Pagamento } from '../../services';
import { cores } from '../../theme/colors';
import { abrirEntregaNoGoogleMaps } from '../../utils/maps';

type Props = BottomTabScreenProps<MainTabParamList, 'Pendentes'>;

export function ListaEntregasScreen({ navigation }: Props) {
  const { entregador, entregas, recarregarEntregas, confirmarEntregaLocal, focarEntregaNoMapa } =
    useEntregadorContext();
  const [entregaSelecionada, setEntregaSelecionada] = useState<Entrega | null>(null);
  const [entregaParaPagamento, setEntregaParaPagamento] = useState<Entrega | null>(null);
  const [confirmandoPagamento, setConfirmandoPagamento] = useState(false);
  const [scannerAberto, setScannerAberto] = useState(false);
  const [bipando, setBipando] = useState(false);
  const [atualizando, setAtualizando] = useState(false);

  async function handleAtualizar() {
    setAtualizando(true);
    try {
      await recarregarEntregas();
    } catch (erro) {
      Alert.alert('Erro ao atualizar', erro instanceof Error ? erro.message : String(erro));
    } finally {
      setAtualizando(false);
    }
  }

  /**
   * Bipar a venda vincula direto no servidor (PUT), sem consultar antes —
   * `fVinculaEntregadorPedido` já valida lá se o pedido existe e se já está
   * vinculado a este ou a outro entregador. Depois, em vez de adicionar a
   * venda que veio na resposta direto na lista, recarrega tudo do servidor
   * (mesma fonte de verdade do "arrastar pra atualizar").
   */
  async function lerCodigoEntrega(codigo: string) {
    setScannerAberto(false);

    if (!entregador) {
      return;
    }

    setBipando(true);

    try {
      const resultado = await entregaService.vincularEntregador(entregador.codigo, codigo);

      switch (resultado.status) {
        case 'VINCULADO':
        case 'JA_VINCULADO_VOCE':
          await recarregarEntregas();
          Alert.alert(
            resultado.status === 'VINCULADO' ? 'Entrega vinculada' : 'Entrega já na lista',
            `${resultado.entrega.numeroPedido} — ${resultado.entrega.cliente}`,
          );
          break;
        case 'JA_VINCULADO_OUTRO':
          Alert.alert('Pedido já vinculado', `Esse pedido já está com ${resultado.entregadorAtual}.`);
          break;
        case 'NAO_ENCONTRADO':
          Alert.alert('Pedido não encontrado', `Código ${codigo} não encontrado ou não está mais em aberto.`);
          break;
        case 'CODIGO_INVALIDO':
          Alert.alert('Código inválido', `Não foi possível identificar a venda no código ${codigo}.`);
          break;
        case 'ERRO_AO_VINCULAR':
          Alert.alert('Erro ao vincular', 'O servidor não conseguiu gravar o vínculo dessa venda. Tente novamente.');
          break;
      }
    } catch (erro) {
      Alert.alert('Erro ao ler código', erro instanceof Error ? erro.message : String(erro));
    } finally {
      setBipando(false);
    }
  }

  function fecharOpcoes() {
    setEntregaSelecionada(null);
  }

  function handleVerMapaNoApp(entrega: Entrega) {
    fecharOpcoes();
    focarEntregaNoMapa(entrega);
    navigation.navigate('Mapa');
  }

  /** Vai direto pro mapa focado na próxima entrega da fila (a mais antiga ainda não entregue). */
  function handleVerProximaNoMapa() {
    focarEntregaNoMapa(null);
    navigation.navigate('Mapa');
  }

  async function handleAbrirGoogleMaps(entrega: Entrega) {
    fecharOpcoes();
    try {
      await abrirEntregaNoGoogleMaps(entrega);
    } catch {
      Alert.alert('Não foi possível abrir o Google Maps', 'Verifique se o app está instalado.');
    }
  }

  function handleMarcarEntregue(entrega: Entrega) {
    fecharOpcoes();
    setEntregaParaPagamento(entrega);
  }

  async function handleConfirmarPagamento(pagamentos: Pagamento[]) {
    if (!entregaParaPagamento) {
      return;
    }

    setConfirmandoPagamento(true);

    try {
      await confirmarEntregaLocal(entregaParaPagamento.codigo, pagamentos);
      setEntregaParaPagamento(null);
    } catch {
      Alert.alert('Erro ao marcar entrega', 'Não foi possível salvar no banco local do dispositivo.');
    } finally {
      setConfirmandoPagamento(false);
    }
  }

  return (
    <View style={styles.raiz}>
      <AppHeader
        titulo="Entregas Pendentes"
        subtitulo={`${entregas.length} entrega(s)`}
        direita={<SairHeaderButton />}
      />

      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        {entregas.length > 0 && (
          <BotaoGrande
            titulo="Ver próxima entrega no mapa"
            icone="map-marker-path"
            onPress={handleVerProximaNoMapa}
            compacto
          />
        )}

        <FlatList
          data={entregas}
          keyExtractor={item => item.codigo}
          contentContainerStyle={styles.lista}
          refreshing={atualizando}
          onRefresh={handleAtualizar}
          ListEmptyComponent={
            <Text style={styles.vazio}>Nenhuma entrega vinculada ainda.</Text>
          }
          renderItem={({ item }) => (
            <CardEntrega entrega={item} onAbrirOpcoes={setEntregaSelecionada} />
          )}
        />

        <Pressable
          style={styles.fab}
          onPress={() => setScannerAberto(true)}
          disabled={bipando}
          hitSlop={8}
        >
          {bipando ? (
            <ActivityIndicator color={cores.primariaTexto} />
          ) : (
            <Icon name="plus" size={28} color={cores.primariaTexto} />
          )}
        </Pressable>

        <OpcoesEntregaBottomSheet
          entrega={entregaSelecionada}
          onFechar={fecharOpcoes}
          onVerMapaNoApp={handleVerMapaNoApp}
          onAbrirGoogleMaps={handleAbrirGoogleMaps}
          onMarcarEntregue={handleMarcarEntregue}
        />

        <FormaPagamentoModal
          entrega={entregaParaPagamento}
          onFechar={() => setEntregaParaPagamento(null)}
          onConfirmar={handleConfirmarPagamento}
          confirmando={confirmandoPagamento}
        />

        <ScannerCodigoModal
          visible={scannerAberto}
          onFechar={() => setScannerAberto(false)}
          onCodigoLido={lerCodigoEntrega}
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
    gap: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: cores.preto,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  lista: {
    gap: 12,
    paddingBottom: 20,
  },
  vazio: {
    textAlign: 'center',
    color: cores.textoSecundario,
    marginTop: 40,
  },
});
