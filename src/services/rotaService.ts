type Coordenada = { latitude: number; longitude: number };

type RespostaOsrm = {
  code: string;
  routes?: { geometry: GeoJSON.LineString }[];
};

/**
 * Busca o trajeto rodoviário entre dois pontos via OSRM (roteador público
 * gratuito baseado em dados do OpenStreetMap, sem API key — mesma família
 * do MapLibre/Nominatim já usados no app). Usa a demo server pública
 * (router.project-osrm.org): sem SLA, só pra pré-visualização do caminho no
 * mapa — a navegação de verdade continua pelo Google Maps.
 */
export async function buscarRota(origem: Coordenada, destino: Coordenada): Promise<GeoJSON.LineString | null> {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${origem.longitude},${origem.latitude};${destino.longitude},${destino.latitude}` +
      `?overview=full&geometries=geojson`;

    const resposta = await fetch(url);
    if (!resposta.ok) {
      return null;
    }

    const dados = (await resposta.json()) as RespostaOsrm;
    if (dados.code !== 'Ok') {
      return null;
    }

    return dados.routes?.[0]?.geometry ?? null;
  } catch {
    return null;
  }
}
