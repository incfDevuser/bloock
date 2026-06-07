import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";

import { router } from "expo-router";

import { useOnboarding } from "@/providers/onboarding-provider";

export default function WelcomeScreen() {
  const { hydrated, completed } = useOnboarding();

  useEffect(() => {
    if (hydrated && completed) {
      router.replace("/home");
    }
  }, [completed, hydrated]);

  if (!hydrated) {
    return <View className="flex-1" />;
  }

  return (
    <View className="flex-1 px-5 pb-6 pt-14">
      <View className="absolute -right-16 top-10 h-64 w-64 rounded-full bg-lime-200/80" />
      <View className="absolute left-[-80px] top-40 h-52 w-52 rounded-full bg-sky-200/55" />

      <View className="flex-1 justify-between">
        <View className="pt-4">
          <View className="mb-8 flex-row gap-1.5">
            <View className="h-4 w-4 rounded-full bg-lime-300" />
            <View className="mt-2 h-3 w-10 rounded-full bg-blue-500" />
            <View className="mt-2 h-3 w-7 rounded-full bg-emerald-400" />
            <View className="mt-2 h-3 w-14 rounded-full bg-lime-300" />
          </View>

          <Text className="max-w-[280px] font-display text-[54px] leading-[0.93] tracking-[-0.06em] text-ink">
            Hola. Soy Block.
          </Text>

          <Text className="mt-5 max-w-[280px] font-body text-[17px] leading-7 text-black/60">
            Te ayudo a armar tu día en bloques. Cuentame cómo es y yo me encargo.
          </Text>
        </View>

        <View className="pb-2">
          <Pressable
            onPress={() => router.push("/onboarding/name")}
            className="items-center rounded-full bg-lime-300 px-6 py-4 shadow-sm shadow-lime-300/30 active:scale-[0.99]"
          >
            <Text className="font-bodyMedium text-[16px] text-ink">
              Armemos tu día
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
