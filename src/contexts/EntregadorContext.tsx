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
  /** Apaga todas as entregas e pagamentos salvos no SQLite local (mantém a configuração do servidor) e esvazia a listagem em memória. */
  limparVendasLocais: () => Promise<void>;
  /**
   * Busca no servidor as vendas de entrega já vinculadas a este entregador
   * e substitui `entregas` pelo que veio de lá (não acumula localmente) —
   * usado tanto no carregamento inicial quanto no "arrastar pra atualizar"
   * da lista.
   */
  recarregarEntregas: () => Promise<void>;
  /** Marca a entrega como entregue (com um ou mais pagamentos) só no banco local do app (sem chamar a API) e some da listagem. */
  confirmarEntregaLocal: (codigo: string, dataVenda: string, pagamentos: Pagamento[]) => Promise<void>;
  /**
   * Move a entrega uma posição pra cima/baixo na lista de pendentes e
   * persiste a nova ordem no SQLite local — por padrão a ordem é a de
   * quando foi bipada, mas o entregador pode reorganizar manualmente.
   */
  moverEntregaNaLista: (codigo: string, dataVenda: string, direcao: 'cima' | 'baixo') => Promise<void>;
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

  const limparVendasLocais = useCallback(async (): Promise<void> => {
    await localDb.limparVendasLocais();
    setEntregas([]);
    setEntregaEmFoco(null);
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
    async (codigo: string, dataVenda: string, pagamentos: Pagamento[]): Promise<void> => {
      if (!entregador) {
        return;
      }

      await localDb.marcarEntregueLocal(entregador.codigo, codigo, dataVenda, pagamentos);

      setEntregas(atual => atual.filter(item => !(item.codigo === codigo && item.dataVenda === dataVenda)));
      setEntregaEmFoco(atual =>
        atual?.codigo === codigo && atual?.dataVenda === dataVenda ? null : atual,
      );
    },
    [entregador],
  );

  const moverEntregaNaLista = useCallback(
    async (codigo: string, dataVenda: string, direcao: 'cima' | 'baixo'): Promise<void> => {
      if (!entregador) {
        return;
      }

      const indiceAtual = entregas.findIndex(
        item => item.codigo === codigo && item.dataVenda === dataVenda,
      );
      const indiceNovo = direcao === 'cima' ? indiceAtual - 1 : indiceAtual + 1;

      if (indiceAtual < 0 || indiceNovo < 0 || indiceNovo >= entregas.length) {
        return;
      }

      const reordenadas = [...entregas];
      [reordenadas[indiceAtual], reordenadas[indiceNovo]] = [reordenadas[indiceNovo], reordenadas[indiceAtual]];

      setEntregas(reordenadas);
      await localDb.salvarOrdemEntregas(
        entregador.codigo,
        reordenadas.map(item => ({ codigo: item.codigo, dataVenda: item.dataVenda })),
      );
    },
    [entregador, entregas],
  );

  const value = useMemo<EntregadorContextValue>(
    () => ({
      entregador,
      entregas,
      selecionarEntregador,
      encerrarSessao,
      limparVendasLocais,
      recarregarEntregas,
      confirmarEntregaLocal,
      moverEntregaNaLista,
      entregaEmFoco,
      focarEntregaNoMapa,
    }),
    [
      entregador,
      entregas,
      selecionarEntregador,
      encerrarSessao,
      limparVendasLocais,
      recarregarEntregas,
      confirmarEntregaLocal,
      moverEntregaNaLista,
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
