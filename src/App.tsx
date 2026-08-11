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
import PresetStatsScreen from './screens/PresetStatsScreen';
import ScorecardScreen from './screens/ScorecardScreen';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TourProvider } from './contexts/TourContext';


export type RootStackParamList = {
  Home: undefined;
  Scorecard: { scorecardId: string };
  History: undefined;
  PresetStats: { presetId: string };
  AllPresets: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    ChalkboardBold: require('../assets/fonts/chalkboard-se-bold.ttf'),
    ChalkboardRegular: require('../assets/fonts/chalkboard-se-regular.ttf'),
    ChalkboardLight: require('../assets/fonts/chalkboard-se-light.ttf'),
  });

useEffect(() => {
  if (fontsLoaded) {
    SplashScreen.hideAsync();
  }
}, [fontsLoaded]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <TourProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Scorecard" component={ScorecardScreen} />
              <Stack.Screen name="History" component={HistoryScreen} />
              <Stack.Screen name="PresetStats" component={PresetStatsScreen} />
              <Stack.Screen name="AllPresets" component={AllPresetsScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </TourProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}