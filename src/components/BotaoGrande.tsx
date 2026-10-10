import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { cores } from '../theme/colors';

type Variante = 'primario' | 'secundario' | 'perigo';

type BotaoGrandeProps = {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  icone?: string;
  carregando?: boolean;
  desabilitado?: boolean;
  /** Versão menor (altura/fonte/ícone reduzidos) — para telas com vários botões em pouco espaço, como o cartão de informações do Mapa. */
  compacto?: boolean;
  style?: ViewStyle;
};

const CORES_VARIANTE: Record<Variante, { fundo: string; texto: string }> = {
  primario: { fundo: cores.primaria, texto: cores.primariaTexto },
  secundario: { fundo: cores.secundaria, texto: cores.secundariaTexto },
  perigo: { fundo: cores.perigo, texto: cores.perigoTexto },
};

export function BotaoGrande({
  titulo,
  onPress,
  variante = 'primario',
  icone,
  carregando = false,
  desabilitado = false,
  compacto = false,
  style,
}: BotaoGrandeProps) {
  const coresVariante = CORES_VARIANTE[variante];
  const inativo = desabilitado || carregando;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={inativo}
      style={({ pressed }) => [
        styles.botao,
        compacto && styles.botaoCompacto,
        { backgroundColor: coresVariante.fundo },
        inativo && styles.desabilitado,
        pressed && !inativo && styles.pressionado,
        style,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={coresVariante.texto} />
      ) : (
        <>
          {icone && (
            <Icon
              name={icone}
              size={compacto ? 16 : 20}
              color={coresVariante.texto}
              style={styles.icone}
            />
          )}
          <Text style={[styles.texto, compacto && styles.textoCompacto, { color: coresVariante.texto }]}>
            {titulo}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    minHeight: 56,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  botaoCompacto: {
    minHeight: 40,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  icone: {
    marginRight: 10,
  },
  texto: {
    fontSize: 18,
    fontWeight: '700',
  },
  textoCompacto: {
    fontSize: 14,
  },
  pressionado: {
    opacity: 0.85,
  },
  desabilitado: {
    opacity: 0.5,
  },
});
