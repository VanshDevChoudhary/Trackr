import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { colors, fonts, border } from '../theme';

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
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
          <Text style={styles.topTitle}>TRACKR</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Create account</Text>
          <Text style={styles.heroSub}>Join the community and start tracking your progress.</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.form}>
          <Text style={styles.label}>FULL NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="HANS SCHMIDT"
            placeholderTextColor={colors.textLight}
            value={name}
            onChangeText={setName}
            autoCorrect={false}
          />

          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <TextInput
            style={styles.input}
            placeholder="HELLO@TRACKR.COM"
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
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.buttonText}>SIGN UP  →</Text>
            )}
          </Pressable>
        </View>

        <Pressable onPress={() => navigation.goBack()} style={styles.linkWrap}>
          <Text style={styles.link}>
            Already have an account? <Text style={styles.linkBold}>Log in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderWidth: border.width,
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 20,
    color: colors.text,
    fontFamily: fonts.bodyBold,
  },
  topTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    letterSpacing: 2,
    color: colors.text,
  },
  heroSection: {
    marginTop: 32,
    marginBottom: 32,
  },
  heroTitle: {
    fontFamily: fonts.serif,
    fontSize: 42,
    color: colors.text,
    marginBottom: 12,
  },
  heroSub: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
  error: {
    fontFamily: fonts.bodyMedium,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 13,
  },
  form: {
    marginBottom: 32,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.text,
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    borderWidth: border.width,
    borderColor: colors.text,
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 16,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  button: {
    backgroundColor: colors.text,
    paddingVertical: 18,
    alignItems: 'center' as const,
    marginTop: 28,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    letterSpacing: 3,
    color: colors.surface,
  },
  linkWrap: {
    marginTop: 8,
  },
  link: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    textAlign: 'center' as const,
    fontSize: 14,
  },
  linkBold: {
    fontFamily: fonts.bodyBold,
    color: colors.text,
    textDecorationLine: 'underline',
  },
});
