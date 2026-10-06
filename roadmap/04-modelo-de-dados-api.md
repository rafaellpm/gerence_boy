# Modelo de Dados e Contratos da API

A estrutura exata dos endpoints e dos JSONs será disponibilizada pelo
cliente/backend durante o desenvolvimento (igual ao escopo original). Os
tipos e assinaturas abaixo são uma proposta inicial, usada para já modelar a
camada `src/services` com dados **fixos (mock)**, sem depender da API real.

## Entidades previstas

### Entregador

```ts
type Entregador = {
  id: string;
  codigo: string; // código lido no código de barras
  nome: string;
  documento?: string;
  ativo: boolean;
};
```

### Entrega / Pedido

```ts
type SituacaoEntrega = 'PENDENTE' | 'EM_ROTA' | 'ENTREGUE' | 'CANCELADA';

type Entrega = {
  id: string;
  codigo: string; // código lido no código de barras do pedido
  numeroPedido: string;
  cliente: string;
  endereco: string;
  latitude?: number;
  longitude?: number;
  situacao: SituacaoEntrega;
};
```

## Endpoints previstos (a confirmar com o backend)

| Ação                                   | Método provável | Endpoint sugerido                     |
|-----------------------------------------|------------------|-----------------------------------------|
| Consultar entregador por código          | GET              | `/entregadores/{codigo}`               |
| Consultar entrega/pedido por código      | GET              | `/entregas/{codigo}`                   |
| Associar/validar entrega ao entregador   | POST             | `/entregadores/{codigo}/entregas`      |
| Atualizar pedido para "entregue"         | PATCH/POST       | `/entregas/{codigo}/entregar`          |

## Estado atual (mock)

Enquanto a API não é disponibilizada, `src/services` retorna dados fixos
definidos em `src/services/mocks/`:

- `entregadores.mock.ts` — lista fixa de entregadores válidos para teste.
- `entregas.mock.ts` — lista fixa de pedidos cobrindo **todos os status
  possíveis** de `SituacaoEntrega` (códigos 2001–2005: `PENDENTE`,
  `EM_ROTA`, `ENTREGUE`, `CANCELADA` e mais um `PENDENTE`), com endereços e
  coordenadas em **Cianorte - PR** (para o mapa embutido mostrar uma região
  real e coerente entre si), para já exercitar os badges e as regras de
  "Marcar como entregue" (indisponível para pedidos
  `ENTREGUE`/`CANCELADA`) sem depender da API.

As funções de serviço simulam:
- sucesso (código existente no mock);
- "não encontrado" (código fora da lista mockada, retorna `null`);
- erro de regra de negócio (`marcarComoEntregue` recusa pedidos já
  `ENTREGUE` ou `CANCELADA`);
- um pequeno delay artificial (`setTimeout`), para já preparar a UI para o
  estado de "carregando" que existirá com a API real.

Quando a API for disponibilizada, o trabalho se resume a:
1. Confirmar os contratos reais de request/response com o backend.
2. Substituir o corpo de cada função em `entregadorService.ts` e
   `entregaService.ts` por chamadas via `api.ts` (fetch/axios).
3. Remover a dependência dos arquivos `mocks/*` (ou mantê-los só para testes).
