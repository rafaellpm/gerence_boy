import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FeedbackLeitura, TipoFeedback } from '../../components/FeedbackLeitura';
import { LeitorCodigo } from '../../components/LeitorCodigo';
import { useEntregadorContext } from '../../contexts/EntregadorContext';
import { RootStackParamList } from '../../navigation/types';
import { entregadorService } from '../../services';
import { cores } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'IdentificarEntregador'>;

export function IdentificarEntregadorScreen({ navigation }: Props) {
  const { selecionarEntregador } = useEntregadorContext();
  const [carregando, setCarregando] = useState(false);
  const [permanecerLogado, setPermanecerLogado] = useState(false);
  const [feedback, setFeedback] = useState<
    { tipo: TipoFeedback; mensagem: string } | null
  >(null);

  async function lerCodigoEntregador(codigo: string) {
    setFeedback(null);
    setCarregando(true);

    try {
      const entregador = await entregadorService.buscarPorCodigo(codigo);

      if (!entregador) {
        setFeedback({ tipo: 'erro', mensagem: `Entregador não encontrado (código ${codigo}).` });
        return;
      }

      if (!entregador.ativo) {
        setFeedback({ tipo: 'aviso', mensagem: `${entregador.nome} está inativo.` });
        return;
      }

      selecionarEntregador(entregador, permanecerLogado);
      navigation.replace('MainTabs');
    } catch (erro) {
      setFeedback({
        tipo: 'erro',
        mensagem: erro instanceof Error ? erro.message : 'Não foi possível consultar o entregador.',
      });
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.conteudo}>
        <View style={styles.cabecalho}>
          <View style={styles.cabecalhoTextos}>
            <Text style={styles.titulo}>Controle de Entregas</Text>
            <Text style={styles.subtitulo}>
              Leia o código de barras do entregador para iniciar a separação.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.botaoConfig, pressed && styles.botaoConfigPressionado]}
            onPress={() => navigation.push('Configuracao')}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Configurações do servidor"
          >
            <Icon name="cog-outline" size={24} color={cores.primaria} />
          </Pressable>
        </View>

        <LeitorCodigo
          titulo="Leitura do entregador"
          onLer={lerCodigoEntregador}
          carregando={carregando}
        />

        <View style={styles.permanecerLogadoLinha}>
          <Text style={styles.permanecerLogadoTexto}>Permanecer logado</Text>
          <Switch
            value={permanecerLogado}
            onValueChange={setPermanecerLogado}
            disabled={carregando}
            trackColor={{ false: cores.borda, true: cores.primaria }}
            thumbColor={cores.branco}
          />
        </View>

        {feedback && <FeedbackLeitura tipo={feedback.tipo} mensagem={feedback.mensagem} />}
      </View>

      <Image
        source={require('../../images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
    padding: 20,
  },
  conteudo: {
    flex: 1,
    gap: 20,
  },
  logo: {
    width: 100,
    height: 30,
    alignSelf: 'center',
    marginBottom: 8,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  cabecalhoTextos: {
    flex: 1,
    gap: 6,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '800',
    color: cores.texto,
  },
  subtitulo: {
    fontSize: 15,
    color: cores.textoSecundario,
  },
  botaoConfig: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${cores.primaria}1F`,
  },
  botaoConfigPressionado: {
    backgroundColor: `${cores.primaria}33`,
  },
  permanecerLogadoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  permanecerLogadoTexto: {
    fontSize: 15,
    fontWeight: '600',
    color: cores.texto,
  },
});
