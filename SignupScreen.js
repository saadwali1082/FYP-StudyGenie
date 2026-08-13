// SignupScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Cross-platform alert (Works on both Web browser & Mobile)
  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const isValidEmail = (emailStr) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr.trim());
  };

  const handleSignup = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      showAlert('Missing Name', 'Please enter your name before continuing.');
      return;
    }

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      showAlert('Invalid Email', 'Please enter a valid email address (e.g. user@example.com).');
      return;
    }

    if (!password) {
      showAlert('Missing Password', 'Please enter a password.');
      return;
    }

    setLoading(true);

    try {
      // Save credentials for app session & profile display
      await AsyncStorage.setItem('loggedIn', 'true');
      await AsyncStorage.setItem('userName', cleanName);
      await AsyncStorage.setItem('userEmail', cleanEmail);

      setLoading(false);
      // Immediately navigate to Home screen
      navigation.navigate('Home');
    } catch (error) {
      setLoading(false);
      showAlert('Error', 'Failed to create account. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.formContent}>
          <Text style={styles.title}>Create Account</Text>

          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#999999"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.disabledButton]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#6C2BFF" />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#6C2BFF' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 25, paddingVertical: 40 },
  formContent: { width: '100%', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', marginBottom: 30, textAlign: 'center' },
  input: { backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, fontSize: 15, color: '#333333', width: '100%', marginBottom: 15 },
  button: { backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 14, width: '100%', alignItems: 'center', marginTop: 10 },
  disabledButton: { opacity: 0.7 },
  buttonText: { color: '#6C2BFF', fontSize: 16, fontWeight: 'bold' },
  footerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  footerText: { color: '#ffffff', fontSize: 14 },
  footerLink: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', textDecorationLine: 'underline' },
});
