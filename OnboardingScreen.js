import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function OnboardingScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📚</Text>
      <Text style={styles.title}>Your AI Study Companion</Text>
      <Text style={styles.text}>
        Upload notes, generate summaries, quizzes, flashcards and smart study plans.
      </Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 25, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  icon: { fontSize: 85 },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', color: '#151047' },
  text: { textAlign: 'center', color: '#555', marginTop: 15, lineHeight: 22 },
  button: { marginTop: 35, backgroundColor: '#6C2BFF', padding: 15, borderRadius: 14, width: '90%' },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
});
