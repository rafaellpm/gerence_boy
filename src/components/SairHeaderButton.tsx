import React from 'react';
import { Alert } from 'react-native';
import { useSair } from '../navigation/SairContext';
import { HeaderTextButton } from './HeaderTextButton';

export function SairHeaderButton() {
  const { sair, limparDadosDeVendas } = useSair();

  function confirmarSaida() {
    Alert.alert(
      'Sair',
      'Deseja encerrar a sessão deste entregador? A lista de entregas bipadas nesta sessão será perdida.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: sair },
      ],
    );
  }

  function confirmarLimpezaTotal() {
    Alert.alert(
      'Apagar todas as vendas do aparelho',
      'Isso remove permanentemente todas as entregas e pagamentos salvos neste aparelho, de qualquer entregador. A configuração do servidor é mantida. Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Apagar tudo', style: 'destructive', onPress: () => limparDadosDeVendas() },
      ],
    );
  }

  return (
    <HeaderTextButton
      titulo="Sair"
      onPress={confirmarSaida}
      onLongPress={confirmarLimpezaTotal}
      delayLongPress={3000}
      destrutivo
    />
  );
}
