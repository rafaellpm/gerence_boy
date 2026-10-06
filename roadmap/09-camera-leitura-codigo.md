# Leitura de código de barras/QR com a câmera

Implementado com `react-native-vision-camera` (`useCodeScanner`, via ML
Kit no Android) — sem Frame Processors, então sem depender de
`react-native-worklets-core`/reanimated/skia (ver
[01-arquitetura-tecnica.md](01-arquitetura-tecnica.md)).

## Onde está

- [src/components/ScannerCodigoModal.tsx](../src/components/ScannerCodigoModal.tsx)
  — `Modal` em tela cheia com `<Camera>` + `useCodeScanner`. Cuida de:
  - Pedir a permissão de câmera (`useCameraPermission`) automaticamente ao
    abrir, com tela de fallback caso negada ou sem câmera traseira.
  - Trava a leitura após o primeiro código válido (`jaLeuRef`) para não
    disparar `onCodigoLido` várias vezes enquanto o código continua no
    quadro.
  - Overlay de mira + texto de instrução; botão "Fechar".
- [src/components/LeitorCodigo.tsx](../src/components/LeitorCodigo.tsx) —
  botão "📷 Abrir câmera" (abre o `ScannerCodigoModal`) como opção primária,
  com a entrada manual (campo de texto) abaixo como alternativa/fallback —
  útil se o código estiver danificado ou a câmera falhar. Ambos os caminhos
  chamam o mesmo `onLer(codigo: string)`, então as telas que usam
  `LeitorCodigo` (identificação do entregador, bipagem de pedidos) não
  precisaram mudar.

## Tipos de código suportados

```ts
const TIPOS_DE_CODIGO: CodeType[] = [
  'qr', 'code-128', 'code-39', 'code-93', 'codabar',
  'ean-13', 'ean-8', 'itf', 'upc-e', 'upc-a',
  'pdf-417', 'aztec', 'data-matrix',
];
```

**Atenção**: o union type `CodeType` do pacote inclui alguns valores (ex.:
`itf-14`, `gs1-data-bar*`) que só existem na implementação **iOS** — usá-los
no Android derruba o `<Camera>` com `Error while updating property
'codeScannerOptions'... The given value for codeType could not be parsed`.
A lista acima foi checada contra
`node_modules/react-native-vision-camera/android/.../core/types/CodeType.kt`,
que é a fonte da verdade dos tipos aceitos no Android.

## Configuração nativa (Android)

- `android/app/src/main/AndroidManifest.xml` — permissão `CAMERA` +
  `<uses-feature>` de câmera (`required="false"`, o app não deve exigir
  câmera para instalar).
- `android/gradle.properties` — `VisionCamera_enableCodeScanner=true`, para
  empacotar o modelo do ML Kit (~2.4MB) direto no app em vez de baixá-lo sob
  demanda via Google Play Services (mais confiável para uso em campo, sem
  depender de conexão no primeiro uso).
- `VisionCamera_enableFrameProcessors` nem precisou ser desativado
  explicitamente: o `build.gradle` da lib já desliga Frame Processors
  sozinho quando não encontra o projeto Gradle
  `:react-native-worklets-core` (que não instalamos).

## Testando no emulador

O emulador Android usado neste projeto (AVD "Pixel\_9\_Pro") tem a câmera
traseira configurada como `virtualscene` — mostra uma cena 3D navegável em
vez de uma imagem real, então não há como validar uma leitura de
código de verdade só com screenshots/adb. Confirmado até aqui:
- permissão solicitada e concedida corretamente;
- preview de câmera ao vivo sem crash (depois da correção dos `CodeType`);
- modal fecha e devolve o controle à tela corretamente.

Para testar uma leitura real: usar um dispositivo físico, **ou** no
emulador, abrir Extended Controls → Virtual scene e carregar uma imagem de
QR code/código de barras como pôster da cena.
