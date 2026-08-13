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

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);

    try {
      await AsyncStorage.setItem('loggedIn', 'true');
      await AsyncStorage.setItem('userEmail', email);

      setTimeout(() => {
        setLoading(false);
        navigation.navigate('Home');
      }, 800);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to log in. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.formContent}>
          <Text style={styles.title}>Login</Text>

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
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#6C2BFF" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.footerLink}>Sign Up</Text>
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
