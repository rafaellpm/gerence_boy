import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Camera, CameraRef, Map, Marker } from '@maplibre/maplibre-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
import { BotaoGrande } from '../../components/BotaoGrande';
import { FormaPagamentoModal } from '../../components/FormaPagamentoModal';
import { SairHeaderButton } from '../../components/SairHeaderButton';
import { useEntregadorContext } from '../../contexts/EntregadorContext';
import { MainTabParamList } from '../../navigation/types';
import { geocodificarEndereco } from '../../services/geocodingService';
import { Entrega, FormaPagamento } from '../../services';
import { cores } from '../../theme/colors';
import { abrirEntregaNoGoogleMaps, abrirRotaCompletaNoGoogleMaps } from '../../utils/maps';

type Props = BottomTabScreenProps<MainTabParamList, 'Mapa'>;

/**
 * Estilo vetorial gratuito da OpenFreeMap (baseado em dados do
 * OpenStreetMap) — sem API key nem conta de terceiro, ao contrário do
 * Google Maps.
 */
const ESTILO_MAPA = 'https://tiles.openfreemap.org/styles/liberty';

const ZOOM_FOCO = 16;

type Coordenada = { latitude: number; longitude: number };

function coordenadaPropria(entrega: Entrega): Coordenada | null {
  if (entrega.latitude != null && entrega.longitude != null) {
    return { latitude: entrega.latitude, longitude: entrega.longitude };
  }
  return null;
}

export function MapaEntregaScreen(_props: Props) {
  const { entregas, entregaEmFoco, focarEntregaNoMapa, confirmarEntregaLocal } =
    useEntregadorContext();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraRef>(null);

  const [coordenadasGeocodificadas, setCoordenadasGeocodificadas] = useState<
    Record<string, Coordenada>
  >({});
  const [mostrandoTodas, setMostrandoTodas] = useState(false);
  const [entregaParaPagamento, setEntregaParaPagamento] = useState<Entrega | null>(null);
  const [confirmandoPagamento, setConfirmandoPagamento] = useState(false);

  const entregasPendentes = entregas.filter(
    item => item.situacao === 'PENDENTE' || item.situacao === 'EM_ROTA',
  );

  const entregaAtual = entregaEmFoco ?? entregasPendentes[0] ?? null;

  // Geocodifica (via Nominatim/OSM) o endereço de quem ainda não tem
  // latitude/longitude, pra dar pra colocar todas as paradas no mapa mesmo
  // quando a API não manda coordenadas — uma de cada vez, em segundo plano.
  useEffect(() => {
    let cancelado = false;

    async function geocodificarPendentes() {
      for (const entrega of entregasPendentes) {
        if (cancelado) {
          return;
        }
        if (coordenadaPropria(entrega) || coordenadasGeocodificadas[entrega.codigo]) {
          continue;
        }

        const resultado = await geocodificarEndereco(entrega.endereco);

        if (!cancelado && resultado) {
          setCoordenadasGeocodificadas(atual => ({ ...atual, [entrega.codigo]: resultado }));
        }
      }
    }

    geocodificarPendentes();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só precisa reagir à lista de códigos pendentes
  }, [entregasPendentes.map(item => item.codigo).join(',')]);

  function coordenadaDe(entrega: Entrega): Coordenada | null {
    return coordenadaPropria(entrega) ?? coordenadasGeocodificadas[entrega.codigo] ?? null;
  }

  const pontos = entregasPendentes
    .map(entrega => ({ entrega, coordenada: coordenadaDe(entrega) }))
    .filter((ponto): ponto is { entrega: Entrega; coordenada: Coordenada } => !!ponto.coordenada);

  const coordenadaAtual = entregaAtual ? coordenadaDe(entregaAtual) : null;

  // Sempre que a entrega atual muda (por exemplo, ao marcar a anterior como
  // entregue) o mapa avança automaticamente pra próxima parada.
  const latitudeAtual = coordenadaAtual?.latitude;
  const longitudeAtual = coordenadaAtual?.longitude;

  useEffect(() => {
    if (!mostrandoTodas && latitudeAtual != null && longitudeAtual != null) {
      cameraRef.current?.flyTo({
        center: [longitudeAtual, latitudeAtual],
        zoom: ZOOM_FOCO,
        duration: 700,
      });
    }
  }, [mostrandoTodas, latitudeAtual, longitudeAtual]);

  useEffect(() => {
    if (!mostrandoTodas || pontos.length === 0) {
      return;
    }

    if (pontos.length === 1) {
      cameraRef.current?.flyTo({
        center: [pontos[0].coordenada.longitude, pontos[0].coordenada.latitude],
        zoom: ZOOM_FOCO,
        duration: 700,
      });
      return;
    }

    const latitudes = pontos.map(ponto => ponto.coordenada.latitude);
    const longitudes = pontos.map(ponto => ponto.coordenada.longitude);

    cameraRef.current?.fitBounds(
      [Math.min(...longitudes), Math.min(...latitudes), Math.max(...longitudes), Math.max(...latitudes)],
      { padding: { left: 60, right: 60, top: 80, bottom: 220 }, duration: 700 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recalcula só quando a lista de pontos muda
  }, [mostrandoTodas, pontos.map(ponto => ponto.entrega.codigo).join(',')]);

  function handleFocarProxima() {
    focarEntregaNoMapa(null);
    setMostrandoTodas(false);
  }

  async function handleAbrirGoogleMaps() {
    if (!entregaAtual) {
      return;
    }
    try {
      await abrirEntregaNoGoogleMaps(entregaAtual);
    } catch {
      Alert.alert('Não foi possível abrir o Google Maps', 'Verifique se o app está instalado.');
    }
  }

  async function handleAbrirRotaCompleta() {
    try {
      await abrirRotaCompletaNoGoogleMaps(entregasPendentes);
    } catch {
      Alert.alert('Não foi possível abrir o Google Maps', 'Verifique se o app está instalado.');
    }
  }

  function handleMarcarEntregue() {
    if (!entregaAtual) {
      return;
    }
    setEntregaParaPagamento(entregaAtual);
  }

  async function handleConfirmarPagamento(formaPagamento: FormaPagamento, valor: number) {
    if (!entregaParaPagamento) {
      return;
    }

    setConfirmandoPagamento(true);

    try {
      await confirmarEntregaLocal(entregaParaPagamento.codigo, formaPagamento, valor);
      setEntregaParaPagamento(null);
    } catch {
      Alert.alert('Erro ao marcar entrega', 'Não foi possível salvar no banco local do dispositivo.');
    } finally {
      setConfirmandoPagamento(false);
    }
  }

  if (!entregaAtual) {
    return (
      <View style={styles.raiz}>
        <AppHeader titulo="Mapa" direita={<SairHeaderButton />} />

        <SafeAreaView style={styles.containerVazio} edges={['left', 'right', 'bottom']}>
          <Text style={styles.textoVazio}>
            Nenhuma entrega para mostrar no mapa. Bipe um pedido na aba Minhas entregas.
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.raiz}>
      <AppHeader titulo="Mapa" direita={<SairHeaderButton />} />

      <View style={styles.container}>
        {pontos.length > 0 ? (
          <Map style={StyleSheet.absoluteFill} mapStyle={ESTILO_MAPA}>
            <Camera ref={cameraRef} initialViewState={{ zoom: ZOOM_FOCO }} />

            {pontos.map(({ entrega, coordenada }) => {
              const emFoco = entrega.codigo === entregaAtual.codigo;
              return (
                <Marker
                  key={entrega.codigo}
                  lngLat={[coordenada.longitude, coordenada.latitude]}
                  onPress={() => focarEntregaNoMapa(entrega)}
                >
                  <Icon
                    name="map-marker"
                    size={emFoco ? 44 : 30}
                    color={emFoco ? cores.primaria : cores.tabInativo}
                  />
                </Marker>
              );
            })}
          </Map>
        ) : (
          <View style={styles.containerVazio}>
            <Text style={styles.textoVazio}>Localizando endereço no mapa…</Text>
          </View>
        )}

        <View style={[styles.cartao, { bottom: insets.bottom + 16 }]}>
          <View style={styles.linhaTitulo}>
            <Text style={styles.pedido}>{entregaAtual.numeroPedido}</Text>
            {entregasPendentes.length > 1 && (
              <Text style={styles.contador}>
                1 de {entregasPendentes.length} paradas
              </Text>
            )}
          </View>
          <Text style={styles.cliente}>{entregaAtual.cliente}</Text>
          <Text style={styles.endereco}>{entregaAtual.endereco}</Text>

          <View style={styles.linhaBotoesSecundarios}>
            <BotaoGrande
              titulo={mostrandoTodas ? 'Focar na próxima' : 'Ver todas as paradas'}
              variante="secundario"
              icone={mostrandoTodas ? 'target' : 'map-marker-multiple-outline'}
              onPress={mostrandoTodas ? handleFocarProxima : () => setMostrandoTodas(true)}
              style={styles.botaoSecundarioFlex}
            />
          </View>

          <BotaoGrande titulo="Abrir no Google Maps" onPress={handleAbrirGoogleMaps} />

          {entregasPendentes.length > 1 && (
            <BotaoGrande
              titulo="Abrir rota completa no Google Maps"
              variante="secundario"
              icone="routes"
              onPress={handleAbrirRotaCompleta}
            />
          )}

          <BotaoGrande
            titulo="Marcar como entregue"
            variante="perigo"
            icone="check-circle-outline"
            onPress={handleMarcarEntregue}
          />
        </View>
      </View>

      <FormaPagamentoModal
        entrega={entregaParaPagamento}
        onFechar={() => setEntregaParaPagamento(null)}
        onConfirmar={handleConfirmarPagamento}
        confirmando={confirmandoPagamento}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  containerVazio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  textoVazio: {
    fontSize: 15,
    color: cores.textoSecundario,
    textAlign: 'center',
  },
  cartao: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: cores.superficie,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: cores.borda,
    shadowColor: cores.texto,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  linhaTitulo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contador: {
    fontSize: 12,
    fontWeight: '600',
    color: cores.textoSecundario,
  },
  pedido: {
    fontSize: 16,
    fontWeight: '700',
    color: cores.texto,
  },
  cliente: {
    fontSize: 14,
    fontWeight: '600',
    color: cores.texto,
  },
  endereco: {
    fontSize: 13,
    color: cores.textoSecundario,
    marginBottom: 2,
  },
  linhaBotoesSecundarios: {
    flexDirection: 'row',
  },
  botaoSecundarioFlex: {
    flex: 1,
  },
});
