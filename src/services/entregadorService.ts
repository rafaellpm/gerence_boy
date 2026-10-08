import { api } from './api';
import { Entregador } from './types';

type FuncionarioApi = {
  ID_FUNCIONARIO: string;
  NOME_FUNCIONARIO: string;
  ATIVO?: string;
  SITUACAO?: string;
  [campo: string]: string | undefined;
};

function funcionarioEstaAtivo(funcionario: FuncionarioApi): boolean {
  const marcador = funcionario.ATIVO ?? funcionario.SITUACAO;
  if (marcador == null || marcador === '') {
    return true;
  }
  return marcador === 'S' || marcador === 'A';
}

function mapearFuncionario(funcionario: FuncionarioApi): Entregador {
  return {
    id: funcionario.ID_FUNCIONARIO,
    codigo: funcionario.ID_FUNCIONARIO,
    nome: funcionario.NOME_FUNCIONARIO,
    ativo: funcionarioEstaAtivo(funcionario),
  };
}

export async function buscarPorCodigo(
  codigo: string,
): Promise<Entregador | null> {
  const resposta = await api.get<FuncionarioApi>(`entregador/${encodeURIComponent(codigo.trim())}`, {
    validateStatus: status => (status >= 200 && status < 300) || status === 404,
  });
  return resposta.status === 404 ? null : mapearFuncionario(resposta.data);
}

export const entregadorService = {
  buscarPorCodigo,
};
