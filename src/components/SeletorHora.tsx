import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
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

/** Seletor de horário usando o picker nativo (DateTimePicker), em vez de digitação livre. */
export function SeletorHora({ valor, placeholder, onAlterar }: SeletorHoraProps) {
  const [aberto, setAberto] = useState(false);

  function aoSelecionar(_evento: unknown, data?: Date) {
    if (Platform.OS === 'android') {
      setAberto(false);
    }
    if (data) {
      onAlterar(dataParaHorario(data));
    }
  }

  return (
    <View>
      <Pressable style={styles.input} onPress={() => setAberto(true)}>
        <Text style={valor ? styles.texto : styles.placeholder}>{valor || placeholder}</Text>
      </Pressable>

      {aberto && (
        <>
          <DateTimePicker
            value={horarioParaData(valor)}
            mode="time"
            is24Hour
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={aoSelecionar}
          />

          {Platform.OS === 'ios' && (
            <Pressable onPress={() => setAberto(false)} style={styles.botaoConcluir}>
              <Text style={styles.textoConcluir}>Concluído</Text>
            </Pressable>
          )}
        </>
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
  botaoConcluir: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  textoConcluir: {
    fontSize: 14,
    fontWeight: '700',
    color: cores.primaria,
  },
});
