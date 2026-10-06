/**
 * Configuração base da API do servidorGerencePlus (Delphi + Horse, ver
 * `THorse.Listen` em uPrincipal.pas do projeto servidorGerencePlus).
 *
 * O IP/porta não é mais fixo no código: é definido pelo usuário na
 * `ConfiguracaoScreen` (persistido via `localDb`) e aplicado aqui em tempo
 * de execução através de `configurarApiBaseUrl`, chamado pela `SplashScreen`
 * assim que a configuração salva é carregada.
 */
let apiBaseUrl: string | null = null;

export function configurarApiBaseUrl(ip: string, porta: string): void {
  apiBaseUrl = `http://${ip}:${porta}`;
}

function obterApiBaseUrlObrigatoria(): string {
  if (!apiBaseUrl) {
    throw new Error(
      'URL do servidor não configurada — configure o IP e a porta antes de usar a API.',
    );
  }
  return apiBaseUrl;
}

/**
 * TODO(config): código da empresa (parâmetro `empresa` exigido pelas rotas
 * do servidor) — ajustar para o código real de cada instalação.
 */
export const CD_EMPRESA = 1;

/**
 * Tipo de pedido "entrega", usado no parâmetro `tipoPedido` da rota
 * `/PedidoNr`. Segue a mesma convenção adotada em outras consultas do
 * servidor (TIPO_MOVIMENTO/TP_PEDIDO = 4 para entrega).
 */
export const TP_PEDIDO_ENTREGA = 4;

export const ATRASO_SIMULADO_MS = 600;

export function atraso(ms: number = ATRASO_SIMULADO_MS): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Data de hoje no formato ISO (yyyy-MM-dd) exigido pelos parâmetros `data`/`StrToDate` do servidor. */
export function dataDeHojeIso(): string {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function montarUrl(caminho: string, query: Record<string, string | number>): string {
  const baseUrl = obterApiBaseUrlObrigatoria();
  const parametros = new URLSearchParams(
    Object.entries(query).map(([chave, valor]) => [chave, String(valor)]),
  ).toString();

  return parametros ? `${baseUrl}/${caminho}?${parametros}` : `${baseUrl}/${caminho}`;
}

/**
 * GET genérico para as rotas Horse do servidorGerencePlus. Os handlers do
 * servidor sempre serializam os campos como string (`Fields[i].AsString`),
 * então quem consome a resposta é responsável por converter número/data.
 */
export async function apiGet<T>(
  caminho: string,
  query: Record<string, string | number> = {},
): Promise<T> {
  const resposta = await fetch(montarUrl(caminho, query));

  if (!resposta.ok) {
    throw new Error(`Falha ao consultar ${caminho} (HTTP ${resposta.status}).`);
  }

  return resposta.json() as Promise<T>;
}

export async function apiGetOuNulo<T>(
  caminho: string,
  query: Record<string, string | number> = {},
): Promise<T | null> {
  const resposta = await fetch(montarUrl(caminho, query));

  if (resposta.status === 404) {
    return null;
  }

  if (!resposta.ok) {
    throw new Error(`Falha ao consultar ${caminho} (HTTP ${resposta.status}).`);
  }

  return resposta.json() as Promise<T>;
}

/**
 * Testa se o servidor responde em `/ping` (usado antes de salvar a
 * configuração). Recebe IP/porta explícitos para testar antes de aplicá-los.
 * Retorna `null` quando conectou, ou o motivo da falha.
 */
export async function testarConexao(ip: string, porta: string, tempoLimiteMs = 8000): Promise<string | null> {
  const url = `http://${ip}:${porta}/ping`;
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), tempoLimiteMs);
  try {
    const resposta = await fetch(url, { signal: controle.signal });
    return resposta.ok ? null : `O servidor respondeu HTTP ${resposta.status} em ${url}.`;
  } catch (erro) {
    if ((erro as Error)?.name === 'AbortError') {
      return `Sem resposta de ${url} em ${tempoLimiteMs / 1000}s. Verifique se o aparelho está na mesma rede do servidor e se o ServidorGerencePlus está aberto.`;
    }
    return `Falha de rede ao acessar ${url} (${(erro as Error)?.message || 'erro desconhecido'}). Verifique o Wi-Fi e o IP informado.`;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * POST para as rotas Horse que respondem com texto puro (ex.: `/Terminal`
 * devolve o código do terminal). Sem corpo; os dados vão na query string.
 */
export async function apiPostTexto(
  caminho: string,
  query: Record<string, string | number> = {},
): Promise<string> {
  const resposta = await fetch(montarUrl(caminho, query), { method: 'POST' });
  const texto = (await resposta.text()).trim();

  if (!resposta.ok) {
    throw new Error(texto || `Falha ao enviar ${caminho} (HTTP ${resposta.status}).`);
  }
  return texto;
}

/**
 * PUT genérico para as rotas Horse do servidorGerencePlus que respondem com
 * um Boolean serializado como texto puro (`Res.Send(vResposta.ToString)`,
 * ou seja "True"/"False" — não é JSON). Uma resposta 404 é um "não
 * encontrado" esperado (a rota devolve "False" + 404 quando o registro não
 * existe/não está mais em aberto), não um erro de transporte.
 */
export async function apiPut(
  caminho: string,
  query: Record<string, string | number> = {},
): Promise<boolean> {
  const resposta = await fetch(montarUrl(caminho, query), { method: 'PUT' });

  if (!resposta.ok && resposta.status !== 404) {
    throw new Error(`Falha ao atualizar ${caminho} (HTTP ${resposta.status}).`);
  }

  const texto = (await resposta.text()).trim();
  return texto === 'True';
}
