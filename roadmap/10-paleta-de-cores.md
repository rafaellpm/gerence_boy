# Paleta de cores centralizada

Todas as cores do app (antes espalhadas como hex soltos em cada
`StyleSheet.create`) agora vivem em
[src/theme/colors.ts](../src/theme/colors.ts), exportadas como um objeto
`cores` com nomes semânticos (`cores.primaria`, `cores.texto`,
`cores.fundo`, `cores.perigo`, etc.).

## Por quê

Pedido explícito: alinhar as cores do app ao site institucional da Gerence
Sistemas (fundo azul-marinho escuro, azul vibrante nos botões de destaque).
Antes de decidir *quanto* disso aplicar (só o azul de destaque? tema escuro
completo?), o primeiro passo foi extrair tudo para um lugar só — assim a
próxima decisão de design é uma troca de valores em um arquivo, não uma
caça a hex repetidos em ~15 arquivos.

## O que tem no arquivo hoje

- **Cores de marca** (`marcaAzulEscuro`, `marcaAzul`, `marcaAzulClaro`):
  estimadas visualmente a partir do print do site — **não são os hex
  exatos** da marca. Ajustar quando houver um guia de marca oficial.
- **Cores semânticas** (`primaria`, `perigo`, `sucesso`, `aviso`, `texto`,
  `textoSecundario`, `fundo`, `superficie`, `borda`, etc.): são as cores que
  o app já usava antes desta paleta existir. `cores.primaria` aponta para
  `marcaAzul`, que por coincidência já era o azul usado no app (`#1F6FEB`)
  — ou seja, **centralizar não mudou a aparência atual**.

## Barra de abas (primeira aplicação da marca)

A barra de abas ([src/navigation/MainTabNavigator.tsx](../src/navigation/MainTabNavigator.tsx))
já segue o padrão do site: fundo azul-marinho escuro, aba selecionada em
azul claro de destaque, abas inativas em um azul acinzentado. Tokens
dedicados em `colors.ts`:

- `tabFundo` → `marcaAzulEscuro`
- `tabAtivo` → `marcaAzulClaro`
- `tabInativo` → `#8CA0C4` (azul acinzentado, legível sobre o fundo escuro)

Aplicados via `tabBarStyle`, `tabBarActiveTintColor` e
`tabBarInactiveTintColor` do `Tab.Navigator`. O resto do app (headers,
fundos de tela, cards) continua claro — só a barra de abas mudou até agora.

## Ainda pendente (decisão do usuário)

- Se o restante do app também vira tema escuro (headers, fundos de tela)
  ou fica claro como hoje, com só a barra de abas na cor da marca.
- Hex exatos da marca (o que está em `marcaAzul*` é uma estimativa visual).

Quando isso for decidido, a mudança é só em
[src/theme/colors.ts](../src/theme/colors.ts) — nenhum componente precisa
ser tocado, já que todos importam `cores` de lá.
