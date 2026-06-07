import { View } from "react-native";

import type { TaskPriority } from "@/lib/block-demo";

const colors: Record<TaskPriority, string> = {
  high: "bg-red-500",
  med: "bg-amber-400",
  low: "bg-emerald-400",
};

export function PriorityDot({ priority }: { priority: TaskPriority }) {
  return <View className={`h-1.5 w-1.5 rounded-full ${colors[priority]}`} />;
}
