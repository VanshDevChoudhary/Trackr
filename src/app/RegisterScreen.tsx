import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';

type AuthStack = { Login: undefined; Register: undefined };

export default function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStack>>();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError('');
    if (!email.trim() || !password) {
      setError('Email and password required');
      return;
    }
    if (password.length < 8) {
      setError('Password needs 8+ characters');
      return;
    }

    setLoading(true);
    try {
      await register(email.trim().toLowerCase(), password, name.trim());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>trackr</Text>
        <Text style={styles.subtitle}>Create your account</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>
            Already have an account? <Text style={styles.linkBold}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  title: { fontSize: 36, fontWeight: '800', color: '#7c83ff', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#888', textAlign: 'center', marginTop: 8, marginBottom: 40 },
  error: { color: '#ff4d4d', textAlign: 'center', marginBottom: 16, fontSize: 14 },
  input: {
    backgroundColor: '#151515',
    borderRadius: 10,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#222',
  },
  button: {
    backgroundColor: '#7c83ff',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center' as const,
    marginTop: 8,
    marginBottom: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { color: '#888', textAlign: 'center' as const, fontSize: 14 },
  linkBold: { color: '#7c83ff', fontWeight: '600' },
});
