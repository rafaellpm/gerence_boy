import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { entregaService, Entrega, Entregador, Pagamento } from '../services';
import { localDb } from '../services/localDb';

type EntregadorContextValue = {
  entregador: Entregador | null;
  entregas: Entrega[];
  /**
   * `permanecerLogado` persiste o entregador no banco local (via
   * `localDb.salvarEntregadorPermanente`) para a `SplashScreen` pular a
   * leitura de código na próxima abertura do app.
   */
  selecionarEntregador: (entregador: Entregador, permanecerLogado?: boolean) => void;
  encerrarSessao: () => void;
  /**
   * Busca no servidor as vendas de entrega já vinculadas a este entregador
   * e substitui `entregas` pelo que veio de lá (não acumula localmente) —
   * usado tanto no carregamento inicial quanto no "arrastar pra atualizar"
   * da lista.
   */
  recarregarEntregas: () => Promise<void>;
  /** Marca a entrega como entregue (com um ou mais pagamentos) só no banco local do app (sem chamar a API) e some da listagem. */
  confirmarEntregaLocal: (codigo: string, pagamentos: Pagamento[]) => Promise<void>;
  /**
   * Entrega escolhida para exibir na aba "Mapa". Necessário porque a aba faz
   * parte do bottom tab navigator e não recebe parâmetros de rota ao ser
   * selecionada pela barra de abas.
   */
  entregaEmFoco: Entrega | null;
  focarEntregaNoMapa: (entrega: Entrega | null) => void;
};

const EntregadorContext = createContext<EntregadorContextValue | undefined>(
  undefined,
);

export function EntregadorProvider({ children }: { children: React.ReactNode }) {
  const [entregador, setEntregador] = useState<Entregador | null>(null);
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [entregaEmFoco, setEntregaEmFoco] = useState<Entrega | null>(null);

  const selecionarEntregador = useCallback(
    (novoEntregador: Entregador, permanecerLogado: boolean = false) => {
      setEntregador(novoEntregador);
      setEntregaEmFoco(null);

      if (permanecerLogado) {
        localDb.salvarEntregadorPermanente(novoEntregador).catch(() => undefined);
      }
    },
    [],
  );

  // "Sair" também remove o entregador permanente salvo localmente — do
  // contrário a SplashScreen voltaria a pular a leitura de código mesmo
  // depois do entregador ter encerrado a sessão de propósito.
  const encerrarSessao = useCallback(() => {
    setEntregador(null);
    setEntregas([]);
    setEntregaEmFoco(null);
    localDb.removerEntregadorPermanente().catch(() => undefined);
  }, []);

  const focarEntregaNoMapa = useCallback((entrega: Entrega | null) => {
    setEntregaEmFoco(entrega);
  }, []);

  const recarregarEntregas = useCallback(async () => {
    if (!entregador) {
      return;
    }

    const vendas = await entregaService.buscarVendasDoEntregador(entregador.codigo);

    // Guarda uma cópia local (SQLite) de cada venda vinda do servidor — só
    // pra "marcar como entregue" (confirmarEntregaLocal) e a tela de
    // Pagamentos terem uma linha pra atualizar; a confirmação de entrega em
    // si continua sendo só local, sem rota no servidor pra isso.
    for (const venda of vendas) {
      await localDb.salvarEntregaBipada(entregador.codigo, venda);
    }

    // Não usa `vendas` direto: o servidor não sabe quais já foram marcadas
    // como entregues localmente (continuam "em aberto" lá), então a venda
    // voltaria pra lista a cada atualização. `listarEntregasPendentes` já
    // exclui as marcadas ENTREGUE no SQLite local.
    const pendentes = await localDb.listarEntregasPendentes(entregador.codigo);
    setEntregas(pendentes);
  }, [entregador]);

  // Ao identificar o entregador, busca no servidor as entregas já
  // vinculadas a ele (em vez de carregar o que ficou acumulado localmente).
  useEffect(() => {
    if (!entregador) {
      return;
    }

    recarregarEntregas().catch(() => undefined);
  }, [entregador, recarregarEntregas]);

  const confirmarEntregaLocal = useCallback(
    async (codigo: string, pagamentos: Pagamento[]): Promise<void> => {
      if (!entregador) {
        return;
      }

      await localDb.marcarEntregueLocal(entregador.codigo, codigo, pagamentos);

      setEntregas(atual => atual.filter(item => item.codigo !== codigo));
      setEntregaEmFoco(atual => (atual?.codigo === codigo ? null : atual));
    },
    [entregador],
  );

  const value = useMemo<EntregadorContextValue>(
    () => ({
      entregador,
      entregas,
      selecionarEntregador,
      encerrarSessao,
      recarregarEntregas,
      confirmarEntregaLocal,
      entregaEmFoco,
      focarEntregaNoMapa,
    }),
    [
      entregador,
      entregas,
      selecionarEntregador,
      encerrarSessao,
      recarregarEntregas,
      confirmarEntregaLocal,
      entregaEmFoco,
      focarEntregaNoMapa,
    ],
  );

  return (
    <EntregadorContext.Provider value={value}>
      {children}
    </EntregadorContext.Provider>
  );
}

export function useEntregadorContext(): EntregadorContextValue {
  const context = useContext(EntregadorContext);
  if (!context) {
    throw new Error(
      'useEntregadorContext deve ser usado dentro de um EntregadorProvider',
    );
  }
  return context;
}
