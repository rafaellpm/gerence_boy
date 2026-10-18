# Migração pro Xcode/iOS SDK novo (SDK 27)

Depois de atualizar Mac, Xcode e SDK iOS, o build parou de funcionar em dois pontos
diferentes. Este documento registra exatamente o que foi inserido/alterado e onde,
pra servir de referência caso precise verificar ou refazer algo manualmente no Xcode.

## 1. `Missing package product MapLibre`

**Causa:** `@maplibre/maplibre-react-native` na versão instalada (`11.3.10`) fixava o
binário nativo do iOS em `MapLibre Native 6.26.0`. A versão seguinte da lib
(`11.4.0`, lançada 12 dias depois) bumpou esse pin pra `6.31.0` — a `11.3.10` era a
última versão com esse binário desatualizado.

**O que foi alterado:**

| Arquivo | O que mudou |
|---|---|
| `package.json` | `"@maplibre/maplibre-react-native": "^11.3.10"` → `"^11.5.0"` |
| `package-lock.json` | Regenerado via `npm install @maplibre/maplibre-react-native@11.5.0` (o lockfile antigo fixava a resolução exata em `11.3.10`, então um `npm install` comum não teria pego a correção mesmo com o range `^11.3.10`) |

**Pra aplicar no Mac depois de puxar a alteração:**

```bash
cd ios
rm -rf Pods Podfile.lock
pod install
```

Isso reexecuta o hook `$MLRN.post_install` do `MapLibreReactNative.podspec`, que
reinjeta a referência SPM do MapLibre no `project.pbxproj` — agora apontando pra
`6.31.0` em vez de `6.26.0`.

Se ainda falhar depois disso, também vale limpar cache do Xcode/SPM:

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData
rm -rf ~/Library/Caches/org.swift.swiftpm
rm -rf ~/Library/org.swift.swiftpm
rm -rf ios/gerence_boy.xcodeproj/project.xcworkspace/xcshareddata/swiftpm
```

## 2. `UIScene life cycle is required for apps built with this SDK`

**Causa:** a partir desse SDK, o UIKit exige uma de duas coisas pra deixar o app
abrir: um `UIApplicationSceneManifest` não-vazio no `Info.plist`, ou uma
implementação de `application(_:configurationForConnecting:options:)` no
AppDelegate. O projeto não tinha nenhum dos dois — o `AppDelegate.swift` criava a
`UIWindow` direto em `didFinishLaunchingWithOptions`, no padrão antigo (pré-scene).

Confirmado que a versão do React Native do projeto (`0.87.1`) não tem a API de
`connectionOptions` do `RCTReactNativeFactory` (só existe a partir do RN 0.88) — mas
como o app não faz deep link/URL handling customizado, isso não é necessário aqui.

**O que foi inserido:**

### `ios/gerence_boy/Info.plist`

Bloco novo inserido logo após a chave `RCTNewArchEnabled`:

```xml
<key>UIApplicationSceneManifest</key>
<dict>
	<key>UIApplicationSupportsMultipleScenes</key>
	<false/>
	<key>UISceneConfigurations</key>
	<dict>
		<key>UIWindowSceneSessionRoleApplication</key>
		<array>
			<dict>
				<key>UISceneConfigurationName</key>
				<string>Default Configuration</string>
				<key>UISceneClassName</key>
				<string>UIWindowScene</string>
				<key>UISceneDelegateClassName</key>
				<string>$(PRODUCT_MODULE_NAME).SceneDelegate</string>
			</dict>
		</array>
	</dict>
</dict>
```

### `ios/gerence_boy/SceneDelegate.swift` (arquivo novo)

Cria a `UIWindow` vinculada à `UIWindowScene` e inicia o React Native nela — isso é o
que antes acontecia dentro do `AppDelegate`:

```swift
import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
    guard let windowScene = scene as? UIWindowScene else {
      return
    }
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let factory = appDelegate.reactNativeFactory else {
      return
    }

    let window = UIWindow(windowScene: windowScene)
    self.window = window

    factory.startReactNative(
      withModuleName: "gerence_boy",
      in: window
    )
  }
}
```

### `ios/gerence_boy/AppDelegate.swift`

Removido:
- A propriedade `var window: UIWindow?` (quem passa a possuir a window agora é o
  `SceneDelegate`).
- A criação da `UIWindow` e a chamada `factory.startReactNative(...)` de dentro de
  `didFinishLaunchingWithOptions` (isso moveu pro `SceneDelegate`).

Mantido: a criação do `RCTReactNativeFactory`/`ReactNativeDelegate` continua no
`AppDelegate`, porque o `SceneDelegate` precisa acessá-la depois via
`UIApplication.shared.delegate as? AppDelegate`.

### `ios/gerence_boy.xcodeproj/project.pbxproj`

Esse projeto usa o formato clássico do Xcode (lista explícita de arquivos, não o
formato novo de "pasta sincronizada automaticamente") — então o `SceneDelegate.swift`
precisou ser registrado manualmente em **4 pontos** do arquivo, seguindo exatamente o
mesmo padrão já usado pelo `AppDelegate.swift`:

1. **`PBXBuildFile` section** — nova entrada `SceneDelegate.swift in Sources`:
   ```
   A39579907758E4300E3BAA02 /* SceneDelegate.swift in Sources */ = {isa = PBXBuildFile; fileRef = B50262B1205CCF79BC0C7F01 /* SceneDelegate.swift */; };
   ```
2. **`PBXFileReference` section** — referência do arquivo em si:
   ```
   B50262B1205CCF79BC0C7F01 /* SceneDelegate.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; name = SceneDelegate.swift; path = gerence_boy/SceneDelegate.swift; sourceTree = "<group>"; };
   ```
3. **`PBXGroup` section** (grupo `gerence_boy`) — adicionado como filho, logo após `AppDelegate.swift`.
4. **`PBXSourcesBuildPhase` section** (target `gerence_boy`) — adicionado à lista `files` de `Sources`, pra entrar na compilação.

⚠️ **Essa parte eu não consegui validar num Xcode de verdade** (sem Mac aqui). Se o
Xcode reclamar do `project.pbxproj` ao abrir o projeto, os 4 pontos acima são onde
olhar primeiro — pode ser mais seguro remover essas 4 entradas e adicionar o arquivo
`SceneDelegate.swift` pela interface do Xcode (botão direito na pasta `gerence_boy`
→ *Add Files to "gerence_boy"...*, com "Copy items if needed" desmarcado já que o
arquivo já está na pasta certa, e o target `gerence_boy` marcado).

**Pra aplicar no Mac depois de puxar a alteração:**

```bash
cd ios
pod install
```

(Não precisa limpar `Pods`/`Podfile.lock` dessa vez — não mudou nenhum pod, só
arquivos do próprio app.) Depois, build limpo no Xcode (⇧⌘K e depois ⌘B).
