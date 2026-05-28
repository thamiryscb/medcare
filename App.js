import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from './src/screens/LoginScreen';
import LoginFamiliarScreen from './src/screens/LoginFamiliarScreen';
import HomeScreen from './src/screens/HomeScreen';
import RemediosScreen from './src/screens/RemediosScreen';
import ChecklistScreen from './src/screens/ChecklistScreen';
import FamiliaScreen from './src/screens/FamiliaScreen';
import HomeFamiliarScreen from './src/screens/HomeFamiliarScreen';
import RemediosFamiliarScreen from './src/screens/RemediosFamiliarScreen';
import ChecklistFamiliarScreen from './src/screens/ChecklistFamiliarScreen';
import { AuthProvider } from './src/auth/AuthContext';

const Stack = createStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Remedios" component={RemediosScreen} />
          <Stack.Screen name="Checklist" component={ChecklistScreen} />
          <Stack.Screen name="Familia" component={FamiliaScreen} />
          <Stack.Screen name="LoginFamiliar" component={LoginFamiliarScreen} />
          <Stack.Screen name="HomeFamiliar" component={HomeFamiliarScreen} />
          <Stack.Screen name="RemediosFamiliar" component={RemediosFamiliarScreen} />
          <Stack.Screen name="ChecklistFamiliar" component={ChecklistFamiliarScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
