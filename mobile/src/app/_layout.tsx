import "../../global.css";

import { DMSans_400Regular, DMSans_500Medium } from "@expo-google-fonts/dm-sans";
import { JetBrainsMono_400Regular } from "@expo-google-fonts/jetbrains-mono";
import { Syne_700Bold } from "@expo-google-fonts/syne";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";

import { OnboardingProvider } from "@/providers/onboarding-provider";
import "@/lib/notifications";

export default function RootLayout() {
  const [loaded] = useFonts({
    Syne_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    JetBrainsMono_400Regular,
  });

  if (!loaded) {
    return null;
  }

  return (
    <OnboardingProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </OnboardingProvider>
  );
}
