import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Entrega, Entregador, FormaPagamento } from '../services';
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
  adicionarEntrega: (entrega: Entrega) => Promise<'ADICIONADA' | 'DUPLICADA'>;
  /** Marca a entrega como entregue só no banco local do app (sem chamar a API) e some da listagem. */
  confirmarEntregaLocal: (
    codigo: string,
    formaPagamento: FormaPagamento,
    valor: number,
  ) => Promise<void>;
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

  // Ao identificar o entregador, carrega do SQLite local as entregas dele
  // que ainda estão pra entrega (persistem entre sessões/reinícios do app).
  useEffect(() => {
    if (!entregador) {
      return;
    }

    let cancelado = false;

    localDb.listarEntregasPendentes(entregador.codigo).then(pendentes => {
      if (!cancelado) {
        setEntregas(pendentes);
      }
    });

    return () => {
      cancelado = true;
    };
  }, [entregador]);

  const adicionarEntrega = useCallback(
    async (entrega: Entrega): Promise<'ADICIONADA' | 'DUPLICADA'> => {
      if (!entregador) {
        return 'DUPLICADA';
      }

      const resultado = await localDb.salvarEntregaBipada(entregador.codigo, entrega);

      if (resultado === 'ADICIONADA') {
        setEntregas(atual => [...atual, entrega]);
      }

      return resultado;
    },
    [entregador],
  );

  const confirmarEntregaLocal = useCallback(
    async (codigo: string, formaPagamento: FormaPagamento, valor: number): Promise<void> => {
      if (!entregador) {
        return;
      }

      await localDb.marcarEntregueLocal(entregador.codigo, codigo, formaPagamento, valor);

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
      adicionarEntrega,
      confirmarEntregaLocal,
      entregaEmFoco,
      focarEntregaNoMapa,
    }),
    [
      entregador,
      entregas,
      selecionarEntregador,
      encerrarSessao,
      adicionarEntrega,
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
