// App.js
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SplashScreen from './SplashScreen';
import OnboardingScreen from './OnboardingScreen';
import LoginScreen from './LoginScreen';
import SignupScreen from './SignupScreen';
import HomeScreen from './HomeScreen';
import MaterialsScreen from './MaterialsScreen';
import ChatbotScreen from './ChatbotScreen';
import StudyPlannerScreen from './StudyPlannerScreen';
import ProgressScreen from './ProgressScreen';
import ProfileScreen from './ProfileScreen';
import SettingsScreen from './SettingsScreen';
import SummaryScreen from './SummaryScreen';
import FlashcardsScreen from './FlashcardsScreen';
import QuizScreen from './QuizScreen';

import { loadMaterials, saveMaterials } from './storageService';

export default function App() {
  const [screen, setScreen] = useState('Splash');
  const [routeParams, setRouteParams] = useState({});
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedMaterials, setHasLoadedMaterials] = useState(false);

  // Splash Screen & Login Check (2-second timer matching sample code)
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const savedMaterials = await loadMaterials();
        if (Array.isArray(savedMaterials)) {
          setMaterials(savedMaterials);
        }
      } catch (error) {
        console.log('Materials load error:', error);
      } finally {
        setHasLoadedMaterials(true);
      }

      // Show Splash Screen for 2 seconds before checking login state
      setTimeout(async () => {
        try {
          const loggedIn = await AsyncStorage.getItem('loggedIn');
          if (loggedIn === 'true') {
            setScreen('Home');
          } else {
            setScreen('Signup');
          }
        } catch (e) {
          setScreen('Signup');
        } finally {
          setIsLoading(false);
        }
      }, 2000);
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if (!hasLoadedMaterials) return;
    saveMaterials(materials);
  }, [materials, hasLoadedMaterials]);

  const navigation = {
    navigate: (screenName, params = {}) => {
      setRouteParams(params);
      setScreen(screenName);
    },
    goBack: () => {
      setRouteParams({});
      setScreen('Home');
    },
  };

  const commonProps = {
    navigation,
    route: { params: routeParams },
    materials,
    setMaterials,
  };

  // Show Splash Screen during initial 2-second loading phase
  if (isLoading || screen === 'Splash') {
    return <SplashScreen navigation={navigation} />;
  }

  switch (screen) {
    case 'Splash': return <SplashScreen navigation={navigation} />;
    case 'Onboarding': return <OnboardingScreen navigation={navigation} />;
    case 'Login': return <LoginScreen navigation={navigation} />;
    case 'Signup': return <SignupScreen navigation={navigation} />;
    case 'Home': return <HomeScreen {...commonProps} />;
    case 'Materials': return <MaterialsScreen {...commonProps} />;
    case 'Chatbot': return <ChatbotScreen {...commonProps} />;
    case 'Planner': return <StudyPlannerScreen {...commonProps} />;
    case 'Progress': return <ProgressScreen {...commonProps} />;
    case 'Profile': return <ProfileScreen {...commonProps} />;
    case 'Settings': return <SettingsScreen {...commonProps} />;
    case 'Summary': return <SummaryScreen {...commonProps} />;
    case 'Flashcards': return <FlashcardsScreen {...commonProps} />;
    case 'Quiz': return <QuizScreen {...commonProps} />;
    default: return <HomeScreen {...commonProps} />;
  }
}
