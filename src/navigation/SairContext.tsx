import { createContext, useContext } from 'react';

type SairContextValue = {
  /** Encerra a sessão do entregador e volta pra tela de identificação. */
  sair: () => void;
  /**
   * Apaga todas as entregas/pagamentos salvos no aparelho (mantém a
   * configuração do servidor) e encerra a sessão em seguida.
   */
  limparDadosDeVendas: () => Promise<void>;
};

/**
 * Ações disponibilizadas para as telas dentro do bottom tab navigator. São
 * fornecidas pelo `MainTabNavigator`, que é quem tem acesso à navegação da
 * stack raiz (necessária para resetar de volta à tela de identificação do
 * entregador).
 */
const SairContext = createContext<SairContextValue | undefined>(undefined);

export const SairProvider = SairContext.Provider;

export function useSair(): SairContextValue {
  const valor = useContext(SairContext);
  if (!valor) {
    throw new Error('useSair deve ser usado dentro do MainTabNavigator');
  }
  return valor;
}
