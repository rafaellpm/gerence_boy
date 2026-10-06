import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { cores } from '../theme/colors';

type OpcaoLinhaProps = {
  icone: string;
  titulo: string;
  onPress: () => void;
  desabilitado?: boolean;
  carregando?: boolean;
  destrutivo?: boolean;
};

export function OpcaoLinha({
  icone,
  titulo,
  onPress,
  desabilitado = false,
  carregando = false,
  destrutivo = false,
}: OpcaoLinhaProps) {
  const inativo = desabilitado || carregando;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={inativo}
      style={({ pressed }) => [
        styles.linha,
        inativo && styles.desabilitada,
        pressed && !inativo && styles.pressionada,
      ]}
    >
      <Icon
        name={icone}
        size={22}
        color={destrutivo ? cores.perigo : cores.textoSecundario}
        style={styles.icone}
      />
      <View style={styles.textoContainer}>
        <Text style={[styles.titulo, destrutivo && styles.tituloDestrutivo]}>
          {titulo}
        </Text>
      </View>
      {carregando && <ActivityIndicator size="small" color={cores.textoSecundario} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: cores.divisor,
  },
  pressionada: {
    opacity: 0.6,
  },
  desabilitada: {
    opacity: 0.4,
  },
  icone: {
    width: 28,
    textAlign: 'center',
  },
  textoContainer: {
    flex: 1,
  },
  titulo: {
    fontSize: 16,
    fontWeight: '600',
    color: cores.texto,
  },
  tituloDestrutivo: {
    color: cores.perigo,
  },
});
