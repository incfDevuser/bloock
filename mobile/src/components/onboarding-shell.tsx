import { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type OnboardingShellProps = {
  eyebrow: string;
  title: string;
  helper: string;
  progress: number;
  onBack?: () => void;
  footer?: ReactNode;
  children: ReactNode;
};

export function OnboardingShell({
  eyebrow,
  title,
  helper,
  progress,
  onBack,
  footer,
  children,
}: OnboardingShellProps) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View className="flex-1">
        <View className="absolute -top-20 -right-16 h-72 w-72 rounded-full bg-lime-200/80" />
        <View className="absolute left-[-90px] top-40 h-56 w-56 rounded-full bg-sky-200/60" />
        <View className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-amber-100/70" />

        <View className="flex-1 px-5 pb-5 pt-14">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <View className="mb-3 flex-row items-center gap-2">
                <View className="h-2 w-2 rounded-full bg-lime-300" />
                <Text className="font-mono text-[11px] uppercase tracking-[0.28em] text-black/45">
                  {eyebrow}
                </Text>
              </View>
              <View className="h-1.5 overflow-hidden rounded-full bg-black/10">
                <View className="h-full rounded-full bg-lime-300" style={{ width: `${progress}%` }} />
              </View>
            </View>

            {onBack ? (
              <Pressable
                onPress={onBack}
                className="ml-4 h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/80">
                <Text className="text-lg text-black">←</Text>
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            className="mt-10 flex-1"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="pb-8">
            <View className="max-w-[380px]">
              <Text className="font-display text-[42px] leading-[0.95] tracking-[-0.04em] text-ink">
                {title}
              </Text>
              <Text className="mt-4 max-w-[320px] font-body text-[16px] leading-6 text-black/60">
                {helper}
              </Text>
            </View>

            <View className="mt-10 rounded-[30px] border border-black/10 bg-white/90 px-4 py-5 shadow-sm shadow-black/5">
              {children}
            </View>
          </ScrollView>

          {footer ? (
            <View style={{ paddingBottom: Math.max(insets.bottom, 12) }} className="pt-4">
              {footer}
            </View>
          ) : null}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
