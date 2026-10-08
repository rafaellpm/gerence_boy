import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
import { BotaoGrande } from '../../components/BotaoGrande';
import { CardEntrega } from '../../components/CardEntrega';
import { FormaPagamentoModal } from '../../components/FormaPagamentoModal';
import { HeaderIconButton } from '../../components/HeaderIconButton';
import { OpcoesEntregaBottomSheet } from '../../components/OpcoesEntregaBottomSheet';
import { SairHeaderButton } from '../../components/SairHeaderButton';
import { ScannerCodigoModal } from '../../components/ScannerCodigoModal';
import { useEntregadorContext } from '../../contexts/EntregadorContext';
import { MainTabParamList } from '../../navigation/types';
import { entregaService, Entrega, FormaPagamento } from '../../services';
import { cores } from '../../theme/colors';
import { abrirEntregaNoGoogleMaps } from '../../utils/maps';

type Props = BottomTabScreenProps<MainTabParamList, 'MinhasEntregas'>;

export function ListaEntregasScreen({ navigation }: Props) {
  const { entregas, adicionarEntrega, confirmarEntregaLocal, focarEntregaNoMapa } = useEntregadorContext();
  const [entregaSelecionada, setEntregaSelecionada] = useState<Entrega | null>(null);
  const [entregaParaPagamento, setEntregaParaPagamento] = useState<Entrega | null>(null);
  const [confirmandoPagamento, setConfirmandoPagamento] = useState(false);
  const [scannerAberto, setScannerAberto] = useState(false);
  const [bipando, setBipando] = useState(false);

  async function lerCodigoEntrega(codigo: string) {
    setScannerAberto(false);
    setBipando(true);

    try {
      const entrega = await entregaService.buscarPorCodigo(codigo);

      if (!entrega) {
        Alert.alert('Entrega não encontrada', `Código ${codigo} não encontrado.`);
        return;
      }

      const resultado = await adicionarEntrega(entrega);

      if (resultado === 'DUPLICADA') {
        Alert.alert('Entrega já adicionada', `${entrega.numeroPedido} já está na lista.`);
        return;
      }

      Alert.alert('Entrega adicionada', `${entrega.numeroPedido} — ${entrega.cliente}`);
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

  async function handleConfirmarPagamento(formaPagamento: FormaPagamento, valor: number) {
    if (!entregaParaPagamento) {
      return;
    }

    setConfirmandoPagamento(true);

    try {
      await confirmarEntregaLocal(entregaParaPagamento.codigo, formaPagamento, valor);
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
        titulo="Entregas vinculadas"
        subtitulo={`${entregas.length} entrega(s)`}
        direita={
          <View style={styles.acoesHeader}>
            <HeaderIconButton icone="camera" onPress={() => setScannerAberto(true)} carregando={bipando} />
            <SairHeaderButton />
          </View>
        }
      />

      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        {entregas.length > 0 && (
          <BotaoGrande
            titulo="Ver próxima entrega no mapa"
            icone="map-marker-path"
            onPress={handleVerProximaNoMapa}
          />
        )}

        <FlatList
          data={entregas}
          keyExtractor={item => item.codigo}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <Text style={styles.vazio}>Nenhuma entrega bipada ainda.</Text>
          }
          renderItem={({ item }) => (
            <CardEntrega entrega={item} onAbrirOpcoes={setEntregaSelecionada} />
          )}
        />

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
  acoesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
    padding: 20,
    gap: 16,
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
