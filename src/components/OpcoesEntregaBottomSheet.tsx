import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Entrega } from '../services';
import { cores } from '../theme/colors';
import { BadgeSituacao } from './BadgeSituacao';
import { BottomSheet } from './BottomSheet';
import { OpcaoLinha } from './OpcaoLinha';

type OpcoesEntregaBottomSheetProps = {
  entrega: Entrega | null;
  onFechar: () => void;
  onVerMapaNoApp: (entrega: Entrega) => void;
  onAbrirGoogleMaps: (entrega: Entrega) => void;
  onMarcarEntregue: (entrega: Entrega) => void;
  marcando?: boolean;
};

export function OpcoesEntregaBottomSheet({
  entrega,
  onFechar,
  onVerMapaNoApp,
  onAbrirGoogleMaps,
  onMarcarEntregue,
  marcando = false,
}: OpcoesEntregaBottomSheetProps) {
  const podeMarcarEntregue =
    !!entrega && entrega.situacao !== 'ENTREGUE' && entrega.situacao !== 'CANCELADA';

  return (
    <BottomSheet visible={!!entrega} onClose={onFechar}>
      {entrega && (
        <>
          <View style={styles.cabecalho}>
            <View style={styles.cabecalhoTextos}>
              <Text style={styles.pedido}>{entrega.numeroPedido}</Text>
              <Text style={styles.cliente}>{entrega.cliente}</Text>
            </View>
            <BadgeSituacao situacao={entrega.situacao} />
          </View>

          <View style={styles.opcoes}>
            <OpcaoLinha
              icone="map-outline"
              titulo="Ver mapa no app"
              onPress={() => onVerMapaNoApp(entrega)}
            />
            <OpcaoLinha
              icone="google-maps"
              titulo="Abrir no Google Maps"
              onPress={() => onAbrirGoogleMaps(entrega)}
            />
            {podeMarcarEntregue && (
              <OpcaoLinha
                icone="check-circle-outline"
                titulo="Marcar como entregue"
                onPress={() => onMarcarEntregue(entrega)}
                carregando={marcando}
              />
            )}
          </View>
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cabecalhoTextos: {
    gap: 2,
    flexShrink: 1,
  },
  pedido: {
    fontSize: 18,
    fontWeight: '800',
    color: cores.texto,
  },
  cliente: {
    fontSize: 14,
    color: cores.textoSecundario,
  },
  opcoes: {
    marginTop: 4,
  },
});
