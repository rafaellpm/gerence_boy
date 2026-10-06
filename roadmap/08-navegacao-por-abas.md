# Navegação: login + abas

A navegação é uma stack raiz com duas rotas:

```
RootStack (native-stack, sem header)
├── IdentificarEntregador        (tela "de login" — sem barra de abas)
└── MainTabs (component = MainTabNavigator)
    └── Tab.Navigator
        ├── Bipagem          → BipagemEntregasScreen
        ├── MinhasEntregas   → ListaEntregasScreen   (título "Minhas entregas")
        └── Mapa             → MapaEntregaScreen
```

- [src/navigation/types.ts](../src/navigation/types.ts) — `RootStackParamList`
  (`IdentificarEntregador`, `MainTabs`) e `MainTabParamList` (`Bipagem`,
  `MinhasEntregas`, `Mapa`).
- [src/navigation/AppNavigator.tsx](../src/navigation/AppNavigator.tsx) — a
  stack raiz.
- [src/navigation/MainTabNavigator.tsx](../src/navigation/MainTabNavigator.tsx)
  — o bottom tab navigator, ícones (`react-native-vector-icons/MaterialCommunityIcons`:
  `barcode-scan`, `clipboard-list-outline`, `map-marker-outline`) e botão
  "Sair" no header de todas as abas. No Android, a fonte do ícone é
  empacotada via `android/app/build.gradle` (`apply from:
  ".../react-native-vector-icons/fonts.gradle"`, restrito só à fonte
  `MaterialCommunityIcons.ttf` para não inflar o APK com as ~80 fontes do
  pacote).

Todo emoji usado como ícone no app (botão "Abrir câmera", linhas do bottom
sheet de opções, botão "Fechar" do scanner) também foi trocado por
`MaterialCommunityIcons` — ver `BotaoGrande` (prop `icone`), `OpcaoLinha` e
`ScannerCodigoModal`. Antes de usar um nome de ícone novo, confirme que ele
existe no glyph map instalado (ícone inválido não dá erro, só não renderiza
nada):

```sh
node -e "console.log('nome-do-icone' in require('react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json'))"
```

`IdentificarEntregadorScreen` funciona como uma tela de login: fica fora da
barra de abas, sem "Sair" (não há sessão ainda). Ao identificar o
entregador com sucesso, `navigation.replace('MainTabs')` troca a tela raiz
inteira pelo tab navigator — não dá pra "voltar" para o login com o botão
físico/gesto de voltar.

## Aba "Mapa" sem parâmetro de rota

Abas de bottom tab navigator não recebem parâmetros quando o usuário toca no
ícone da aba na barra — ao contrário de uma stack, onde
`navigation.navigate('Tela', { param })` sempre carrega o parâmetro. Por
isso, qual entrega mostrar no mapa não vem de `route.params`.

Solução: `EntregadorContext` tem um campo `entregaEmFoco` +
`focarEntregaNoMapa(entrega)`:

- A opção "Ver mapa no app" do bottom sheet de opções de um pedido (em
  `ListaEntregasScreen`) chama `focarEntregaNoMapa(entrega)` e depois
  `navigation.navigate('Mapa')`.
- `MapaEntregaScreen` lê `entregaEmFoco`; se for `null` (aba acessada
  diretamente pela barra), cai para a "próxima entrega" — a primeira
  `PENDENTE` ou `EM_ROTA` da lista do entregador.
- `atualizarEntrega` (chamada ao marcar como entregue) também atualiza
  `entregaEmFoco` se for a mesma entrega, para o cartão do mapa refletir o
  novo status sem precisar trocar de aba.

## O botão "Sair"

Só `MainTabNavigator` tem acesso à navegação da stack raiz (é o `component`
de uma `Stack.Screen`, então recebe `navigation.reset(...)`). Essa ação é
exposta às telas dentro do tab navigator via um contexto simples
(`src/navigation/SairContext.tsx` + hook `useSair()`), consumido pelo
`SairHeaderButton` mostrado no header de cada aba. Ao confirmar, encerra a
sessão e reseta a stack raiz de volta para `IdentificarEntregador` (limpa o
histórico — não dá pra "voltar" para as abas depois de sair).
