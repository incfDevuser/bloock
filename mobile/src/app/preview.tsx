import { Pressable, ScrollView, Text, View } from "react-native";

import { router } from "expo-router";

const sampleBlocks = [
  { label: "Desayuno", time: "08:00", duration: "30 min", color: "bg-emerald-400" },
  { label: "Trabajo", time: "09:00", duration: "2 h", color: "bg-blue-500" },
  { label: "Gym", time: "18:00", duration: "1 h", color: "bg-violet-400" },
];

export default function PreviewScreen() {
  return (
    <View className="flex-1 px-5 pb-6 pt-14">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-8">
        <Text className="font-display text-[40px] leading-[0.95] tracking-[-0.05em] text-ink">
          Así se ve un día armado.
        </Text>
        <Text className="mt-4 max-w-[320px] font-body text-[16px] leading-7 text-black/60">
          Primero entendemos tu rutina. Después Block te deja crear bloques custom encima.
        </Text>

        <View className="mt-8 rounded-[30px] border border-black/10 bg-white/90 p-4 shadow-sm shadow-black/5">
          {sampleBlocks.map((block, index) => (
            <View
              key={block.label}
              className={`flex-row items-center rounded-2xl px-4 py-4 ${index > 0 ? "mt-3" : ""}`}>
              <View className={`mr-3 h-3 w-3 rounded-full ${block.color}`} />
              <View className="flex-1">
                <Text className="font-bodyMedium text-[16px] text-ink">{block.label}</Text>
                <Text className="mt-1 font-mono text-[12px] text-black/45">
                  {block.time} · {block.duration}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View className="gap-3 pb-2">
        <Pressable
          onPress={() => router.push("/onboarding/name")}
          className="items-center rounded-full bg-lime-300 px-6 py-4 shadow-sm shadow-lime-300/30">
          <Text className="font-bodyMedium text-[16px] text-ink">Ahora sí, armemos el mío</Text>
        </Pressable>
        <Pressable onPress={() => router.replace("/")} className="items-center py-2">
          <Text className="font-body text-[14px] text-black/55">Volver</Text>
        </Pressable>
      </View>
    </View>
  );
}
