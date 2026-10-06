# App Controle de Entregas — Visão Geral

## Objetivo

Aplicativo mobile (Android, com estrutura já preparada para iOS) para auxiliar na
separação e no controle de entregas: identifica o entregador, vincula pedidos
lidos por código de barras e permite abrir a rota no Google Maps via
Intent/URI. Não implementa navegação GPS própria.

## Mudança de stack

O escopo original previa Delphi + FireMonkey (FMX). Este roadmap adapta o
mesmo escopo funcional para **React Native**, aproveitando o projeto já
inicializado neste diretório (`react-native` 0.87, TypeScript, RN CLI).

| Requisito original (Delphi/FMX)          | Equivalente em React Native                                  |
|-------------------------------------------|----------------------------------------------------------------|
| FireMonkey / Android nativo                | React Native + React Native CLI (Android; iOS já suportado)   |
| Consumo de API REST/HTTP                   | Camada `src/services` (fetch/axios), isolada por domínio       |
| Leitura de código de barras via câmera     | `react-native-vision-camera` + leitor de barcode (ML Kit)      |
| Abrir rota no Google Maps via URI/Intent   | `Linking.openURL` com URI do Google Maps (`geo:`/`https://www.google.com/maps/...`) |
| Navegação GPS embutida                     | Fora de escopo (igual ao original)                             |

## Documentos deste roadmap

1. [01-arquitetura-tecnica.md](01-arquitetura-tecnica.md) — stack, bibliotecas e organização de pastas.
2. [02-funcionalidades.md](02-funcionalidades.md) — detalhamento das funcionalidades, adaptadas de Delphi para RN.
3. [03-fluxo-do-usuario.md](03-fluxo-do-usuario.md) — fluxo passo a passo do app.
4. [04-modelo-de-dados-api.md](04-modelo-de-dados-api.md) — contratos previstos da API e mocks atuais.
5. [05-etapas-desenvolvimento.md](05-etapas-desenvolvimento.md) — roadmap de execução em fases/milestones.
6. [06-escopo-visual-ui.md](06-escopo-visual-ui.md) — diretrizes de UI/UX.
7. [07-mapa-google-maps.md](07-mapa-google-maps.md) — mapa embutido com
   `react-native-maps` e configuração da chave de API do Google Maps.
8. [08-navegacao-por-abas.md](08-navegacao-por-abas.md) — tela de
   identificação como "login" fora das abas; Bipagem / Minhas entregas /
   Mapa em um bottom tab navigator.
9. [09-camera-leitura-codigo.md](09-camera-leitura-codigo.md) — leitura de
   código de barras/QR com `react-native-vision-camera`.
10. [10-paleta-de-cores.md](10-paleta-de-cores.md) — cores centralizadas em
    `src/theme/colors.ts`, ponto de partida para alinhar com a marca
    Gerence Sistemas.

## Estado atual do código

- Projeto React Native inicializado (CLI padrão, TypeScript, sem navegação/telas customizadas ainda).
- **Entregável desta etapa**: criação da pasta `src/services`, com funções de
  consulta já com a assinatura final, mas retornando **dados fixos (mock)**
  em vez de chamar a API real. Nenhuma tela ou biblioteca de câmera/mapas foi
  adicionada ainda — isso fica para as próximas fases (ver
  [05-etapas-desenvolvimento.md](05-etapas-desenvolvimento.md)).
