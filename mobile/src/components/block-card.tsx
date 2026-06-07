import { Pressable, Text, View } from "react-native";

import { TOKENS, blockState, fmtDuration, type DemoBlock } from "@/lib/block-demo";

type BlockCardProps = {
  block: DemoBlock;
  onPress: (block: DemoBlock) => void;
};

export function BlockCard({ block, onPress }: BlockCardProps) {
  const meta = TOKENS.blocks[block.type];
  const state = blockState(block);
  const total = block.tasks.length;
  const done = block.tasks.filter((task) => task.done).length;

  return (
    <Pressable
      onPress={() => onPress(block)}
      className="mb-2 rounded-[14px] bg-white px-4 py-3"
      style={{
        opacity: state === "past" ? 0.4 : 1,
        shadowColor: "#000",
        shadowOpacity: state === "now" ? 0.06 : 0.02,
        shadowRadius: state === "now" ? 10 : 2,
        shadowOffset: { width: 0, height: state === "now" ? 3 : 1 },
        elevation: state === "now" ? 3 : 1,
      }}>
      <View
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{ backgroundColor: meta.bg }}
      />

      <View className="flex-row items-start justify-between gap-3 pl-2">
        <View className="flex-1 min-w-0">
          <View className="mb-0.5 flex-row items-center gap-2">
            <Text className="font-bodyMedium text-[14px] text-ink" numberOfLines={1}>
              {block.name}
            </Text>
            {state === "now" ? (
              <View className="rounded-full bg-lime-300 px-2 py-0.5">
                <Text className="font-bodyMedium text-[11px] text-ink">AHORA</Text>
              </View>
            ) : null}
          </View>
          <Text className="font-mono text-[11px] text-black/45">
            {block.start}–{block.end} · {fmtDuration(block.start, block.end)}
          </Text>
        </View>

        <View className="items-end gap-1">
          {total > 0 ? (
            <Text className={`font-bodyMedium text-[12px] ${done === total ? "text-black/45" : "text-ink"}`}>
              {done}/{total}
            </Text>
          ) : (
            <Text className="font-body text-[12px] text-black/30">sin tareas</Text>
          )}

          {total > 0 ? (
            <View className="h-[3px] w-9 overflow-hidden rounded-full bg-black/5">
              <View className="h-full rounded-full" style={{ width: `${(done / total) * 100}%`, backgroundColor: meta.bg }} />
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
