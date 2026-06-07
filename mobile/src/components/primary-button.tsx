import { Pressable, Text } from "react-native";

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
};

export function PrimaryButton({ label, onPress, disabled, fullWidth }: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        alignItems: "center",
        alignSelf: fullWidth ? "stretch" : "center",
        borderRadius: 9999,
        backgroundColor: "#D8FF2E",
        borderWidth: 1,
        borderColor: "rgba(15,15,15,0.08)",
        paddingHorizontal: 20,
        paddingVertical: 16,
        width: fullWidth ? "100%" : undefined,
        shadowColor: "#C8F135",
        shadowOpacity: 0.45,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
        opacity: disabled ? 0.7 : 1,
        transform: [{ scale: disabled || !pressed ? 1 : 0.985 }],
      })}>
      <Text style={{ fontFamily: "DMSans_500Medium", fontSize: 16, color: "#0F0F0F" }}>{label}</Text>
    </Pressable>
  );
}
