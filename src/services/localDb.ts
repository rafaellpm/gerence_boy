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
    'ALTER TABLE entregas_bipadas ADD COLUMN ordem INTEGER',
    'ALTER TABLE entregas_bipadas ADD COLUMN valor_total REAL',
    'ALTER TABLE entregas_bipadas ADD COLUMN troco_pedido REAL',
  ];

  for (const sql of alteracoes) {
    try {
      await db.execute(sql);
    } catch {}
  }
}

/**
 * NR_PEDIDO (codigo) reseta diariamente — a chave original só tinha
 * (entregador_codigo, codigo), então o pedido 45 de hoje colidia com o
 * pedido 45 de ontem. Recria a tabela com (entregador_codigo, codigo,
 * data_venda) como chave, preenchendo data_venda das linhas antigas a
 * partir da data de criado_em (instalações novas já criam a tabela certa,
 * então isso vira um no-op).
 */
async function migrarChavePrimariaComData(): Promise<void> {
  const colunas = await db.execute('PRAGMA table_info(entregas_bipadas)');
  const temDataVenda = colunas.rows.some(coluna => coluna.name === 'data_venda');

  if (temDataVenda) {
    return;
  }

  await db.transaction(async tx => {
    await tx.execute('ALTER TABLE entregas_bipadas RENAME TO entregas_bipadas_old');

    await tx.execute(
      `CREATE TABLE entregas_bipadas (
        entregador_codigo TEXT NOT NULL,
        codigo TEXT NOT NULL,
        data_venda TEXT NOT NULL,
        numero_pedido TEXT NOT NULL,
        cliente TEXT NOT NULL,
        endereco TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        situacao TEXT NOT NULL,
        criado_em TEXT NOT NULL,
        forma_pagamento TEXT,
        valor REAL,
        valor_total REAL,
        troco_pedido REAL,
        entregue_em TEXT,
        ordem INTEGER,
        PRIMARY KEY (entregador_codigo, codigo, data_venda)
      )`,
    );

    await tx.execute(
      `INSERT OR IGNORE INTO entregas_bipadas
        (entregador_codigo, codigo, data_venda, numero_pedido, cliente, endereco, latitude, longitude, situacao, criado_em, forma_pagamento, valor, valor_total, troco_pedido, entregue_em, ordem)
       SELECT entregador_codigo, codigo, substr(criado_em, 1, 10), numero_pedido, cliente, endereco, latitude, longitude, situacao, criado_em, forma_pagamento, valor, valor_total, troco_pedido, entregue_em, ordem
       FROM entregas_bipadas_old`,
    );

    await tx.execute('DROP TABLE entregas_bipadas_old');
  });
}

/** Mesma lógica da migração acima, mas pra entregas_pagamentos (sem PK — só ADD COLUMN + backfill). */
async function adicionarColunaDataVendaPagamentos(): Promise<void> {
  try {
    await db.execute('ALTER TABLE entregas_pagamentos ADD COLUMN data_venda TEXT');
  } catch {}

  await db.execute(
    `UPDATE entregas_pagamentos SET data_venda = substr(criado_em, 1, 10) WHERE data_venda IS NULL`,
  );
}

function garantirTabela(): Promise<void> {
  if (!tabelaPronta) {
    tabelaPronta = db
      .execute(
        `CREATE TABLE IF NOT EXISTS entregas_bipadas (
          entregador_codigo TEXT NOT NULL,
          codigo TEXT NOT NULL,
          data_venda TEXT NOT NULL DEFAULT '',
          numero_pedido TEXT NOT NULL,
          cliente TEXT NOT NULL,
          endereco TEXT NOT NULL,
          latitude REAL,
          longitude REAL,
          situacao TEXT NOT NULL,
          criado_em TEXT NOT NULL,
          forma_pagamento TEXT,
          valor REAL,
          valor_total REAL,
          troco_pedido REAL,
          entregue_em TEXT,
          ordem INTEGER,
          PRIMARY KEY (entregador_codigo, codigo, data_venda)
        )`,
      )
      .then(() => adicionarColunasPagamento())
      .then(() => migrarChavePrimariaComData())
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
            data_venda TEXT NOT NULL DEFAULT '',
            forma_pagamento TEXT NOT NULL,
            valor REAL NOT NULL,
            criado_em TEXT NOT NULL
          )`,
        ),
      )
      .then(() => adicionarColunaDataVendaPagamentos())
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
    id: `${linha.entregador_codigo}:${linha.codigo}:${linha.data_venda}`,
    codigo: String(linha.codigo),
    dataVenda: String(linha.data_venda),
    numeroPedido: String(linha.numero_pedido),
    cliente: String(linha.cliente),
    endereco: String(linha.endereco),
    latitude: linha.latitude == null ? undefined : Number(linha.latitude),
    longitude: linha.longitude == null ? undefined : Number(linha.longitude),
    situacao: linha.situacao as SituacaoEntrega,
    valorTotal: linha.valor_total == null ? undefined : Number(linha.valor_total),
    trocoPedido: linha.troco_pedido == null ? undefined : Number(linha.troco_pedido),
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

  let adicionada = false;

  await db.transaction(async tx => {
    const ultimaOrdem = await tx.execute(
      'SELECT COALESCE(MAX(ordem), -1) AS ultima FROM entregas_bipadas WHERE entregador_codigo = ?',
      [entregadorCodigo],
    );
    const proximaOrdem = Number(ultimaOrdem.rows[0]?.ultima ?? -1) + 1;

    const resultado = await tx.execute(
      `INSERT OR IGNORE INTO entregas_bipadas
        (entregador_codigo, codigo, data_venda, numero_pedido, cliente, endereco, latitude, longitude, situacao, criado_em, ordem, valor_total, troco_pedido)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entregadorCodigo,
        entrega.codigo,
        entrega.dataVenda,
        entrega.numeroPedido,
        entrega.cliente,
        entrega.endereco,
        entrega.latitude ?? null,
        entrega.longitude ?? null,
        entrega.situacao,
        new Date().toISOString(),
        proximaOrdem,
        entrega.valorTotal ?? null,
        entrega.trocoPedido ?? null,
      ],
    );

    adicionada = resultado.rowsAffected > 0;

    // Entregas bipadas antes de valor_total/troco_pedido existirem ficam com
    // essas colunas nulas pra sempre, já que o INSERT OR IGNORE não toca em
    // linha existente — preenche retroativamente a cada sincronização.
    if (!adicionada && entrega.valorTotal != null) {
      await tx.execute(
        `UPDATE entregas_bipadas SET valor_total = ?
         WHERE entregador_codigo = ? AND codigo = ? AND data_venda = ? AND valor_total IS NULL`,
        [entrega.valorTotal, entregadorCodigo, entrega.codigo, entrega.dataVenda],
      );
    }
    if (!adicionada && entrega.trocoPedido != null) {
      await tx.execute(
        `UPDATE entregas_bipadas SET troco_pedido = ?
         WHERE entregador_codigo = ? AND codigo = ? AND data_venda = ? AND troco_pedido IS NULL`,
        [entrega.trocoPedido, entregadorCodigo, entrega.codigo, entrega.dataVenda],
      );
    }
  });

  return adicionada ? 'ADICIONADA' : 'DUPLICADA';
}

/** Entregas ainda "pra entrega" do entregador — exclui as já marcadas como ENTREGUE localmente. */
export async function listarEntregasPendentes(entregadorCodigo: string): Promise<Entrega[]> {
  await garantirTabela();

  const resultado = await db.execute(
    `SELECT * FROM entregas_bipadas
     WHERE entregador_codigo = ? AND situacao <> 'ENTREGUE'
     ORDER BY (ordem IS NULL), ordem ASC, criado_em ASC`,
    [entregadorCodigo],
  );

  return resultado.rows.map(linhaParaEntrega);
}

/**
 * Salva a ordem de exibição das entregas pendentes, a partir da lista de
 * (codigo, dataVenda) já na ordem desejada (ex.: depois de mover uma entrega
 * pra cima ou pra baixo na tela) — persiste no SQLite, então sobrevive a
 * fechar o app. Precisa de dataVenda junto de codigo porque NR_PEDIDO reseta
 * diariamente.
 */
export async function salvarOrdemEntregas(
  entregadorCodigo: string,
  itensEmOrdem: { codigo: string; dataVenda: string }[],
): Promise<void> {
  await garantirTabela();

  for (let i = 0; i < itensEmOrdem.length; i++) {
    await db.execute(
      'UPDATE entregas_bipadas SET ordem = ? WHERE entregador_codigo = ? AND codigo = ? AND data_venda = ?',
      [i, entregadorCodigo, itensEmOrdem[i].codigo, itensEmOrdem[i].dataVenda],
    );
  }
}

/** Marca a entrega como entregue e grava um ou mais pagamentos pra ela (ex.: parte em dinheiro, parte no cartão). */
export async function marcarEntregueLocal(
  entregadorCodigo: string,
  codigo: string,
  dataVenda: string,
  pagamentos: Pagamento[],
): Promise<void> {
  await garantirTabela();

  const agora = dataHoraLocalIso();

  await db.transaction(async tx => {
    for (const pagamento of pagamentos) {
      await tx.execute(
        `INSERT INTO entregas_pagamentos (entregador_codigo, codigo, data_venda, forma_pagamento, valor, criado_em)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [entregadorCodigo, codigo, dataVenda, pagamento.formaPagamento, pagamento.valor, agora],
      );
    }

    await tx.execute(
      `UPDATE entregas_bipadas
       SET situacao = 'ENTREGUE', entregue_em = ?
       WHERE entregador_codigo = ? AND codigo = ? AND data_venda = ?`,
      [agora, entregadorCodigo, codigo, dataVenda],
    );
  });
}

async function listarPagamentosDaEntrega(
  entregadorCodigo: string,
  codigo: string,
  dataVenda: string,
): Promise<Pagamento[]> {
  const resultado = await db.execute(
    `SELECT forma_pagamento, valor FROM entregas_pagamentos
     WHERE entregador_codigo = ? AND codigo = ? AND data_venda = ?
     ORDER BY criado_em ASC`,
    [entregadorCodigo, codigo, dataVenda],
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
    entrega.pagamentos = await listarPagamentosDaEntrega(entregadorCodigo, entrega.codigo, entrega.dataVenda);
  }

  return entregas;
}

/** Apaga todas as entregas e pagamentos salvos localmente (de qualquer entregador) — mantém a configuração do servidor (IP/porta/terminal) intacta. */
export async function limparVendasLocais(): Promise<void> {
  await garantirTabela();

  await db.transaction(async tx => {
    await tx.execute('DELETE FROM entregas_pagamentos');
    await tx.execute('DELETE FROM entregas_bipadas');
  });
}

export const localDb = {
  salvarEntregaBipada,
  listarEntregasPendentes,
  salvarOrdemEntregas,
  marcarEntregueLocal,
  listarEntreguesPorDia,
  limparVendasLocais,
  obterConfiguracaoServidor,
  salvarConfiguracaoServidor,
  obterTerminal,
  salvarTerminal,
  obterEntregadorPermanente,
  salvarEntregadorPermanente,
  removerEntregadorPermanente,
};
