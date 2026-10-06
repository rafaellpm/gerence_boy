# Mapa embutido (react-native-maps)

O app agora mostra o mapa da entrega **dentro do próprio app**, usando
`react-native-maps` (`MapView` + `Marker`), além de continuar oferecendo a
opção de abrir a rota no aplicativo externo do Google Maps (via
`Linking`/Intent, como já era feito).

## Onde está

- Tela [src/screens/MapaEntrega/MapaEntregaScreen.tsx](../src/screens/MapaEntrega/MapaEntregaScreen.tsx)
  — recebe `codigoEntrega` por parâmetro de rota, busca a entrega no
  `EntregadorContext` e centraliza o mapa nas coordenadas do pedido.
- Acessada a partir do bottom sheet de opções de cada pedido
  (`OpcoesEntregaBottomSheet` → "Ver mapa no app").

## Chave de API do Google Maps (obrigatória para produção)

O Android precisa de uma chave do **Maps SDK for Android** para renderizar
os tiles do mapa corretamente. Sem uma chave válida, o `MapView` é montado
normalmente (o `Marker` e a UI do app funcionam), mas os tiles do mapa não
carregam — aparece uma área em branco com a marca d'água do Google.

O placeholder está em:
- [android/app/src/main/res/values/strings.xml](../android/app/src/main/res/values/strings.xml)
  (`google_maps_api_key`)
- referenciado em
  [android/app/src/main/AndroidManifest.xml](../android/app/src/main/AndroidManifest.xml)
  via `<meta-data android:name="com.google.android.geo.API_KEY" .../>`

Para habilitar o mapa de verdade:
1. Criar/usar um projeto no [Google Cloud Console](https://console.cloud.google.com/).
2. Ativar a API **Maps SDK for Android**.
3. Gerar uma chave de API e (recomendado) restringi-la por
   `applicationId` + assinatura (SHA-1) do app.
4. Substituir o valor de `google_maps_api_key` em `strings.xml` pela chave
   real (idealmente via variável de ambiente/CI, não commitada em texto
   puro em um projeto real).
5. Rebuild do app Android (`gradlew installDebug`/`installRelease`).

## Por que react-native-maps (e não outra lib)

`react-native-maps` não depende de `react-native-gesture-handler` nem de
`react-native-reanimated` — dependências que este projeto evita por já
terem causado falha de build no Windows por limite de caminho (ver
[01-arquitetura-tecnica.md](01-arquitetura-tecnica.md)). A integração ficou
restrita a instalar o pacote e declarar a chave de API no `AndroidManifest`,
sem configuração nativa adicional.
