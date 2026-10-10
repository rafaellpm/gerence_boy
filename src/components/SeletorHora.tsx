import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { cores } from '../theme/colors';

type SeletorHoraProps = {
  valor: string;
  placeholder: string;
  onAlterar: (horario: string) => void;
};

function horarioParaData(horario: string): Date {
  const data = new Date();
  const combina = /^(\d{2}):(\d{2})$/.exec(horario);

  if (combina) {
    data.setHours(Number(combina[1]), Number(combina[2]), 0, 0);
  } else {
    data.setHours(0, 0, 0, 0);
  }

  return data;
}

function dataParaHorario(data: Date): string {
  const hora = String(data.getHours()).padStart(2, '0');
  const minuto = String(data.getMinutes()).padStart(2, '0');
  return `${hora}:${minuto}`;
}

/**
 * Seletor de horário usando o picker nativo (DateTimePicker), em vez de
 * digitação livre.
 *
 * No Android, `display="default"` já abre um diálogo nativo que bloqueia o
 * resto da tela e fecha sozinho. No iOS, `display="spinner"` é inline (não
 * bloqueia nada) e segue o tema do sistema — num app que força fundo claro
 * isso deixava o spinner com texto ilegível, e dava pra abrir o outro campo
 * por cima sem fechar o primeiro. Por isso no iOS o spinner vai dentro de um
 * Modal próprio (fundo/cor fixos, com "Cancelar"/"Concluído"), que bloqueia
 * o toque em qualquer outro campo enquanto estiver aberto.
 */
export function SeletorHora({ valor, placeholder, onAlterar }: SeletorHoraProps) {
  const [aberto, setAberto] = useState(false);
  const [valorTemporario, setValorTemporario] = useState<Date>(() => horarioParaData(valor));

  function abrir() {
    setValorTemporario(horarioParaData(valor));
    setAberto(true);
  }

  function fechar() {
    setAberto(false);
  }

  function confirmar() {
    onAlterar(dataParaHorario(valorTemporario));
    setAberto(false);
  }

  function aoMudarAndroid(_evento: unknown, data?: Date) {
    setAberto(false);
    if (data) {
      onAlterar(dataParaHorario(data));
    }
  }

  function aoMudarIos(_evento: unknown, data?: Date) {
    if (data) {
      setValorTemporario(data);
    }
  }

  return (
    <View>
      <Pressable style={styles.input} onPress={abrir}>
        <Text style={valor ? styles.texto : styles.placeholder}>{valor || placeholder}</Text>
      </Pressable>

      {Platform.OS === 'android' && aberto && (
        <DateTimePicker value={valorTemporario} mode="time" is24Hour display="default" onChange={aoMudarAndroid} />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={aberto} transparent animationType="fade" onRequestClose={fechar}>
          <Pressable style={styles.fundoModal} onPress={fechar}>
            <Pressable style={styles.cartao} onPress={() => {}}>
              <View style={styles.cabecalhoCartao}>
                <Pressable onPress={fechar} hitSlop={8}>
                  <Text style={styles.textoCancelar}>Cancelar</Text>
                </Pressable>
                <Pressable onPress={confirmar} hitSlop={8}>
                  <Text style={styles.textoConcluir}>Concluído</Text>
                </Pressable>
              </View>

              <DateTimePicker
                value={valorTemporario}
                mode="time"
                is24Hour
                display="spinner"
                themeVariant="light"
                textColor={cores.texto}
                style={styles.picker}
                onChange={aoMudarIos}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: cores.bordaForte,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: cores.superficie,
  },
  texto: {
    fontSize: 15,
    color: cores.texto,
  },
  placeholder: {
    fontSize: 15,
    color: cores.textoPlaceholder,
  },
  fundoModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  cartao: {
    backgroundColor: cores.superficie,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  cabecalhoCartao: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: cores.divisor,
  },
  textoCancelar: {
    fontSize: 15,
    fontWeight: '600',
    color: cores.textoSecundario,
  },
  textoConcluir: {
    fontSize: 15,
    fontWeight: '700',
    color: cores.primaria,
  },
  picker: {
    backgroundColor: cores.superficie,
  },
});
