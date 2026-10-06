import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
import { FeedbackLeitura, TipoFeedback } from '../../components/FeedbackLeitura';
import { LeitorCodigo } from '../../components/LeitorCodigo';
import { SairHeaderButton } from '../../components/SairHeaderButton';
import { useEntregadorContext } from '../../contexts/EntregadorContext';
import { MainTabParamList } from '../../navigation/types';
import { entregaService } from '../../services';
import { cores } from '../../theme/colors';

type Props = BottomTabScreenProps<MainTabParamList, 'Bipagem'>;

export function BipagemEntregasScreen(_props: Props) {
  const { entregador, entregas, adicionarEntrega } = useEntregadorContext();
  const [carregando, setCarregando] = useState(false);
  const [feedback, setFeedback] = useState<
    { tipo: TipoFeedback; mensagem: string } | null
  >(null);

  async function lerCodigoEntrega(codigo: string) {
    setFeedback(null);
    setCarregando(true);

    try {
      const entrega = await entregaService.buscarPorCodigo(codigo);

      if (!entrega) {
        setFeedback({ tipo: 'erro', mensagem: `Entrega não encontrada (código ${codigo}).` });
        return;
      }

      const resultado = await adicionarEntrega(entrega);

      if (resultado === 'DUPLICADA') {
        setFeedback({ tipo: 'aviso', mensagem: `${entrega.numeroPedido} já está na lista.` });
        return;
      }

      setFeedback({ tipo: 'sucesso', mensagem: `${entrega.numeroPedido} adicionada — ${entrega.cliente}.` });
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View style={styles.raiz}>
      <AppHeader
        titulo={entregador?.nome ?? 'Entregador'}
        subtitulo={`${entregas.length} entrega(s) pra entregar.`}
        direita={<SairHeaderButton />}
      />

      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <LeitorCodigo
          titulo="Leitura das entregas"
          onLer={lerCodigoEntrega}
          carregando={carregando}
        />

        {feedback && <FeedbackLeitura tipo={feedback.tipo} mensagem={feedback.mensagem} />}
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
    gap: 20,
  },
});
