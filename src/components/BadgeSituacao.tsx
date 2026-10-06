import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SituacaoEntrega } from '../services';
import { cores } from '../theme/colors';

const CONFIG: Record<SituacaoEntrega, { texto: string; cor: string }> = {
  PENDENTE: { texto: 'Pendente', cor: cores.aviso },
  EM_ROTA: { texto: 'Em rota', cor: cores.primaria },
  ENTREGUE: { texto: 'Entregue', cor: cores.sucesso },
  CANCELADA: { texto: 'Cancelada', cor: cores.perigo },
};

export function BadgeSituacao({ situacao }: { situacao: SituacaoEntrega }) {
  const config = CONFIG[situacao];

  return (
    <View style={[styles.badge, { backgroundColor: `${config.cor}22` }]}>
      <View style={[styles.ponto, { backgroundColor: config.cor }]} />
      <Text style={[styles.texto, { color: config.cor }]}>{config.texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 6,
  },
  ponto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  texto: {
    fontSize: 13,
    fontWeight: '700',
  },
});
