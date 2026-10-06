# Roadmap de Execução (Fases)

## Fase 0 — Setup do projeto ✅ (concluída)
- Projeto React Native + TypeScript inicializado via RN CLI.
- Estrutura padrão (Android/iOS) já presente no repositório.

## Fase 1 — Camada de serviços mockada ✅ (esta etapa)
- Criar `src/services` com:
  - `types.ts` (tipos `Entregador`, `Entrega`, etc.)
  - `api.ts` (stub de configuração, sem uso real ainda)
  - `entregadorService.ts` e `entregaService.ts` com retorno fixo (mock)
  - `mocks/entregadores.mock.ts` e `mocks/entregas.mock.ts`
- Nenhuma tela, navegação ou biblioteca de câmera/mapas é adicionada nesta
  fase — apenas a camada de dados, para já fixar o contrato que as telas
  vão consumir depois.

## Fase 2 — Identificação do entregador ✅
- Tela `IdentificarEntregadorScreen`, fora da barra de abas (funciona como
  tela de login), com `LeitorCodigo` — câmera real (`react-native-vision-camera`)
  como opção primária, entrada manual como fallback (ver
  [09-camera-leitura-codigo.md](09-camera-leitura-codigo.md)).
- Consome `entregadorService.buscarPorCodigo` (mockado).
- Exibe dados do entregador e guarda em `EntregadorContext`; trata
  entregador não encontrado e entregador inativo.
- Ao identificar com sucesso, `navigation.replace('MainTabs')` entra no
  bottom tab navigator.

## Fase 3 — Bipagem das entregas ✅
- Tela `BipagemEntregasScreen` (aba "Bipagem"), reaproveitando `LeitorCodigo`
  (câmera + fallback manual).
- Consome `entregaService.buscarPorCodigo` (mockado).
- Adiciona entregas à lista do entregador via `EntregadorContext`,
  evitando duplicidade (testado manualmente no emulador).
- Feedback visual (verde/amarelo/vermelho) para sucesso, duplicidade e
  não encontrado.

## Fase 4 — Lista de entregas, bottom sheet de opções e mapa embutido ✅
- Tela `ListaEntregasScreen` com `CardEntrega` (código, cliente, endereço,
  `BadgeSituacao` com 4 status possíveis).
- Cada pedido tem um botão "Opções" que abre `OpcoesEntregaBottomSheet`
  (componente `BottomSheet` genérico, baseado em `Modal` — sem
  gesture-handler/reanimated, ver [01-arquitetura-tecnica.md](01-arquitetura-tecnica.md)).
- **Mapa embutido**: opção "Ver mapa no app" navega para
  `MapaEntregaScreen`, que usa `react-native-maps` (`MapView` + `Marker`)
  centralizado nas coordenadas do pedido — ver
  [07-mapa-google-maps.md](07-mapa-google-maps.md) (inclui setup da chave
  de API do Google Maps, ainda pendente de uma chave real).
- Opção "Abrir no Google Maps" mantém o comportamento original (app externo
  via `Linking`/Intent, helper `utils/maps.ts`).
- Testado no emulador: bottom sheet abre/fecha, navegação para o mapa
  embutido funciona (Google Maps SDK carrega, só sem tiles por falta de
  chave real), e "Abrir no Google Maps" abre o app externo de fato.

## Fase 5 — Marcar pedido como entregue ✅ (com mock)
- Ação "Marcar como entregue" dentro do bottom sheet de opções.
- Consome `entregaService.marcarComoEntregue` (mockado); recusa pedidos já
  `ENTREGUE` ou `CANCELADA` com erro tratado via `Alert.alert`, e a opção
  nem aparece no bottom sheet nesses casos.
- Atualização visual imediata do status na lista e fechamento do bottom
  sheet após sucesso (testado no emulador, incluindo transição
  `EM_ROTA` → `ENTREGUE`).

> Fases 2–5 foram implementadas e validadas rodando o app no emulador
> Android (build debug via Gradle, `adb`), incluindo a câmera real
> (`react-native-vision-camera`) — falta apenas testar uma leitura de
> verdade em dispositivo físico ou com um pôster de código configurado na
> cena virtual do emulador (ver [09-camera-leitura-codigo.md](09-camera-leitura-codigo.md)).

## Fase 6 — Integração real com a API
- Confirmar contratos definitivos de endpoints/JSON com o backend
  (ver [04-modelo-de-dados-api.md](04-modelo-de-dados-api.md)).
- Substituir os mocks em `entregadorService.ts`/`entregaService.ts` por
  chamadas HTTP reais (`api.ts` com `fetch`/`axios`, tratamento de erros de
  rede, timeouts, etc.).
- Ajustar tipos conforme o JSON real, se necessário.

## Fase 7 — Polimento e build
- Revisão de UI/UX (ver [06-escopo-visual-ui.md](06-escopo-visual-ui.md)).
- Testes manuais do fluxo completo em dispositivo Android real, incluindo
  leitura real de código de barras/QR pela câmera (permissão negada/câmera
  indisponível já têm fallback, ver
  [09-camera-leitura-codigo.md](09-camera-leitura-codigo.md); falta validar
  em hardware real).
- Geração do build de release Android (APK/AAB assinado).
