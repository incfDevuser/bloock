import { Pressable, View } from "react-native";

type TaskCheckProps = {
  checked: boolean;
  onPress: () => void;
};

export function TaskCheck({ checked, onPress }: TaskCheckProps) {
  return (
    <Pressable onPress={onPress} hitSlop={10} className="items-center justify-center">
      <View
        className={`h-5 w-5 items-center justify-center rounded-full border ${
          checked ? "border-lime-300 bg-lime-300" : "border-black/20 bg-white"
        }`}>
        {checked ? <View className="h-1.5 w-1.5 rounded-full bg-ink" /> : null}
      </View>
    </Pressable>
  );
}
