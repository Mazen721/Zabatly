import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import colors from '@/theme/colors';
import typography, { fontFamily } from '@/theme/typography';
import shadows from '@/theme/shadows';
import { spacing, radius, touchTarget } from '@/theme/spacing';

const tabs = {
  dashboard: ['home-outline', 'home'],
  browse: ['car-outline', 'car'],
  'ai-chat': ['chatbubble-ellipses-outline', 'chatbubble-ellipses'],
  bookings: ['calendar-outline', 'calendar'],
  profile: ['person-outline', 'person'],
};

function TabIcon({ routeName, color, size, focused }) {
  return <Ionicons name={focused ? tabs[routeName][1] : tabs[routeName][0]} size={size} color={color} />;
}

function DashboardIcon(props) {
  return <TabIcon routeName="dashboard" {...props} />;
}

function BrowseIcon(props) {
  return <TabIcon routeName="browse" {...props} />;
}

function AiChatIcon(props) {
  return <TabIcon routeName="ai-chat" {...props} />;
}

function BookingsIcon(props) {
  return <TabIcon routeName="bookings" {...props} />;
}

function ProfileIcon(props) {
  return <TabIcon routeName="profile" {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.amber.default,
        tabBarInactiveTintColor: colors.ashSecondary,
        tabBarStyle: {
          ...shadows.nav,
          height: touchTarget.tabBar,
          backgroundColor: colors.navy.default,
          borderTopWidth: 0,
        },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', tabBarIcon: DashboardIcon }} />
      <Tabs.Screen name="browse" options={{ title: 'Browse', tabBarIcon: BrowseIcon }} />
      <Tabs.Screen name="ai-chat" options={{ title: 'AI Chat', tabBarIcon: AiChatIcon }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings', tabBarIcon: BookingsIcon }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ProfileIcon }} />
    </Tabs>
  );
}
