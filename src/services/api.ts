import axios from 'axios';

/**
 * Instância axios da API do servidorGerencePlus (Delphi + Horse, ver
 * `THorse.Listen` em uPrincipal.pas do projeto servidorGerencePlus).
 *
 * O IP/porta não é fixo no código: é definido pelo usuário na
 * `ConfiguracaoScreen` (persistido via `localDb`) e aplicado aqui em tempo
 * de execução através de `configurarApiBaseUrl`, chamado pela `SplashScreen`
 * assim que a configuração salva é carregada.
 *
 * Os serviços (`terminalService`, `entregaService`, `entregadorService`...)
 * importam `api` e chamam `api.get/post/put` diretamente, passando os
 * parâmetros do servidor em `params` (as rotas Horse recebem tudo via query
 * string, sem corpo JSON).
 */
export const api = axios.create({ timeout: 8000 });

export function configurarApiBaseUrl(ip: string, porta: string): void {
  api.defaults.baseURL = `http://${ip}:${porta}`;
}

api.interceptors.response.use(undefined, erro => {
  if (axios.isAxiosError(erro)) {
    if (erro.code === 'ECONNABORTED') {
      erro.message = `Sem resposta do servidor em ${(erro.config?.timeout ?? 0) / 1000}s. Verifique se o aparelho está na mesma rede do servidor e se o ServidorGerencePlus está aberto.`;
    } else if (!erro.response) {
      erro.message = 'Sem comunicação com o servidor. Verifique o Wi-Fi e a configuração.';
    } else if (typeof erro.response.data === 'string' && erro.response.data) {
      erro.message = erro.response.data;
    } else {
      erro.message = `O servidor respondeu HTTP ${erro.response.status}.`;
    }
  }
  return Promise.reject(erro);
});

/**
 * TODO(config): código da empresa (parâmetro `empresa` exigido pelas rotas
 * do servidor) — ajustar para o código real de cada instalação.
 */
export const CD_EMPRESA = 1;

export const ATRASO_SIMULADO_MS = 600;

export function atraso(ms: number = ATRASO_SIMULADO_MS): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Data de hoje no formato ISO (yyyy-MM-dd), para uso local (SQLite). */
export function dataDeHojeIso(): string {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/**
 * Data de hoje no formato dd/MM/yyyy exigido pelo parâmetro `data` das rotas
 * do servidorGerencePlus: o `StrToDate` delas usa o `FormatSettings` padrão
 * da máquina (pt-BR), sem conversão de ISO — mandar `yyyy-MM-dd` faz o
 * `StrToDate` explodir (ex.: interpreta "2026" como dia).
 */
export function dataDeHojeServidor(): string {
  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, '0');
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const ano = hoje.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

/**
 * Testa se o servidor responde em `/ping` (usado antes de salvar a
 * configuração). Recebe IP/porta explícitos para testar antes de aplicá-los
 * em `api` — por isso não usa a instância `api` (cujo `baseURL` só é
 * definido depois que o teste passa).
 */
export async function testarConexao(ip: string, porta: string, tempoLimiteMs = 8000): Promise<string | null> {
  const url = `http://${ip}:${porta}/ping`;
  try {
    const resposta = await axios.get(url, { timeout: tempoLimiteMs });
    return resposta.status === 200 ? null : `O servidor respondeu HTTP ${resposta.status} em ${url}.`;
  } catch (erro) {
    if (axios.isAxiosError(erro) && erro.code === 'ECONNABORTED') {
      return `Sem resposta de ${url} em ${tempoLimiteMs / 1000}s. Verifique se o aparelho está na mesma rede do servidor e se o ServidorGerencePlus está aberto.`;
    }
    const mensagem = axios.isAxiosError(erro) ? erro.message : String(erro);
    return `Falha de rede ao acessar ${url} (${mensagem}). Verifique o Wi-Fi e o IP informado.`;
  }
}

export default api;
