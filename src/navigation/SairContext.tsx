import { createContext, useContext } from 'react';

/**
 * Ação de encerrar a sessão do entregador, disponibilizada para as telas
 * dentro do bottom tab navigator. É fornecida pelo `MainTabNavigator`, que é
 * quem tem acesso à navegação da stack raiz (necessária para resetar de
 * volta à tela de identificação do entregador).
 */
const SairContext = createContext<(() => void) | undefined>(undefined);

export const SairProvider = SairContext.Provider;

export function useSair(): () => void {
  const sair = useContext(SairContext);
  if (!sair) {
    throw new Error('useSair deve ser usado dentro do MainTabNavigator');
  }
  return sair;
}
