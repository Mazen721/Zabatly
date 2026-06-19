import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  AccessibilityInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

import colors from '@/theme/colors';
import typography, { fontFamily } from '@/theme/typography';
import { spacing, radius, touchTarget } from '@/theme/spacing';
import { chat } from '@/api/client';
import AiVehicleCard from '@/components/AiVehicleCard';

const TYPEWRITER_CHUNK = 4;
const TYPEWRITER_DELAY = 10;
const WELCOME_ID = 'welcome-message';

const WELCOME_TEXT =
  'Tell me what you need: city, dates, passengers, and budget. I will find matching cars for you.';

function OnlineDot() {
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900 }),
        withTiming(0.45, { duration: 900 }),
      ),
      -1,
      false,
    );
  }, [opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.onlineDot, style]} />;
}

function ThinkingDot({ delay }) {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 350 }),
          withTiming(0.35, { duration: 350 }),
        ),
        -1,
        false,
      );
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.thinkingDot, style]} />;
}

function ThinkingIndicator() {
  return (
    <View style={styles.thinkingWrap}>
      <View style={styles.thinkingBubble}>
        <Text style={styles.thinkingText}>Thinking</Text>
        <View style={styles.thinkingDots}>
          <ThinkingDot delay={0} />
          <ThinkingDot delay={120} />
          <ThinkingDot delay={240} />
        </View>
      </View>
    </View>
  );
}

function TypewriterCursor() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.15, { duration: 450 }),
        withTiming(1, { duration: 450 }),
      ),
      -1,
      false,
    );
  }, [opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.cursor, style]} />;
}

function buildChatHistory(messageList) {
  return [...messageList]
    .reverse()
    .filter((msg) => !msg.isError && msg.id !== WELCOME_ID)
    .map((msg) => {
      const role = msg.type === 'user' ? 'User' : 'Assistant';
      const content = msg.fullText || msg.text || '';
      return `${role}: ${content}`;
    })
    .join('\n');
}

export default function AiChatScreen() {
  const insets = useSafeAreaInsets();
  const { prompt } = useLocalSearchParams();
  const listRef = useRef(null);
  const [inputText, setInputText] = useState('');
  const [inputHeight, setInputHeight] = useState(40);
  const [isLoading, setIsLoading] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: WELCOME_ID,
      type: 'ai',
      text: WELCOME_TEXT,
      fullText: WELCOME_TEXT,
      isTyping: false,
      vehicles: [],
      savings_tip: '',
    },
  ]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener?.(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => subscription?.remove?.();
  }, []);

  useEffect(() => {
    if (typeof prompt === 'string' && prompt.trim()) {
      setInputText(prompt.trim());
    }
  }, [prompt]);

  useEffect(() => {
    const typingMessage = messages.find((msg) => msg.type === 'ai' && msg.isTyping);
    if (!typingMessage) return undefined;

    const fullText = typingMessage.fullText || '';

    if (reduceMotion || typingMessage.text.length >= fullText.length) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === typingMessage.id
            ? { ...msg, text: fullText, isTyping: false }
            : msg,
        ),
      );
      return undefined;
    }

    const timer = setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== typingMessage.id) return msg;
          const nextText = fullText.slice(0, msg.text.length + TYPEWRITER_CHUNK);
          return {
            ...msg,
            text: nextText,
            isTyping: nextText.length < fullText.length,
          };
        }),
      );
    }, TYPEWRITER_DELAY);

    return () => clearTimeout(timer);
  }, [messages, reduceMotion]);

  const sendMessage = useCallback(
    async (rawText) => {
      const userText = rawText.trim();
      if (!userText || isLoading) return;

      setInputText('');
      setInputHeight(40);

      const userMessage = {
        id: `${Date.now()}-user`,
        type: 'user',
        text: userText,
        fullText: userText,
      };

      const historySnapshot = [userMessage, ...messages];
      setMessages((prev) => [userMessage, ...prev]);
      setIsLoading(true);

      try {
        const { data } = await chat({
          message: userText,
          history: buildChatHistory(historySnapshot),
        });

        const reply =
          data?.reply || 'Here are the vehicles I found matching your request.';

        const aiMessage = {
          id: `${Date.now()}-ai`,
          type: 'ai',
          text: reduceMotion ? reply : '',
          fullText: reply,
          isTyping: !reduceMotion,
          vehicles: data?.vehicles || [],
          savings_tip: data?.savings_tip || '',
        };

        setMessages((prev) => [aiMessage, ...prev]);
      } catch {
        const errorMessage = {
          id: `${Date.now()}-error`,
          type: 'ai',
          text: 'Sorry, I could not reach the server. Please try again.',
          fullText: 'Sorry, I could not reach the server. Please try again.',
          isTyping: false,
          isError: true,
          vehicles: [],
          savings_tip: '',
        };
        setMessages((prev) => [errorMessage, ...prev]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, reduceMotion],
  );

  const handleSend = () => {
    sendMessage(inputText);
  };

  const handleRetry = (errorMessageId) => {
    const errorIndex = messages.findIndex((msg) => msg.id === errorMessageId);
    if (errorIndex === -1) return;

    const lastUser = messages.slice(errorIndex + 1).find((msg) => msg.type === 'user');
    if (!lastUser) return;

    setMessages((prev) => prev.filter((msg) => msg.id !== errorMessageId));
    sendMessage(lastUser.text);
  };

  const renderMessageItem = ({ item }) => {
    if (item.type === 'user') {
      return (
        <View style={styles.userRow}>
          <View style={styles.userBubble}>
            <Text style={styles.userText}>{item.text}</Text>
          </View>
        </View>
      );
    }

    const showExtras = !item.isTyping && !item.isError;

    return (
      <View style={styles.aiRow}>
        <View style={[styles.aiBubble, item.isError && styles.aiBubbleError]}>
          <View style={styles.aiTextRow}>
            <Text style={[styles.aiText, item.isError && styles.aiTextError]}>
              {item.text}
            </Text>
            {item.isTyping && <TypewriterCursor />}
          </View>
        </View>

        {item.isError && (
          <TouchableOpacity
            onPress={() => handleRetry(item.id)}
            activeOpacity={0.85}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        )}

        {showExtras && !!item.savings_tip && (
          <View style={styles.savingsTip}>
            <Text style={styles.savingsTipText}>{item.savings_tip}</Text>
          </View>
        )}

        {showExtras && item.vehicles?.length > 0 && (
          <View style={styles.vehicleStack}>
            {item.vehicles.map((vehicle) => (
              <AiVehicleCard
                key={vehicle._id}
                vehicle={vehicle}
                onPress={() =>
                  router.push({
                    pathname: '/tabs/browse/[id]',
                    params: { id: vehicle._id },
                  })
                }
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.headerTitle}>Zabatly AI</Text>
        <View style={styles.headerStatus}>
          <OnlineDot />
          <Text style={styles.headerStatusText}>Online · vehicle finder</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          inverted
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={isLoading ? <ThinkingIndicator /> : null}
        />

        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
          <TextInput
            style={[styles.input, { height: Math.min(100, Math.max(40, inputHeight)) }]}
            placeholder="Describe your trip..."
            placeholderTextColor={colors.ashSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height)}
            editable={!isLoading}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons name="arrow-up" size={20} color={colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sandCream,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.sandCream,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.stoneBorder,
  },
  headerTitle: {
    ...typography.title,
    fontSize: 22,
    color: colors.duskText,
  },
  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: colors.status.active.text,
  },
  headerStatusText: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexGrow: 1,
  },
  userRow: {
    alignSelf: 'flex-end',
    maxWidth: '82%',
    marginVertical: spacing.xs,
  },
  userBubble: {
    backgroundColor: colors.navy.default,
    borderRadius: radius.md,
    borderTopRightRadius: radius.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  userText: {
    ...typography.body,
    color: colors.sandCream,
  },
  aiRow: {
    alignSelf: 'flex-start',
    maxWidth: '92%',
    width: '100%',
    marginVertical: spacing.xs,
  },
  aiBubble: {
    backgroundColor: colors.warmLinen,
    borderRadius: radius.md,
    borderTopLeftRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  aiBubbleError: {
    backgroundColor: colors.status.error.bg,
    borderColor: colors.status.error.border,
  },
  aiText: {
    ...typography.body,
    color: colors.duskText,
    lineHeight: 22,
    flexShrink: 1,
  },
  aiTextRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  aiTextError: {
    color: colors.status.error.text,
  },
  cursor: {
    width: 2,
    height: 16,
    backgroundColor: colors.ashSecondary,
    marginLeft: 2,
    transform: [{ translateY: 2 }],
  },
  retryButton: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  retryText: {
    ...typography.labelSmall,
    color: colors.status.error.text,
    fontFamily: fontFamily.semiBold,
  },
  savingsTip: {
    marginTop: spacing.sm,
    backgroundColor: colors.status.pending.bg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.status.pending.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    maxWidth: '100%',
  },
  savingsTipText: {
    ...typography.bodySmall,
    color: colors.status.pending.text,
    lineHeight: 18,
  },
  vehicleStack: {
    marginTop: spacing.sm,
    gap: spacing.sm,
    width: '100%',
  },
  thinkingWrap: {
    alignSelf: 'flex-start',
    marginVertical: spacing.xs,
  },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmLinen,
    borderRadius: radius.md,
    borderTopLeftRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  thinkingText: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
    marginRight: spacing.xs,
  },
  thinkingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  thinkingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.navy.default,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.sandCream,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.stoneBorder,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.warmLinen,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    ...typography.body,
    color: colors.duskText,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 10,
  },
  sendButton: {
    width: touchTarget.min,
    height: touchTarget.min,
    borderRadius: radius.full,
    backgroundColor: colors.navy.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
});
