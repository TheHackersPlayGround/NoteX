import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getSession } from './src/api';
import { ThemeProvider, useTheme } from './src/ThemeContext';
import { requestNotificationPermission } from './src/notifications';

import SplashScreenComponent from './src/screens/SplashScreen';
import SignUpScreen    from './src/screens/SignUpScreen';
import LoginScreen     from './src/screens/LoginScreen';
import NotesScreen     from './src/screens/NotesScreen';
import SearchScreen    from './src/screens/SearchScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import ProfileScreen   from './src/screens/ProfileScreen';
import NoteEditorScreen from './src/screens/NoteEditorScreen';
import TrashScreen      from './src/screens/TrashScreen';
import AboutDeveloperScreen from './src/screens/AboutDeveloperScreen';

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const TAB_ICONS = {
  Notes:     ['checkmark-done',  'checkmark-done-outline'],
  Search:    ['search',          'search-outline'],
  Favorites: ['document-text',  'document-text-outline'],
  Profile:   ['person',          'person-outline'],
};

function MainTabs() {
  const { colors, isDark } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.card,
          elevation: 0, shadowOpacity: 0,
          borderBottomWidth: 1, borderBottomColor: colors.border,
        },
        headerTitleStyle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
        tabBarIcon: ({ focused, color }) => {
          const [active, inactive] = TAB_ICONS[route.name];
          return <Ionicons name={focused ? active : inactive} size={22} color={color} />;
        },
        tabBarActiveTintColor:   colors.accent,
        tabBarInactiveTintColor: colors.textSecond,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Notes"     component={NotesScreen}     options={{ title: 'My Tasks',  tabBarLabel: 'Tasks'  }} />
      <Tab.Screen name="Search"    component={SearchScreen}    options={{ title: 'Search',    tabBarLabel: 'Search' }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Notes',     tabBarLabel: 'Notes'  }} />
      <Tab.Screen name="Profile"   component={ProfileScreen}   options={{ title: 'Profile',   tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

function AppNavigator({ initialRoute }) {
  const { isDark, colors } = useTheme();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.bg,
      card:       colors.card,
      text:       colors.textPrimary,
      border:     colors.border,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
        <Stack.Screen name="Splash"     component={SplashScreenComponent} />
        <Stack.Screen name="SignUp"     component={SignUpScreen} />
        <Stack.Screen name="Login"      component={LoginScreen} />
        <Stack.Screen name="MainTabs"   component={MainTabs} />
        <Stack.Screen name="NoteEditor" component={NoteEditorScreen} options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="Trash"      component={TrashScreen}      options={{ headerShown: true, title: 'Trash', presentation: 'card' }} />
        <Stack.Screen name="AboutDeveloper" component={AboutDeveloperScreen} options={{ headerShown: false, presentation: 'card' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function Root() {
  const [appIsReady,   setAppIsReady]   = useState(false);
  const [initialRoute, setInitialRoute] = useState('Splash');

  useEffect(() => {
    async function prepare() {
      try {
        const session = await getSession();
        setInitialRoute(session?.token ? 'MainTabs' : 'Splash');
        await requestNotificationPermission();
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) await SplashScreen.hideAsync();
  }, [appIsReady]);

  if (!appIsReady) return null;

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <PaperProvider>
        <AppNavigator initialRoute={initialRoute} />
      </PaperProvider>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Root />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
