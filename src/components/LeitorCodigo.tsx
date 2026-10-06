import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BotaoGrande } from './BotaoGrande';
import { ScannerCodigoModal } from './ScannerCodigoModal';
import { cores } from '../theme/colors';

type LeitorCodigoProps = {
  titulo: string;
  onLer: (codigo: string) => void;
  carregando?: boolean;
};

export function LeitorCodigo({ titulo, onLer, carregando = false }: LeitorCodigoProps) {
  const [scannerAberto, setScannerAberto] = useState(false);

  function lerCodigoDaCamera(valor: string) {
    setScannerAberto(false);
    onLer(valor);
  }

  return (
    <View style={styles.container}>
      <View style={styles.visor}>
        <Text style={styles.visorTitulo}>{titulo}</Text>
        <BotaoGrande
          titulo="Abrir câmera"
          icone="camera"
          onPress={() => setScannerAberto(true)}
          desabilitado={carregando}
        />
      </View>

      <ScannerCodigoModal
        visible={scannerAberto}
        onFechar={() => setScannerAberto(false)}
        onCodigoLido={lerCodigoDaCamera}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  visor: {
    borderRadius: 16,
    padding: 20,
    gap: 14,
    backgroundColor: cores.fundo,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  visorTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: cores.texto,
    textAlign: 'center',
  },
});
