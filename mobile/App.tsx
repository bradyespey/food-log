// FoodLog Mobile — root entry point.
// Root stack: Login (unauthenticated) | Tabs + capture flow (authenticated).

import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { DraftsProvider } from './src/context/DraftsContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import LoginScreen from './src/screens/LoginScreen';
import TabsNavigator from './src/screens/TabsNavigator';
import CaptureScreen from './src/screens/CaptureScreen';
import DraftDetailScreen from './src/screens/DraftDetailScreen';
import AnalyzingScreen from './src/screens/AnalyzingScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import type { RootStackParamList } from './src/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

function Root() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!user) return <LoginScreen />;

  return (
    <DraftsProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabsNavigator} />
        <Stack.Screen
          name="Capture"
          component={CaptureScreen}
          options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
        />
        <Stack.Screen
          name="DraftDetail"
          component={DraftDetailScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Analyzing"
          component={AnalyzingScreen}
          options={{ animation: 'fade', gestureEnabled: false }}
        />
        <Stack.Screen
          name="Review"
          component={ReviewScreen}
          options={{ animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
    </DraftsProvider>
  );
}

function ThemedStatusBar() {
  const { resolvedAppearance } = useTheme();
  return <StatusBar style={resolvedAppearance === 'dark' ? 'light' : 'dark'} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer>
            <Root />
            <ThemedStatusBar />
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
