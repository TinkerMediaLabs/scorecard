import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AllPresetsScreen from './screens/AllPresetsScreen';
import HistoryScreen from './screens/HistoryScreen';
import HomeScreen from './screens/HomeScreen';
import PaywallScreen from './screens/PaywallScreen';
import PresetStatsScreen from './screens/PresetStatsScreen';
import ScorecardScreen from './screens/ScorecardScreen';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PurchasesProvider } from './contexts/PurchasesContext';
import { TourProvider } from './contexts/TourContext';


export type RootStackParamList = {
  Home: undefined;
  Scorecard: { scorecardId: string };
  History: undefined;
  PresetStats: { presetId: string };
  AllPresets: undefined;
  Paywall: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    FuzzyBubblesRegular: require('../assets/fonts/fuzzy-bubbles-regular.ttf'),
    FuzzyBubblesBold: require('../assets/fonts/fuzzy-bubbles-bold.ttf'),
    PressStart2P: require('../assets/fonts/press-start-2p-regular.ttf'),
  });

useEffect(() => {
  if (fontsLoaded) {
    SplashScreen.hideAsync();
  }
}, [fontsLoaded]);

  // Don't mount any of the app's screens until the custom fonts have actually finished
  // loading. Previously the full tree rendered unconditionally and relied on the native
  // splash screen to visually hide things until `fontsLoaded` flipped true — but React
  // doesn't wait for the splash overlay: every Text node still ran its *first* layout pass
  // immediately on mount, which (on some devices) landed before iOS had finished
  // registering the custom font with CoreText. Those Text nodes got measured/rendered with
  // the system fallback font and, unless something happened to force them to re-render
  // later, stayed stuck that way — which is why it only ever affected some labels, was
  // worse on certain iPhones, and why a few labels would "fix themselves" the moment some
  // unrelated state change forced a re-render. Returning null here means nothing mounts
  // until fonts are guaranteed ready, so no Text node ever gets a first pass with the
  // wrong font.
  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <PurchasesProvider>
          <TourProvider>
            <NavigationContainer>
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Scorecard" component={ScorecardScreen} />
                <Stack.Screen name="History" component={HistoryScreen} />
                <Stack.Screen name="PresetStats" component={PresetStatsScreen} />
                <Stack.Screen name="AllPresets" component={AllPresetsScreen} />
                <Stack.Screen name="Paywall" component={PaywallScreen} options={{ presentation: 'modal' }} />
              </Stack.Navigator>
            </NavigationContainer>
          </TourProvider>
        </PurchasesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}