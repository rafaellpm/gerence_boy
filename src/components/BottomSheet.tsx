import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cores } from '../theme/colors';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

/**
 * Bottom sheet simples baseado em `Modal` (sem `react-native-gesture-handler`
 * nem `react-native-reanimated`) — evita reintroduzir a dependência de
 * gesture-handler, que já quebrou o build C++ no Windows neste projeto
 * (ver roadmap/01-arquitetura-tecnica.md).
 *
 * O conteúdo fica dentro de um `KeyboardAvoidingView` pra subir junto com o
 * teclado no iOS (lá o `Modal` não redimensiona a tela sozinho como o
 * Android costuma fazer) — sem isso, campos no fim do sheet ficavam atrás
 * do teclado.
 */
export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Fechar"
      />
      <KeyboardAvoidingView
        style={styles.wrapperTeclado}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
      >
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.alca} />
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(11,18,32,0.45)',
  },
  wrapperTeclado: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: cores.superficie,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: 20,
    gap: 4,
  },
  alca: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: cores.handleBottomSheet,
    marginBottom: 14,
  },
});
