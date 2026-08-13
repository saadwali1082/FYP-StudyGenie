import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function QuizResultScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.score}>80%</Text>
      <Text style={styles.title}>Great Job 🎉</Text>
      <Text>Total Questions: 10</Text>
      <Text>Correct: 8</Text>
      <Text>Wrong: 2</Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Back Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  score: { fontSize: 60, fontWeight: 'bold', color: '#6C2BFF' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  button: { backgroundColor: '#6C2BFF', padding: 15, borderRadius: 12, marginTop: 25, width: '80%' },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
});
