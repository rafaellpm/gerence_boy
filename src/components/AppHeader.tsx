import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cores } from '../theme/colors';

type AppHeaderProps = {
  titulo: string;
  subtitulo?: string;
  direita?: React.ReactNode;
};

/**
 * Header genérico usado nas telas do bottom tab navigator no lugar do header
 * nativo (desativado em `MainTabNavigator` via `headerShown: false`) — usa a
 * mesma cor de base da barra de abas (`cores.tabFundo`), pra manter a marca
 * consistente no topo e no rodapé do app, não só na barra inferior.
 */
export function AppHeader({ titulo, subtitulo, direita }: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.textos}>
        <Text style={styles.titulo} numberOfLines={1}>
          {titulo}
        </Text>
        {subtitulo ? (
          <Text style={styles.subtitulo} numberOfLines={1}>
            {subtitulo}
          </Text>
        ) : null}
      </View>

      {direita}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: cores.tabFundo,
  },
  textos: {
    flex: 1,
    gap: 2,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '800',
    color: cores.branco,
  },
  subtitulo: {
    fontSize: 13,
    color: cores.tabInativo,
  },
});
