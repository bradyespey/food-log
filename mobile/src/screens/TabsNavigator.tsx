// Bottom tab navigator. Capture tab intercepts press and navigates to
// the full-screen Capture stack screen instead of rendering a tab screen.

import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDrafts } from '../context/DraftsContext';
import { useTheme } from '../context/ThemeContext';
import DraftsScreen from './DraftsScreen';
import SettingsScreen from './SettingsScreen';
import Icon, { type IconName } from '../components/Icon';
import type { RootStackParamList, TabParamList } from '../navigation';

const Tab = createBottomTabNavigator<TabParamList>();

function CapturePlaceholder() {
  const { theme } = useTheme();
  return <View style={{ flex: 1, backgroundColor: theme.bg }} />;
}

export default function TabsNavigator() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { newDraft } = useDrafts();
  const { theme, resolvedAppearance } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: resolvedAppearance === 'dark' ? 'rgba(28,27,24,0.96)' : 'rgba(255,255,255,0.96)',
          borderTopColor: theme.border,
          paddingBottom: 20,
          paddingTop: 8,
          height: 76,
        },
        tabBarActiveTintColor: theme.text,
        tabBarInactiveTintColor: theme.textSubtle,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500', letterSpacing: 0.2 },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, IconName> = {
            CaptureTab: 'camera',
            Drafts: 'list',
            Settings: 'settings',
          };
          return <Icon name={iconMap[route.name] ?? 'list'} size={size} color={color} strokeWidth={1.8} />;
        },
      })}
      screenListeners={{
        tabPress: (e) => {
          if ((e.target as string)?.startsWith('CaptureTab')) {
            e.preventDefault();
            newDraft().then((id) => nav.navigate('Capture', { draftId: id })).catch(() => null);
          }
        },
      }}
    >
      <Tab.Screen name="Drafts" component={DraftsScreen} />
      <Tab.Screen name="CaptureTab" component={CapturePlaceholder} options={{ tabBarLabel: 'Capture' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
