import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '@/lib/theme/colors';
import { api } from '@/lib/api/client';

// Required for auth session to work properly
WebBrowser.maybeCompleteAuthSession();

const GITHUB_CLIENT_ID = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID || '';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Discovery document for GitHub OAuth
const discovery = {
  authorizationEndpoint: 'https://github.com/login/oauth/authorize',
  tokenEndpoint: 'https://github.com/login/oauth/access_token',
  revocationEndpoint: `https://github.com/settings/connections/applications/${GITHUB_CLIENT_ID}`,
};

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create auth request
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GITHUB_CLIENT_ID,
      scopes: ['read:user', 'repo'],
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'patchpilot',
      }),
    },
    discovery
  );

  const handleGitHubLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await promptAsync();

      if (result.type === 'success' && result.params.code) {
        // Exchange code for token via our backend
        const tokenResponse = await api.post<{ token: string }>('/api/auth/mobile/exchange', {
          code: result.params.code,
          redirectUri: AuthSession.makeRedirectUri({ scheme: 'patchpilot' }),
        });

        // Store the token
        await api.setToken(tokenResponse.token);

        // Navigate to main app
        router.replace('/(tabs)');
      } else if (result.type === 'error') {
        setError(result.error?.message || 'Authentication failed');
      } else if (result.type === 'cancel') {
        setError('Authentication was cancelled');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background gradient effect */}
      <View style={styles.gradientOverlay} />

      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Ionicons name="flash" size={32} color={colors.dark.primaryForeground} />
          </View>
          <Text style={styles.logoText}>PatchPilot</Text>
          <Text style={styles.tagline}>Self-healing QA for your codebase</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome</Text>
          <Text style={styles.cardDescription}>
            Connect your GitHub account to access the dashboard and manage your test runs.
          </Text>

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color={colors.dark.destructive} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleGitHubLogin}
            disabled={loading || !request}
          >
            {loading ? (
              <ActivityIndicator color={colors.dark.primaryForeground} />
            ) : (
              <>
                <Ionicons name="logo-github" size={20} color={colors.dark.primaryForeground} />
                <Text style={styles.buttonText}>Connect with GitHub</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.securityBadge}>
            <Ionicons name="shield-checkmark" size={14} color={colors.dark.success} />
            <Text style={styles.securityText}>Secured connection</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Built for WeaveHacks 2026
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  gradientOverlay: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.dark.primary,
    opacity: 0.1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing[10],
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
    ...shadows.primary,
  },
  logoText: {
    fontSize: typography.sizes['3xl'],
    fontFamily: 'Inter-Bold',
    color: colors.dark.foreground,
    marginBottom: spacing[1],
  },
  tagline: {
    fontSize: typography.sizes.sm,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.dark.card,
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    borderWidth: 1,
    borderColor: colors.dark.border,
    ...shadows.lg,
  },
  cardTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark.foreground,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  cardDescription: {
    fontSize: typography.sizes.sm,
    color: colors.dark.mutedForeground,
    textAlign: 'center',
    marginBottom: spacing[6],
    fontFamily: 'Inter-Regular',
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.dark.destructive}15`,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: colors.dark.destructive,
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dark.primary,
    borderRadius: borderRadius.lg,
    height: 48,
    gap: spacing[2],
    ...shadows.primary,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: typography.sizes.base,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark.primaryForeground,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[4],
    gap: spacing[1],
  },
  securityText: {
    fontSize: typography.sizes.xs,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
  },
  footer: {
    position: 'absolute',
    bottom: spacing[8],
    fontSize: typography.sizes.sm,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
  },
});
