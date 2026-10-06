import React from 'react';
import { Alert } from 'react-native';
import { useSair } from '../navigation/SairContext';
import { HeaderTextButton } from './HeaderTextButton';

export function SairHeaderButton() {
  const sair = useSair();

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

  return <HeaderTextButton titulo="Sair" onPress={confirmarSaida} destrutivo />;
}
