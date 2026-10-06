import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Entrega } from '../services';
import { cores } from '../theme/colors';
import { BadgeSituacao } from './BadgeSituacao';
import { BotaoGrande } from './BotaoGrande';

type CardEntregaProps = {
  entrega: Entrega;
  onAbrirOpcoes: (entrega: Entrega) => void;
};

export function CardEntrega({ entrega, onAbrirOpcoes }: CardEntregaProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cabecalho}>
        <Text style={styles.pedido}>{entrega.numeroPedido}</Text>
        <BadgeSituacao situacao={entrega.situacao} />
      </View>

      <Text style={styles.cliente}>{entrega.cliente}</Text>
      <Text style={styles.endereco}>{entrega.endereco}</Text>

      <BotaoGrande
        titulo="Opções"
        variante="secundario"
        onPress={() => onAbrirOpcoes(entrega)}
        style={styles.botaoOpcoes}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: cores.superficie,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: cores.borda,
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
  botaoOpcoes: {
    marginTop: 8,
  },
});
