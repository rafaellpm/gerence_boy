import { apiGetOuNulo } from './api';
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
  const funcionario = await apiGetOuNulo<FuncionarioApi>(
    `entregador/${encodeURIComponent(codigo.trim())}`,
  );
  return funcionario ? mapearFuncionario(funcionario) : null;
}

export const entregadorService = {
  buscarPorCodigo,
};
