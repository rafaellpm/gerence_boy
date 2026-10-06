# Escopo Visual / UI-UX

Interface simples, moderna e objetiva, focada no uso rápido durante as
entregas (mesmo direcionamento do escopo original).

## Diretrizes

- Botões grandes, fáceis de tocar com o app em uso durante deslocamento.
- Boa legibilidade em telas de celular (contraste alto, fontes grandes o
  suficiente para leitura rápida).
- Poucos passos até a ação principal (bipar → ver entrega → abrir no Maps →
  marcar como entregue).
- Feedback claro e imediato após cada leitura de código de barras:
  - sucesso: destaque verde + nome/código reconhecido;
  - erro/não encontrado: destaque vermelho + mensagem curta.
- Estados de carregamento visíveis (ex.: spinner) ao consultar
  entregador/entrega — já suportado hoje pelo delay artificial dos mocks.
- Situação da entrega sempre visível na lista (badge "Pendente" / "Entregue").

## Componentes de UI previstos (fase futura)

- `BotaoGrande` — botão de ação principal, alto contraste.
- `CardEntrega` — item da lista de entregas (código, cliente, endereço, status).
- `BadgeSituacao` — indicador visual de pendente/entregue.
- `FeedbackLeitura` — banner/snackbar de sucesso ou erro após leitura do código.

Esses componentes serão criados nas fases 2–4 do roadmap de execução, junto
com as telas que os utilizam.
