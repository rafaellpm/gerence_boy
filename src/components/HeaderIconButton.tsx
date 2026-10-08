import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { cores } from '../theme/colors';

type HeaderIconButtonProps = {
  icone: string;
  onPress: () => void;
  carregando?: boolean;
  desabilitado?: boolean;
};

export function HeaderIconButton({ icone, onPress, carregando = false, desabilitado = false }: HeaderIconButtonProps) {
  if (carregando) {
    return <ActivityIndicator color={cores.tabAtivo} style={styles.botao} />;
  }

  return (
    <Pressable onPress={onPress} disabled={desabilitado} hitSlop={12} style={styles.botao}>
      <Icon name={icone} size={24} color={cores.tabAtivo} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    padding: 4,
  },
});
