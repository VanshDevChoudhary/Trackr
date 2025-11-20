import React, { Component, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fonts, border } from '../theme';

type Props = {
  children: ReactNode;
  fallbackLabel?: string;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.topBar}>
            <Text style={styles.topBarLeft}>SYSTEM STATUS: CRITICAL</Text>
            <Text style={styles.topBarRight}>TRACKR V1.0.0</Text>
          </View>

          <View style={styles.iconWrap}>
            <View style={styles.triangle}>
              <Text style={styles.triangleText}>!</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Something Broke.</Text>
            <Text style={styles.message}>
              The Trackr core engine encountered an unexpected runtime exception. All active processes have been paused to prevent data loss.
            </Text>
            <Pressable style={styles.retry} onPress={this.handleRetry}>
              <Text style={styles.retryText}>RESET VIEW</Text>
            </Pressable>
          </View>

          {this.props.fallbackLabel && (
            <Text style={styles.errorId}>
              LOCATION: {this.props.fallbackLabel.toUpperCase()}
            </Text>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    paddingTop: 56,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 48,
  },
  topBarLeft: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.text,
  },
  topBarRight: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.text,
  },
  iconWrap: {
    alignItems: 'center',
    marginBottom: 32,
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 48,
    borderRightWidth: 48,
    borderBottomWidth: 84,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.text,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  triangleText: {
    color: colors.surface,
    fontSize: 28,
    fontFamily: fonts.bodyBold,
    position: 'absolute',
    bottom: -76,
  },
  card: {
    borderWidth: border.width,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 32,
    alignItems: 'center',
    // offset shadow effect
    shadowColor: colors.text,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 32,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  retry: {
    backgroundColor: colors.primary,
    borderWidth: border.width,
    borderColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
  },
  retryText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    letterSpacing: 2,
    color: colors.text,
  },
  errorId: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 32,
  },
});
