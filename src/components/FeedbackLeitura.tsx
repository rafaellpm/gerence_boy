import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { cores } from '../theme/colors';

export type TipoFeedback = 'sucesso' | 'erro' | 'aviso';

type FeedbackLeituraProps = {
  tipo: TipoFeedback;
  mensagem: string;
};

const CORES_TIPO: Record<TipoFeedback, { fundo: string; texto: string }> = {
  sucesso: { fundo: cores.sucesso, texto: cores.branco },
  erro: { fundo: cores.perigo, texto: cores.branco },
  aviso: { fundo: cores.aviso, texto: cores.branco },
};

export function FeedbackLeitura({ tipo, mensagem }: FeedbackLeituraProps) {
  const coresTipo = CORES_TIPO[tipo];

  return (
    <Text
      style={[styles.banner, { backgroundColor: coresTipo.fundo, color: coresTipo.texto }]}
    >
      {mensagem}
    </Text>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
