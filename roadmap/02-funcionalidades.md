# Funcionalidades

Adaptação do escopo funcional original (Delphi/FMX) para React Native. O
comportamento esperado para o usuário final é o mesmo; muda apenas a
tecnologia usada para implementar cada item.

## 1. Identificação do entregador por código de barras

- Usar a câmera do celular (`react-native-vision-camera`) para ler o código
  de barras do entregador.
- Obter o código/ID lido e consultar via `entregadorService.buscarPorCodigo`.
- Exibir nome e dados básicos do entregador em tela.
- Manter o entregador selecionado em `EntregadorContext` durante toda a
  sessão de bipagem das entregas.

## 2. Leitura dos códigos de barras das entregas

- Reaproveitar o mesmo componente de leitura de código de barras da tela de
  entregador.
- Identificar o código da entrega e consultar via
  `entregaService.buscarPorCodigo`.
- Adicionar a entrega retornada à lista do entregador atual (em memória, via
  Context).
- Evitar duplicidade: se o código já estiver na lista, não duplicar o item
  (apenas indicar visualmente "já adicionado").
- Feedback visual imediato para código inválido ou entrega não encontrada
  (ex.: toast/snackbar vermelho + vibração curta).

## 3. Lista de entregas bipadas

- Tela com a lista de entregas vinculadas ao entregador: código do pedido,
  nome do cliente, endereço e situação (`PENDENTE`, `EM_ROTA`, `ENTREGUE` ou
  `CANCELADA` — ver [04-modelo-de-dados-api.md](04-modelo-de-dados-api.md)).
- Cada pedido tem um botão **"Opções"** que abre um **bottom sheet**
  (`OpcoesEntregaBottomSheet`) com as ações disponíveis para aquele pedido:
  - **Ver mapa no app** — abre `MapaEntregaScreen`, que mostra o mapa
    embutido (`react-native-maps`) centralizado nas coordenadas da entrega,
    com um marcador (ver [07-mapa-google-maps.md](07-mapa-google-maps.md)).
  - **Abrir no Google Maps** — comportamento original, abre o app externo
    do Google Maps via `Linking.openURL` (helper em `utils/maps.ts`).
  - **Marcar como entregue** — só aparece quando a situação permite (não
    aparece para pedidos já `ENTREGUE` ou `CANCELADA`).
- Sem navegação GPS turn-by-turn embutida — o mapa no app é só visualização
  (mapa + marcador); a navegação passo a passo continua sendo feita pelo
  Google Maps externo.

## 4. Marcar pedido como entregue

- Ação "Marcar como entregue" dentro do bottom sheet de opções do pedido.
- Ao confirmar, chamar `entregaService.marcarComoEntregue(codigo)`.
- Atualizar o status da entrega na lista local imediatamente após resposta
  de sucesso, e fechar o bottom sheet.
- Exibir indicação visual de "Entregue" (badge verde no card).
- Tratar erro de forma visível (`Alert.alert`) caso a operação falhe — hoje
  simulado via mock: pedido já entregue ou pedido cancelado não podem ser
  marcados como entregues (mantém o bottom sheet aberto para o usuário ver
  o erro).

## Fora de escopo (igual ao pedido original)

- Navegação GPS turn-by-turn dentro do app.
- Qualquer lógica de roteirização/otimização de rota.
