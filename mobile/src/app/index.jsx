import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import colors from '@/theme/colors';

export default function EntryRouter() {
  const { user, isLoading } = useAuth();
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const onboarded = await AsyncStorage.getItem('zabatly_onboarded');
        setIsOnboarded(onboarded === 'true');
      } catch {
        setIsOnboarded(false);
      } finally {
        setHasCheckedOnboarding(true);
      }
    }

    checkOnboarding();
  }, []);

  useEffect(() => {
    if (isLoading || !hasCheckedOnboarding) {
      return;
    }

    if (!isOnboarded) {
      router.replace('/onboarding');
      return;
    }

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    router.replace('/tabs');
  }, [hasCheckedOnboarding, isLoading, isOnboarded, user]);

  return <View style={styles.loading} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.navy.deep,
  },
});
