import { open } from '@op-engineering/op-sqlite';
import { dataHoraLocalIso } from '../utils/dataHora';
import { ConfiguracaoServidor, Entrega, Entregador, FormaPagamento, Pagamento, SituacaoEntrega } from './types';

const db = open({ name: 'gerenceboy.db' });

const CHAVE_CONFIG_IP = 'servidor_ip';
const CHAVE_CONFIG_PORTA = 'servidor_porta';
const CHAVE_ENTREGADOR_PERMANENTE = 'entregador_permanente';
const CHAVE_TERMINAL = 'terminal_codigo';

let tabelaPronta: Promise<void> | null = null;

async function adicionarColunasPagamento(): Promise<void> {
  const alteracoes = [
    'ALTER TABLE entregas_bipadas ADD COLUMN forma_pagamento TEXT',
    'ALTER TABLE entregas_bipadas ADD COLUMN valor REAL',
    'ALTER TABLE entregas_bipadas ADD COLUMN entregue_em TEXT',
  ];

  for (const sql of alteracoes) {
    try {
      await db.execute(sql);
    } catch {}
  }
}

function garantirTabela(): Promise<void> {
  if (!tabelaPronta) {
    tabelaPronta = db
      .execute(
        `CREATE TABLE IF NOT EXISTS entregas_bipadas (
          entregador_codigo TEXT NOT NULL,
          codigo TEXT NOT NULL,
          numero_pedido TEXT NOT NULL,
          cliente TEXT NOT NULL,
          endereco TEXT NOT NULL,
          latitude REAL,
          longitude REAL,
          situacao TEXT NOT NULL,
          criado_em TEXT NOT NULL,
          forma_pagamento TEXT,
          valor REAL,
          entregue_em TEXT,
          PRIMARY KEY (entregador_codigo, codigo)
        )`,
      )
      .then(() => adicionarColunasPagamento())
      .then(() =>
        db.execute(
          `CREATE TABLE IF NOT EXISTS app_config (
            chave TEXT PRIMARY KEY,
            valor TEXT NOT NULL
          )`,
        ),
      )
      // Uma venda pode ter mais de um pagamento (parte em dinheiro, parte no
      // cartão) — por isso fica numa tabela própria em vez das colunas
      // forma_pagamento/valor de entregas_bipadas (que só guardavam 1 por entrega).
      .then(() =>
        db.execute(
          `CREATE TABLE IF NOT EXISTS entregas_pagamentos (
            entregador_codigo TEXT NOT NULL,
            codigo TEXT NOT NULL,
            forma_pagamento TEXT NOT NULL,
            valor REAL NOT NULL,
            criado_em TEXT NOT NULL
          )`,
        ),
      )
      .then(() => undefined);
  }
  return tabelaPronta;
}

async function obterConfigValor(chave: string): Promise<string | null> {
  await garantirTabela();

  const resultado = await db.execute('SELECT valor FROM app_config WHERE chave = ?', [chave]);
  if (resultado.rows.length === 0) {
    return null;
  }
  return String(resultado.rows[0].valor);
}

async function definirConfigValor(chave: string, valor: string): Promise<void> {
  await garantirTabela();

  await db.execute(
    `INSERT INTO app_config (chave, valor) VALUES (?, ?)
     ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor`,
    [chave, valor],
  );
}

async function removerConfigValor(chave: string): Promise<void> {
  await garantirTabela();

  await db.execute('DELETE FROM app_config WHERE chave = ?', [chave]);
}

/** IP/porta do servidor salvos na `ConfiguracaoScreen`, ou `null` se o app ainda não foi configurado. */
export async function obterConfiguracaoServidor(): Promise<ConfiguracaoServidor | null> {
  const [ip, porta] = await Promise.all([
    obterConfigValor(CHAVE_CONFIG_IP),
    obterConfigValor(CHAVE_CONFIG_PORTA),
  ]);

  if (!ip || !porta) {
    return null;
  }
  return { ip, porta };
}

export async function salvarConfiguracaoServidor(config: ConfiguracaoServidor): Promise<void> {
  await Promise.all([
    definirConfigValor(CHAVE_CONFIG_IP, config.ip),
    definirConfigValor(CHAVE_CONFIG_PORTA, config.porta),
  ]);
}

/** Código do terminal registrado no servidor (POST /Terminal), ou `null` se ainda não vinculado. */
export async function obterTerminal(): Promise<number | null> {
  const valor = Number(await obterConfigValor(CHAVE_TERMINAL));
  return Number.isInteger(valor) && valor > 0 ? valor : null;
}

export async function salvarTerminal(cdTerminal: number): Promise<void> {
  await definirConfigValor(CHAVE_TERMINAL, String(cdTerminal));
}

/** Entregador salvo por "Permanecer logado" — presente só quando o entregador optou por pular a leitura na próxima abertura do app. */
export async function obterEntregadorPermanente(): Promise<Entregador | null> {
  const valor = await obterConfigValor(CHAVE_ENTREGADOR_PERMANENTE);
  return valor ? (JSON.parse(valor) as Entregador) : null;
}

export async function salvarEntregadorPermanente(entregador: Entregador): Promise<void> {
  await definirConfigValor(CHAVE_ENTREGADOR_PERMANENTE, JSON.stringify(entregador));
}

export async function removerEntregadorPermanente(): Promise<void> {
  await removerConfigValor(CHAVE_ENTREGADOR_PERMANENTE);
}

function linhaParaEntrega(linha: Record<string, unknown>): Entrega {
  return {
    id: `${linha.entregador_codigo}:${linha.codigo}`,
    codigo: String(linha.codigo),
    numeroPedido: String(linha.numero_pedido),
    cliente: String(linha.cliente),
    endereco: String(linha.endereco),
    latitude: linha.latitude == null ? undefined : Number(linha.latitude),
    longitude: linha.longitude == null ? undefined : Number(linha.longitude),
    situacao: linha.situacao as SituacaoEntrega,
    entregueEm: linha.entregue_em == null ? undefined : String(linha.entregue_em),
  };
}

/**
 * Grava a entrega bipada no SQLite local (por entregador — o mesmo código
 * de entrega pode existir para entregadores diferentes). Não envia nada
 * para a API: o "confirmar entrega" é só local neste app.
 */
export async function salvarEntregaBipada(
  entregadorCodigo: string,
  entrega: Entrega,
): Promise<'ADICIONADA' | 'DUPLICADA'> {
  await garantirTabela();

  const existente = await db.execute(
    'SELECT 1 FROM entregas_bipadas WHERE entregador_codigo = ? AND codigo = ?',
    [entregadorCodigo, entrega.codigo],
  );

  if (existente.rows.length > 0) {
    return 'DUPLICADA';
  }

  await db.execute(
    `INSERT INTO entregas_bipadas
      (entregador_codigo, codigo, numero_pedido, cliente, endereco, latitude, longitude, situacao, criado_em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entregadorCodigo,
      entrega.codigo,
      entrega.numeroPedido,
      entrega.cliente,
      entrega.endereco,
      entrega.latitude ?? null,
      entrega.longitude ?? null,
      entrega.situacao,
      new Date().toISOString(),
    ],
  );

  return 'ADICIONADA';
}

/** Entregas ainda "pra entrega" do entregador — exclui as já marcadas como ENTREGUE localmente. */
export async function listarEntregasPendentes(entregadorCodigo: string): Promise<Entrega[]> {
  await garantirTabela();

  const resultado = await db.execute(
    `SELECT * FROM entregas_bipadas
     WHERE entregador_codigo = ? AND situacao <> 'ENTREGUE'
     ORDER BY criado_em ASC`,
    [entregadorCodigo],
  );

  return resultado.rows.map(linhaParaEntrega);
}

/** Marca a entrega como entregue e grava um ou mais pagamentos pra ela (ex.: parte em dinheiro, parte no cartão). */
export async function marcarEntregueLocal(
  entregadorCodigo: string,
  codigo: string,
  pagamentos: Pagamento[],
): Promise<void> {
  await garantirTabela();

  const agora = dataHoraLocalIso();

  for (const pagamento of pagamentos) {
    await db.execute(
      `INSERT INTO entregas_pagamentos (entregador_codigo, codigo, forma_pagamento, valor, criado_em)
       VALUES (?, ?, ?, ?, ?)`,
      [entregadorCodigo, codigo, pagamento.formaPagamento, pagamento.valor, agora],
    );
  }

  await db.execute(
    `UPDATE entregas_bipadas
     SET situacao = 'ENTREGUE', entregue_em = ?
     WHERE entregador_codigo = ? AND codigo = ?`,
    [agora, entregadorCodigo, codigo],
  );
}

async function listarPagamentosDaEntrega(entregadorCodigo: string, codigo: string): Promise<Pagamento[]> {
  const resultado = await db.execute(
    `SELECT forma_pagamento, valor FROM entregas_pagamentos
     WHERE entregador_codigo = ? AND codigo = ?
     ORDER BY criado_em ASC`,
    [entregadorCodigo, codigo],
  );

  return resultado.rows.map(linha => ({
    formaPagamento: linha.forma_pagamento as FormaPagamento,
    valor: Number(linha.valor),
  }));
}

export async function listarEntreguesPorDia(
  entregadorCodigo: string,
  dataIso: string,
  horaInicio?: string,
  horaFim?: string,
): Promise<Entrega[]> {
  await garantirTabela();

  const inicio = `${dataIso}T${horaInicio || '00:00'}:00`;
  const fim = `${dataIso}T${horaFim || '23:59'}:59`;

  const resultado = await db.execute(
    `SELECT * FROM entregas_bipadas
     WHERE entregador_codigo = ? AND situacao = 'ENTREGUE'
       AND entregue_em >= ? AND entregue_em <= ?
     ORDER BY entregue_em ASC`,
    [entregadorCodigo, inicio, fim],
  );

  const entregas = resultado.rows.map(linhaParaEntrega);

  for (const entrega of entregas) {
    entrega.pagamentos = await listarPagamentosDaEntrega(entregadorCodigo, entrega.codigo);
  }

  return entregas;
}

export const localDb = {
  salvarEntregaBipada,
  listarEntregasPendentes,
  marcarEntregueLocal,
  listarEntreguesPorDia,
  obterConfiguracaoServidor,
  salvarConfiguracaoServidor,
  obterTerminal,
  salvarTerminal,
  obterEntregadorPermanente,
  salvarEntregadorPermanente,
  removerEntregadorPermanente,
};
