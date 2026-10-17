import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { cores } from '../theme/colors';

type HeaderTextButtonProps = {
  titulo: string;
  onPress: () => void;
  onLongPress?: () => void;
  delayLongPress?: number;
  destrutivo?: boolean;
};

export function HeaderTextButton({
  titulo,
  onPress,
  onLongPress,
  delayLongPress,
  destrutivo = false,
}: HeaderTextButtonProps) {
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} delayLongPress={delayLongPress} hitSlop={12}>
      <Text style={[styles.texto, destrutivo && styles.textoDestrutivo]}>{titulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  texto: {
    fontSize: 16,
    fontWeight: '700',
    // cores.tabAtivo (não cores.primaria) — este botão vive dentro do
    // AppHeader, com fundo cores.tabFundo (azul-marinho escuro), e
    // cores.tabAtivo já é o azul claro escolhido pra legibilidade sobre
    // esse mesmo fundo (mesmo tom usado na aba ativa da barra).
    color: cores.tabAtivo,
    paddingHorizontal: 4,
  },
  textoDestrutivo: {
    color: cores.perigo,
  },
});
