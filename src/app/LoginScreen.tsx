import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { colors, fonts, border } from '../theme';

type AuthStack = { Login: undefined; Register: undefined };

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStack>>();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError('');
    if (!email.trim() || !password) {
      setError('Fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
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
        <View style={styles.header}>
          <Text style={styles.logo}>trackr</Text>
          <Text style={styles.tagline}>SWISS PRECISION TRACKING</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.form}>
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <TextInput
            style={styles.input}
            placeholder="user@trackr.ch"
            placeholderTextColor={colors.textLight}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />

          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.textLight}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.buttonText}>LOG IN</Text>
            )}
          </Pressable>
        </View>

        <Pressable onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>
            Don't have an account? <Text style={styles.linkBold}>Sign up</Text>
          </Text>
        </Pressable>

        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerCopy}>© 2024 TRACKR AG — ZURICH</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontFamily: fonts.serif,
    fontSize: 72,
    color: colors.text,
    letterSpacing: -2,
  },
  tagline: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 4,
    color: colors.textMuted,
    marginTop: 8,
  },
  error: {
    fontFamily: fonts.bodyMedium,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 13,
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: border.width,
    borderColor: colors.text,
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 16,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.primary,
    borderWidth: border.width,
    borderColor: colors.text,
    paddingVertical: 18,
    alignItems: 'center' as const,
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    letterSpacing: 3,
    color: colors.text,
  },
  link: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    textAlign: 'center' as const,
    fontSize: 14,
    marginTop: 8,
  },
  linkBold: {
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  footer: {
    position: 'absolute',
    bottom: 48,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  footerDivider: {
    width: '100%',
    height: border.width,
    backgroundColor: colors.borderLight,
    marginBottom: 16,
  },
  footerCopy: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 4,
    color: colors.textLight,
  },
});
