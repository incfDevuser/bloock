import { Redirect, Tabs } from "expo-router";

import { TabGlyph } from "@/components/tab-glyph";
import { useOnboarding } from "@/providers/onboarding-provider";

export default function AppTabsLayout() {
  const { hydrated, completed } = useOnboarding();

  if (!hydrated) {
    return null;
  }

  if (!completed) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0f0f0f",
        tabBarInactiveTintColor: "rgba(15,15,15,0.45)",
        tabBarStyle: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 12,
          borderTopColor: "rgba(15,15,15,0.08)",
          borderTopWidth: 1,
          backgroundColor: "#FFFFFF",
          height: 62,
          paddingTop: 4,
          paddingBottom: 6,
        },
        tabBarItemStyle: {
          marginTop: -2,
        },
        tabBarIconStyle: {
          marginTop: -4,
        },
        tabBarLabelStyle: {
          fontFamily: "DMSans_500Medium",
          fontSize: 10,
          marginTop: 0,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: "Hoy",
          tabBarIcon: ({ focused }) => <TabGlyph type="today" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="week"
        options={{
          title: "Semana",
          tabBarIcon: ({ focused }) => <TabGlyph type="week" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tareas",
          tabBarIcon: ({ focused }) => <TabGlyph type="tasks" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused }) => <TabGlyph type="settings" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
