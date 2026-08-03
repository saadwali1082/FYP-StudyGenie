import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function ProfileScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.avatar}>👨‍🎓</Text>
      <Text style={styles.name}>Ali Raza</Text>
      <Text style={styles.email}>ali.raza@example.com</Text>

      <Text style={styles.box}>Materials: 24</Text>
      <Text style={styles.box}>Quizzes: 18</Text>
      <Text style={styles.box}>Study Hours: 12h 30m</Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Back Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 25, alignItems: 'center', backgroundColor: '#fff' },
  avatar: { fontSize: 80, marginTop: 50 },
  name: { fontSize: 26, fontWeight: 'bold' },
  email: { color: '#777', marginBottom: 30 },
  box: { backgroundColor: '#F1EEFF', padding: 15, borderRadius: 12, width: '100%', marginBottom: 10, textAlign: 'center' },
  button: { backgroundColor: '#6C2BFF', padding: 15, borderRadius: 12, marginTop: 25, width: '100%' },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
});