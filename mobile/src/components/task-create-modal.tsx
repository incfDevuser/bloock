import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/primary-button";
import { TOKENS } from "@/lib/block-demo";
import type { TaskPriority } from "@/lib/task-service";

type TaskCreateModalProps = {
  visible: boolean;
  blockName: string;
  onClose: () => void;
  onSubmit: (input: { title: string; priority: TaskPriority }) => Promise<void> | void;
};

const priorities: { key: TaskPriority; label: string }[] = [
  { key: "low", label: "Baja" },
  { key: "medium", label: "Media" },
  { key: "high", label: "Alta" },
];

export function TaskCreateModal({ visible, blockName, onClose, onSubmit }: TaskCreateModalProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [saving, setSaving] = useState(false);
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const submit = async () => {
    const value = title.trim();
    if (!value || saving) return;

    setSaving(true);
    try {
      await onSubmit({ title: value, priority });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal transparent statusBarTranslucent visible animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }}>
          <Pressable style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} onPress={onClose} />

          <View
            style={{
              marginTop: "auto",
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 12,
              paddingBottom: 16 + insets.bottom,
              maxHeight: "86%",
            }}>
            <View style={{ alignItems: "center", paddingBottom: 12 }}>
              <View style={{ width: 40, height: 4, borderRadius: 9999, backgroundColor: TOKENS.border }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 + insets.bottom }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ fontFamily: "Syne_700Bold", fontSize: 24, letterSpacing: -0.8, color: TOKENS.text }}>Nueva tarea</Text>
                  <Text style={{ marginTop: 4, fontFamily: "DMSans_400Regular", fontSize: 13, color: "rgba(15,15,15,0.45)" }}>{blockName}</Text>
                </View>
                <Pressable onPress={onClose} hitSlop={10}>
                  <Text style={{ fontFamily: "DMSans_500Medium", fontSize: 14, color: "rgba(15,15,15,0.45)" }}>Cerrar</Text>
                </Pressable>
              </View>

              <View style={{ marginTop: 16 }}>
                <Text style={{ fontFamily: "DMSans_500Medium", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8, color: "rgba(15,15,15,0.4)" }}>Título</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Ej. Responder mails"
                  placeholderTextColor="#9A9A9A"
                  style={{
                    marginTop: 8,
                    borderRadius: 14,
                    backgroundColor: "rgba(15,15,15,0.04)",
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    fontFamily: "DMSans_400Regular",
                    fontSize: 16,
                    color: TOKENS.text,
                  }}
                />

                <Text style={{ marginTop: 20, fontFamily: "DMSans_500Medium", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8, color: "rgba(15,15,15,0.4)" }}>Prioridad</Text>
                <View style={{ marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {priorities.map((item) => {
                    const active = priority === item.key;
                    return (
                      <Pressable
                        key={item.key}
                        onPress={() => setPriority(item.key)}
                        style={{
                          borderRadius: 9999,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          backgroundColor: active ? "rgba(15,15,15,0.08)" : "#F3F3F3",
                          borderWidth: 1,
                          borderColor: active ? TOKENS.text : "#E6E6E6",
                        }}>
                        <Text style={{ fontFamily: "DMSans_500Medium", fontSize: 13, color: active ? TOKENS.text : TOKENS.textSecondary }}>
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={{ marginTop: 28, alignItems: "center" }}>
                  <PrimaryButton label={saving ? "Creando..." : "Crear tarea"} onPress={submit} disabled={!title.trim() || saving} fullWidth />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
