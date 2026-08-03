// App.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import SplashScreen from './SplashScreen';
import OnboardingScreen from './OnboardingScreen';
import LoginScreen from './LoginScreen';
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

  // Load saved materials only once when the app starts
  useEffect(() => {
    const loadSavedMaterials = async () => {
      try {
        console.log('📚 Loading materials...');

        const savedMaterials = await loadMaterials();

        if (Array.isArray(savedMaterials)) {
          setMaterials(savedMaterials);

          console.log(
            `📚 Loaded ${savedMaterials.length} materials from storage`
          );
        } else {
          setMaterials([]);
          console.log('ℹ️ No saved materials found');
        }
      } catch (error) {
        console.error('❌ Failed to load materials:', error);
        setMaterials([]);
      } finally {
        setHasLoadedMaterials(true);
        setIsLoading(false);
      }
    };

    loadSavedMaterials();
  }, []);

  // Save materials whenever the list changes.
  // This also saves an empty array when the final document is deleted.
  useEffect(() => {
    if (!hasLoadedMaterials) {
      return;
    }

    const saveUpdatedMaterials = async () => {
      try {
        await saveMaterials(materials);

        console.log(
          `💾 Saved ${materials.length} materials to storage`
        );
      } catch (error) {
        console.error('❌ Failed to save materials:', error);
      }
    };

    saveUpdatedMaterials();
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
    route: {
      params: routeParams,
    },
    materials,
    setMaterials,
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />

        <Text style={styles.loadingText}>
          Loading your materials...
        </Text>
      </View>
    );
  }

  switch (screen) {
    case 'Splash':
      return <SplashScreen navigation={navigation} />;

    case 'Onboarding':
      return <OnboardingScreen navigation={navigation} />;

    case 'Login':
      return <LoginScreen navigation={navigation} />;

    case 'Home':
      return <HomeScreen {...commonProps} />;

    case 'Materials':
      return <MaterialsScreen {...commonProps} />;

    case 'Chatbot':
      return <ChatbotScreen {...commonProps} />;

    case 'Planner':
      return <StudyPlannerScreen {...commonProps} />;

    case 'Progress':
      return <ProgressScreen {...commonProps} />;

    case 'Profile':
      return <ProfileScreen {...commonProps} />;

    case 'Settings':
      return <SettingsScreen {...commonProps} />;

    case 'Summary':
      return <SummaryScreen {...commonProps} />;

    case 'Flashcards':
      return <FlashcardsScreen {...commonProps} />;

    case 'Quiz':
      return <QuizScreen {...commonProps} />;

    default:
      return <HomeScreen {...commonProps} />;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },

  loadingText: {
    marginTop: 10,
    color: '#666',
  },
});