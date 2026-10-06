type Coordenada = { latitude: number; longitude: number };

type ResultadoNominatim = {
  lat: string;
  lon: string;
};

const cache = new Map<string, Coordenada | null>();

/**
 * Nominatim (geocoder público do OpenStreetMap, gratuito e sem API key —
 * mesma família do MapLibre/OpenFreeMap já usados no app) exige uso
 * moderado: no máximo 1 requisição por segundo. Essa fila serializa as
 * chamadas para respeitar o limite.
 */
let proximaChamadaLiberadaEm = 0;

function aguardarVez(): Promise<void> {
  const agora = Date.now();
  const espera = Math.max(0, proximaChamadaLiberadaEm - agora);
  proximaChamadaLiberadaEm = Math.max(agora, proximaChamadaLiberadaEm) + 1100;

  return new Promise(resolve => setTimeout(resolve, espera));
}

/**
 * Resolve latitude/longitude a partir de um endereço em texto, usando o
 * Nominatim. Guarda o resultado (inclusive "não encontrado") em cache de
 * memória, então o mesmo endereço só é consultado uma vez por sessão do
 * app.
 */
export async function geocodificarEndereco(endereco: string): Promise<Coordenada | null> {
  const chave = endereco.trim().toLowerCase();

  if (!chave) {
    return null;
  }

  if (cache.has(chave)) {
    return cache.get(chave) ?? null;
  }

  await aguardarVez();

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(endereco)}`;
    const resposta = await fetch(url, {
      headers: {
        // Exigido pela política de uso do Nominatim para identificar quem consulta.
        'User-Agent': 'GerenceBoy-AppEntregas/1.0',
        Referer: 'https://gerencesistemas.com.br',
      },
    });

    if (!resposta.ok) {
      cache.set(chave, null);
      return null;
    }

    const resultados = (await resposta.json()) as ResultadoNominatim[];
    const primeiro = resultados[0];

    const coordenada = primeiro
      ? { latitude: Number(primeiro.lat), longitude: Number(primeiro.lon) }
      : null;

    cache.set(chave, coordenada);
    return coordenada;
  } catch {
    cache.set(chave, null);
    return null;
  }
}
