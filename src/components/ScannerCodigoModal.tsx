import React, { useEffect, useRef } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  Camera,
  CodeType,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import { BotaoGrande } from './BotaoGrande';
import { cores } from '../theme/colors';

type ScannerCodigoModalProps = {
  visible: boolean;
  onFechar: () => void;
  onCodigoLido: (codigo: string) => void;
};

// Nota: apenas estes tipos são suportados pelo ML Kit no Android (o union
// type do TS inclui outros como "itf-14"/"gs1-data-bar-*" que só existem na
// implementação iOS — usá-los aqui derruba o CameraView com
// "The given value for codeType could not be parsed").
const TIPOS_DE_CODIGO: CodeType[] = [
  'qr',
  'code-128',
  'code-39',
  'code-93',
  'codabar',
  'ean-13',
  'ean-8',
  'itf',
  'upc-e',
  'upc-a',
  'pdf-417',
  'aztec',
  'data-matrix',
];

/**
 * Scanner de código de barras/QR em tela cheia, usando
 * `react-native-vision-camera` (`useCodeScanner`, via ML Kit — sem Frame
 * Processors, então sem depender de `react-native-worklets-core`/reanimated).
 */
export function ScannerCodigoModal({
  visible,
  onFechar,
  onCodigoLido,
}: ScannerCodigoModalProps) {
  const insets = useSafeAreaInsets();
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const jaLeuRef = useRef(false);

  const codeScanner = useCodeScanner({
    codeTypes: TIPOS_DE_CODIGO,
    onCodeScanned: codes => {
      if (jaLeuRef.current) {
        return;
      }
      const valor = codes.find(codigo => !!codigo.value)?.value;
      if (!valor) {
        return;
      }
      jaLeuRef.current = true;
      onCodigoLido(valor);
    },
  });

  useEffect(() => {
    if (!visible) {
      return;
    }
    jaLeuRef.current = false;
    if (!hasPermission) {
      requestPermission();
    }
  }, [visible, hasPermission, requestPermission]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onFechar}>
      <View style={styles.container}>
        {hasPermission && device ? (
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={visible}
            codeScanner={codeScanner}
          />
        ) : (
          <View style={styles.mensagemContainer}>
            <Text style={styles.mensagemTexto}>
              {hasPermission
                ? 'Nenhuma câmera traseira encontrada neste dispositivo.'
                : 'Precisamos da sua permissão para usar a câmera e ler o código.'}
            </Text>
            {!hasPermission && (
              <BotaoGrande
                titulo="Permitir câmera"
                icone="camera"
                onPress={requestPermission}
              />
            )}
          </View>
        )}

        {hasPermission && device && (
          <View style={styles.miraContainer} pointerEvents="none">
            <View style={styles.mira} />
            <Text style={styles.miraTexto}>Aponte para o código de barras ou QR code</Text>
          </View>
        )}

        <Pressable
          style={[styles.botaoFechar, { top: insets.top + 12 }]}
          onPress={onFechar}
          hitSlop={12}
        >
          <Icon name="close" size={18} color={cores.branco} />
          <Text style={styles.botaoFecharTexto}>Fechar</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.preto,
  },
  mensagemContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  mensagemTexto: {
    color: cores.branco,
    fontSize: 16,
    textAlign: 'center',
  },
  miraContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  mira: {
    width: '75%',
    aspectRatio: 1.4,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: cores.branco,
  },
  miraTexto: {
    color: cores.branco,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  botaoFechar: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  botaoFecharTexto: {
    color: cores.branco,
    fontSize: 14,
    fontWeight: '700',
  },
});
