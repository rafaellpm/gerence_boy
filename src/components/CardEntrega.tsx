import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Entrega } from '../services';
import { cores } from '../theme/colors';
import { formatarMoeda } from '../utils/dataHora';
import { BadgeSituacao } from './BadgeSituacao';

type CardEntregaProps = {
  entrega: Entrega;
  onPress: (entrega: Entrega) => void;
  /** Setas de reordenar — omitidas se não houver pra onde mover (primeiro/último item ou lista com 1 entrega). */
  onSubir?: () => void;
  onDescer?: () => void;
};

export function CardEntrega({ entrega, onPress, onSubir, onDescer }: CardEntregaProps) {
  return (
    <View style={styles.card}>
      <View style={styles.setas}>
        <Pressable onPress={onSubir} disabled={!onSubir} hitSlop={8} accessibilityLabel="Mover pra cima">
          <Icon name="chevron-up" size={22} color={onSubir ? cores.texto : cores.textoPlaceholder} />
        </Pressable>
        <Pressable onPress={onDescer} disabled={!onDescer} hitSlop={8} accessibilityLabel="Mover pra baixo">
          <Icon name="chevron-down" size={22} color={onDescer ? cores.texto : cores.textoPlaceholder} />
        </Pressable>
      </View>

      <Pressable style={styles.conteudo} onPress={() => onPress(entrega)} accessibilityRole="button">
        <View style={styles.cabecalho}>
          <Text style={styles.pedido}>{entrega.numeroPedido}</Text>
          <BadgeSituacao situacao={entrega.situacao} />
        </View>

        <Text style={styles.cliente}>{entrega.cliente}</Text>
        <Text style={styles.endereco}>{entrega.endereco}</Text>
        {entrega.valorTotal != null && (
          <Text style={styles.valor}>Valor: {formatarMoeda(entrega.valorTotal)}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: cores.superficie,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: cores.borda,
  },
  setas: {
    justifyContent: 'center',
    gap: 2,
  },
  conteudo: {
    flex: 1,
    gap: 4,
  },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pedido: {
    fontSize: 16,
    fontWeight: '700',
    color: cores.texto,
  },
  cliente: {
    fontSize: 15,
    fontWeight: '600',
    color: cores.texto,
  },
  endereco: {
    fontSize: 14,
    color: cores.textoSecundario,
  },
  valor: {
    fontSize: 14,
    fontWeight: '700',
    color: cores.sucesso,
  },
});
