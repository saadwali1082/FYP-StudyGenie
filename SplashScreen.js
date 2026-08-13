import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('Onboarding');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🤖</Text>
      <Text style={styles.title}>StudyGenie</Text>
      <Text style={styles.subtitle}>AI-Powered Smart Study Assistant</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1D0878', justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 90 },
  title: { fontSize: 38, color: '#fff', fontWeight: 'bold' },
  subtitle: { color: '#fff', marginTop: 10 },
});
