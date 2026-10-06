# Arquitetura Técnica

## Stack

- **React Native** (CLI, já inicializado) + **TypeScript**
- **Navegação**: `@react-navigation/native` + `@react-navigation/native-stack`
  + `@react-navigation/bottom-tabs` (usa apenas `react-native-screens` e
  `react-native-safe-area-context` como dependências nativas — **não** usa
  `react-native-gesture-handler`, que não é exigido por nenhum dos dois e,
  neste projeto, quebrava o build C++ no Windows por causa do limite de 260
  caracteres de caminho). `IdentificarEntregador` funciona como uma tela de
  login, fora da barra de abas; só depois de identificar o entregador o app
  entra em `MainTabs` (bottom tabs: Bipagem, Minhas entregas, Mapa). Ver
  [08-navegacao-por-abas.md](08-navegacao-por-abas.md).
- **Estado do entregador/lista de entregas**: Context API (`EntregadorContext`)
  — dispensa Redux/Zustand para o tamanho atual do app
- **HTTP**: `fetch` nativo encapsulado em `src/services` (troca futura por
  `axios` é possível sem afetar as telas)
- **Câmera / leitura de código de barras**: `react-native-vision-camera`
  (`useCodeScanner`, baseado em ML Kit) — instalado e em uso. Deliberadamente
  **sem** `react-native-reanimated`/`@shopify/react-native-skia`/
  `react-native-worklets-core` (são peers opcionais, exigidos só por Frame
  Processors, que não usamos) — menos uma dependência nativa com codegen C++
  que poderia repetir o problema de path longo do Windows. Ver
  [09-camera-leitura-codigo.md](09-camera-leitura-codigo.md).
- **Abertura no Google Maps**: API `Linking` do React Native, montando a URI
  padrão do Google Maps (`https://www.google.com/maps/dir/?api=1&destination=...`
  ou `geo:lat,lng?q=lat,lng(label)`)
- **Persistência leve (opcional, fase futura)**: `@react-native-async-storage/async-storage`,
  caso seja necessário manter o entregador selecionado entre sessões

## Organização de pastas (alvo final)

```
src/
  components/       # componentes de UI reutilizáveis (botões grandes, cards de entrega, etc.)
  contexts/         # EntregadorContext (entregador atual + lista de entregas bipadas)
  navigation/        # stack de telas
  screens/
    IdentificarEntregador/
    BipagemEntregas/
    ListaEntregas/
  services/         # camada de acesso a dados — ÚNICA parte criada nesta etapa
    api.ts
    entregadorService.ts
    entregaService.ts
    types.ts
    mocks/
      entregadores.mock.ts
      entregas.mock.ts
  utils/
    maps.ts         # helper para montar URIs do Google Maps
```

## Camada de serviços (foco desta etapa)

A pasta `src/services` é a única parte de código de aplicação criada agora.
Ela define o **contrato** que as telas vão usar futuramente, mas por dentro
retorna dados fixos, sem nenhuma chamada HTTP real:

- `entregadorService.buscarPorCodigo(codigo: string)` — retorna um entregador
  mockado (ou `null` simulando "não encontrado", conforme o código informado).
- `entregaService.buscarPorCodigo(codigo: string)` — retorna um pedido/entrega
  mockado (ou `null` simulando "não encontrado").
- `entregaService.marcarComoEntregue(codigoEntrega: string)` — simula a
  atualização de status e retorna sucesso/erro fixo.

Quando a API real estiver disponível, apenas o **interior** dessas funções
muda (troca do mock por `fetch`/`axios`); as telas que já estiverem
consumindo o serviço não precisarão ser alteradas, pois a assinatura das
funções (parâmetros e formato de retorno) já é definida hoje. Veja
[04-modelo-de-dados-api.md](04-modelo-de-dados-api.md) para os contratos.
