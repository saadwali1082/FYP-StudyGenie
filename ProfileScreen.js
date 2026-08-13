// ProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen({ navigation }) {
  const [userName, setUserName] = useState('Student');
  const [userEmail, setUserEmail] = useState('student@example.com');

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const savedName = await AsyncStorage.getItem('userName');
        const savedEmail = await AsyncStorage.getItem('userEmail');

        if (savedName) setUserName(savedName);
        if (savedEmail) setUserEmail(savedEmail);
      } catch (error) {
        console.log('Error loading profile data:', error);
      }
    };

    loadProfileData();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('loggedIn');
      // Takes user directly to the Login screen on logout
      navigation.navigate('Login');
    } catch (e) {
      if (Platform.OS === 'web') {
        window.alert('Failed to log out');
      } else {
        Alert.alert('Error', 'Failed to log out');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.avatar}>👨‍🎓</Text>
      <Text style={styles.name}>{userName}</Text>
      <Text style={styles.email}>{userEmail}</Text>

      <Text style={styles.box}>Materials: Ready</Text>
      <Text style={styles.box}>Quizzes: Active</Text>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>🏠 Back Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 25, alignItems: 'center', backgroundColor: '#6C2BFF' },
  avatar: { fontSize: 80, marginTop: 40, marginBottom: 10 },
  name: { fontSize: 26, fontWeight: 'bold', color: '#ffffff' },
  email: { color: '#e0d0ff', marginBottom: 25, fontSize: 15 },
  box: { backgroundColor: '#ffffff', color: '#6C2BFF', fontWeight: 'bold', padding: 15, borderRadius: 12, width: '100%', marginBottom: 10, textAlign: 'center' },
  logoutButton: { backgroundColor: '#ffffff', padding: 15, borderRadius: 12, marginTop: 15, width: '100%' },
  logoutText: { color: '#d32f2f', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
  button: { backgroundColor: '#ffffff', padding: 15, borderRadius: 12, marginTop: 10, width: '100%' },
  buttonText: { color: '#6C2BFF', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
});
