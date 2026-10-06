# Fluxo do Usuário

1. Abrir o aplicativo.
2. Ler o código de barras do entregador (câmera).
3. Consultar e identificar o entregador (`entregadorService`, hoje mockado).
4. Entrar no modo de leitura das entregas.
5. Bipar os códigos dos pedidos (câmera).
6. Consultar cada entrega (`entregaService`, hoje mockado).
7. Adicionar as entregas encontradas à lista do entregador (Context).
8. Visualizar as entregas vinculadas (tela de lista).
9. Abrir o endereço/coordenadas no Google Maps (Linking + Intent/URI).
10. Realizar a entrega (fora do app).
11. Marcar o pedido como entregue na tela de lista.
12. Enviar a atualização (`entregaService.marcarComoEntregue`, hoje mockado)
    e atualizar o status na tela.

Este fluxo é idêntico ao especificado originalmente para o app em Delphi;
apenas a implementação técnica de cada passo muda para React Native.
