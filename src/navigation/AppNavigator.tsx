import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ConfiguracaoScreen } from '../screens/Configuracao/ConfiguracaoScreen';
import { IdentificarEntregadorScreen } from '../screens/IdentificarEntregador/IdentificarEntregadorScreen';
import { SplashScreen } from '../screens/Splash/SplashScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * `Splash` decide a rota inicial (config pendente, login pendente ou
 * entregador "permanecer logado" já salvo) antes de mostrar qualquer tela.
 * `IdentificarEntregador` funciona como uma tela de "login", fora da barra
 * de abas — só depois de identificar o entregador o app entra em `MainTabs`
 * (bottom tab navigator com Bipagem, Minhas entregas e Mapa).
 */
export function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Configuracao" component={ConfiguracaoScreen} />
      <Stack.Screen
        name="IdentificarEntregador"
        component={IdentificarEntregadorScreen}
      />
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
    </Stack.Navigator>
  );
}
