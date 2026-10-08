import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback } from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useEntregadorContext } from '../contexts/EntregadorContext';
import { ListaEntregasScreen } from '../screens/ListaEntregas/ListaEntregasScreen';
import { MapaEntregaScreen } from '../screens/MapaEntrega/MapaEntregaScreen';
import { PagamentosScreen } from '../screens/Pagamentos/PagamentosScreen';
import { SairProvider } from './SairContext';
import { MainTabParamList, RootStackParamList } from './types';
import { cores } from '../theme/colors';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONES: Record<keyof MainTabParamList, string> = {
  MinhasEntregas: 'clipboard-list-outline',
  Mapa: 'map-marker-outline',
  Pagamentos: 'cash-multiple',
};

function TabIcon({ nome, cor, tamanho }: { nome: keyof MainTabParamList; cor: string; tamanho: number }) {
  return <Icon name={ICONES[nome]} size={tamanho} color={cor} />;
}

type Props = NativeStackScreenProps<RootStackParamList, 'MainTabs'>;

export function MainTabNavigator({ navigation }: Props) {
  const { encerrarSessao } = useEntregadorContext();

  const sair = useCallback(() => {
    encerrarSessao();
    navigation.reset({ index: 0, routes: [{ name: 'IdentificarEntregador' }] });
  }, [encerrarSessao, navigation]);

  return (
    <SairProvider value={sair}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          // Header nativo desativado em todas as abas — cada tela usa o
          // `AppHeader` genérico no lugar (mesma cor de base da barra).
          headerShown: false,
          // eslint-disable-next-line react/no-unstable-nested-components -- padrão do react-navigation para tabBarIcon
          tabBarIcon: ({ color, size }) => (
            <TabIcon nome={route.name} cor={color} tamanho={size} />
          ),
          tabBarActiveTintColor: cores.tabAtivo,
          tabBarInactiveTintColor: cores.tabInativo,
          tabBarStyle: { backgroundColor: cores.tabFundo, borderTopWidth: 0 },
        })}
      >
        <Tab.Screen
          name="MinhasEntregas"
          component={ListaEntregasScreen}
          options={{ title: 'Minhas entregas' }}
        />
        <Tab.Screen name="Mapa" component={MapaEntregaScreen} options={{ title: 'Mapa' }} />
        <Tab.Screen
          name="Pagamentos"
          component={PagamentosScreen}
          options={{ title: 'Pagamentos' }}
        />
      </Tab.Navigator>
    </SairProvider>
  );
}
