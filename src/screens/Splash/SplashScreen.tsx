import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEntregadorContext } from '../../contexts/EntregadorContext';
import { RootStackParamList } from '../../navigation/types';
import { configurarApiBaseUrl } from '../../services/api';
import { localDb } from '../../services/localDb';
import { cores } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

/**
 * Decide a rota inicial do app antes de mostrar qualquer tela:
 * - sem configuração de servidor ou sem terminal vinculado -> `Configuracao` (obrigatória);
 * - com configuração salva e um entregador marcado como "permanecer
 *   logado" -> pula a leitura de código e entra direto em `MainTabs`;
 * - com configuração salva e sem entregador permanente -> `IdentificarEntregador`.
 */
export function SplashScreen({ navigation }: Props) {
  const { selecionarEntregador } = useEntregadorContext();

  useEffect(() => {
    let cancelado = false;

    async function iniciar() {
      const configuracao = await localDb.obterConfiguracaoServidor();

      if (cancelado) {
        return;
      }

      // Sem servidor configurado ou sem terminal vinculado (POST /Terminal):
      // a configuração é obrigatória antes de usar o app.
      const cdTerminal = await localDb.obterTerminal();

      if (cancelado) {
        return;
      }

      if (!configuracao || !cdTerminal) {
        navigation.replace('Configuracao');
        return;
      }

      configurarApiBaseUrl(configuracao.ip, configuracao.porta);

      const entregadorPermanente = await localDb.obterEntregadorPermanente();

      if (cancelado) {
        return;
      }

      if (entregadorPermanente) {
        selecionarEntregador(entregadorPermanente);
        navigation.replace('MainTabs');
        return;
      }

      navigation.replace('IdentificarEntregador');
    }

    iniciar();

    return () => {
      cancelado = true;
    };
  }, [navigation, selecionarEntregador]);

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require('../../images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color={cores.primaria} />
      <Text style={styles.texto}>Carregando...</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  logo: {
    width: 200,
    height: 59,
    marginBottom: 8,
  },
  texto: {
    fontSize: 15,
    color: cores.textoSecundario,
  },
});
