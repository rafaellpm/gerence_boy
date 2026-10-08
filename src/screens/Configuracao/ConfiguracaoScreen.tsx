import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BotaoGrande } from '../../components/BotaoGrande';
import { HeaderTextButton } from '../../components/HeaderTextButton';
import { ScannerCodigoModal } from '../../components/ScannerCodigoModal';
import { RootStackParamList } from '../../navigation/types';
import { configurarApiBaseUrl, testarConexao } from '../../services/api';
import { localDb } from '../../services/localDb';
import { registrarTerminal, validarIpQrCode } from '../../services/terminalService';
import { cores } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Configuracao'>;

function alertar(titulo: string, mensagem: string): Promise<void> {
  return new Promise(resolve => {
    Alert.alert(titulo, mensagem, [{ text: 'OK', onPress: () => resolve() }], {
      cancelable: true,
      onDismiss: () => resolve(),
    });
  });
}

/**
 * Tela de configuração do servidorGerencePlus. É obrigatória no primeiro uso
 * do app (a `SplashScreen` manda pra cá quando não há configuração ou
 * terminal) e também pode ser reaberta depois, a partir da tela de
 * identificação do entregador — nesse caso `navigation.canGoBack()` é `true`
 * e mostramos um botão de cancelar.
 *
 * Ao ler o QR Code com o IP do servidor, testa a conexão e registra este
 * aparelho como terminal no servidor (POST /Terminal) — o mesmo vínculo do
 * app GerencePlus, sem senha/código de liberação.
 */
export function ConfiguracaoScreen({ navigation }: Props) {
  const [ip, setIp] = useState('');
  const [porta, setPorta] = useState('212');
  const [cdTerminal, setCdTerminal] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [scannerAberto, setScannerAberto] = useState(false);
  const podeVoltar = navigation.canGoBack();

  useEffect(() => {
    localDb.obterConfiguracaoServidor().then(configuracao => {
      if (configuracao) {
        setIp(configuracao.ip);
        setPorta(configuracao.porta);
      }
    });
    localDb.obterTerminal().then(setCdTerminal);
  }, []);

  async function salvar(ipInformado = ip.trim()) {
    const portaInformada = porta.trim();

    if (!ipInformado || !portaInformada) {
      Alert.alert('Configuração incompleta', 'Informe o IP e a porta do servidor.');
      return;
    }

    setCarregando(true);
    const configuracaoAnterior = await localDb.obterConfiguracaoServidor();

    try {
      const falhaConexao = await testarConexao(ipInformado, portaInformada);
      if (falhaConexao) {
        throw new Error(falhaConexao);
      }

      configurarApiBaseUrl(ipInformado, portaInformada);
      const terminal = await registrarTerminal(cdTerminal ?? 0);

      await localDb.salvarConfiguracaoServidor({ ip: ipInformado, porta: portaInformada });
      await localDb.salvarTerminal(terminal);
      setCdTerminal(terminal);

      await alertar('Tudo certo!', `Aparelho vinculado ao servidor.\nTerminal: ${terminal}`);

      if (podeVoltar) {
        navigation.goBack();
      } else {
        navigation.replace('IdentificarEntregador');
      }
    } catch (erro) {
      // Volta para o servidor que já estava salvo, se houver.
      if (configuracaoAnterior) {
        configurarApiBaseUrl(configuracaoAnterior.ip, configuracaoAnterior.porta);
      }
      Alert.alert('Erro na configuração', erro instanceof Error ? erro.message : String(erro));
    } finally {
      setCarregando(false);
    }
  }

  function aoLerQrCode(conteudo: string) {
    setScannerAberto(false);
    try {
      const ipLido = validarIpQrCode(conteudo);
      setIp(ipLido);
      salvar(ipLido);
    } catch (erro) {
      Alert.alert('QR Code inválido', erro instanceof Error ? erro.message : String(erro));
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {podeVoltar && (
        <View style={styles.cabecalhoVoltar}>
          <HeaderTextButton titulo="Cancelar" onPress={() => navigation.goBack()} />
        </View>
      )}

      <Image
        source={require('../../images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Configuração do servidor</Text>
        <Text style={styles.subtitulo}>Leia o QR Code do servidor Gerence Plus para conectar o app.</Text>
        {cdTerminal ? <Text style={styles.terminal}>Terminal vinculado: {cdTerminal}</Text> : null}
      </View>

      <BotaoGrande
        titulo="Ler QR Code"
        icone="qrcode-scan"
        variante="secundario"
        onPress={() => setScannerAberto(true)}
        carregando={carregando}
        desabilitado={carregando}
      />

      <ScannerCodigoModal visible={scannerAberto} onFechar={() => setScannerAberto(false)} onCodigoLido={aoLerQrCode} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
    padding: 20,
    gap: 20,
  },
  cabecalhoVoltar: {
    alignItems: 'flex-end',
  },
  logo: {
    width: 180,
    height: 53,
    alignSelf: 'center',
  },
  cabecalho: {
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
  terminal: {
    fontSize: 15,
    fontWeight: '700',
    color: cores.sucesso,
  },
});
