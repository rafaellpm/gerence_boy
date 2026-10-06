import { Linking } from 'react-native';
import { Entrega } from '../services';

function parametroDestino(entrega: Entrega): string {
  if (entrega.latitude != null && entrega.longitude != null) {
    return `${entrega.latitude},${entrega.longitude}`;
  }
  return encodeURIComponent(entrega.endereco);
}

/**
 * Monta a URI do Google Maps para a entrega e abre via Intent/URI
 * (Linking.openURL) — sem navegação GPS embutida no app.
 */
export async function abrirEntregaNoGoogleMaps(entrega: Entrega): Promise<void> {
  const uri = montarUriGoogleMaps(entrega);
  await Linking.openURL(uri);
}

export function montarUriGoogleMaps(entrega: Entrega): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${parametroDestino(entrega)}`;
}

/**
 * Monta uma rota com várias paradas no Google Maps (destino = última
 * entrega, as demais entram como `waypoints`, na ordem da fila). O
 * `origin` fica de fora de propósito — sem ele, o Google Maps usa a
 * localização atual do entregador como ponto de partida.
 */
export function montarUriRotaCompletaGoogleMaps(entregas: Entrega[]): string {
  if (entregas.length === 0) {
    throw new Error('Nenhuma entrega para montar a rota.');
  }

  const destino = entregas[entregas.length - 1];
  const paradasIntermediarias = entregas.slice(0, -1);

  const parametros = [
    'api=1',
    `destination=${parametroDestino(destino)}`,
    paradasIntermediarias.length > 0
      ? `waypoints=${paradasIntermediarias.map(parametroDestino).join('|')}`
      : null,
  ].filter(Boolean);

  return `https://www.google.com/maps/dir/?${parametros.join('&')}`;
}

/** Abre a rota com todas as entregas (na ordem da fila) no app do Google Maps. */
export async function abrirRotaCompletaNoGoogleMaps(entregas: Entrega[]): Promise<void> {
  const uri = montarUriRotaCompletaGoogleMaps(entregas);
  await Linking.openURL(uri);
}
