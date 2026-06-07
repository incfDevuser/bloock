import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useEffect, useMemo, useState } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useOnboarding } from "@/providers/onboarding-provider";
import {
  cancelBlockNotifications,
  requestBlockNotificationsPermission,
  syncBlockNotifications,
} from "@/lib/notifications";
import { supabase } from "../../../utils/supabase";

type UserRow = {
  name: string | null;
  email: string;
  notifications_enabled: boolean;
};

type DayConfigRow = {
  id: string;
  name: string;
  wake_time: string;
  end_time: string;
  applies_to: string[];
  is_default: boolean;
};

type BlockRow = {
  id: string;
  name: string;
  start_time: string;
  repeat_rule: string | null;
  applies_to: string[] | null;
  is_fixed: boolean;
};

type TaskRow = {
  id: string;
  completed: boolean;
};

type DayCode = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

const DAY_OPTIONS: { code: DayCode; label: string }[] = [
  { code: "mon", label: "Lun" },
  { code: "tue", label: "Mar" },
  { code: "wed", label: "Mié" },
  { code: "thu", label: "Jue" },
  { code: "fri", label: "Vie" },
  { code: "sat", label: "Sáb" },
  { code: "sun", label: "Dom" },
];

const SOFT_BORDER = "#E0E0E0";
const SOFT_SURFACE = "#F0F0F0";

export default function SettingsScreen() {
  const { draft, resetOnboarding } = useOnboarding();
  const insets = useSafeAreaInsets();
  const [userId, setUserId] = useState<string | null>(null);
  const [userRow, setUserRow] = useState<UserRow | null>(null);
  const [dayConfigs, setDayConfigs] = useState<DayConfigRow[]>([]);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [editorVisible, setEditorVisible] = useState(false);
  const [notificationPromptVisible, setNotificationPromptVisible] =
    useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [draftConfig, setDraftConfig] = useState<DayConfigRow | null>(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const nextUserId = sessionData.session?.user.id;

      if (!nextUserId) {
        if (!alive) return;
        setUserId(null);
        setUserRow(null);
        setDayConfigs([]);
        setBlocks([]);
        setTasks([]);
        setNotificationsEnabled(false);
        void cancelBlockNotifications();
        return;
      }

      setUserId(nextUserId);

      const [
        { data: profile },
        { data: configs },
        { data: blockRows },
        { data: taskRows },
      ] = await Promise.all([
        supabase
          .from("users")
          .select("name,email,notifications_enabled")
          .eq("id", nextUserId)
          .maybeSingle(),
        supabase
          .from("day_configs")
          .select("id,name,wake_time,end_time,applies_to,is_default")
          .eq("user_id", nextUserId),
        supabase
          .from("blocks")
          .select("id,name,start_time,repeat_rule,applies_to,is_fixed")
          .eq("user_id", nextUserId)
          .eq("is_active", true),
        supabase.from("tasks").select("id,completed").eq("user_id", nextUserId),
      ]);

      if (!alive) return;

      setUserRow(profile ?? null);
      setDayConfigs((configs ?? []) as DayConfigRow[]);
      setBlocks((blockRows ?? []) as BlockRow[]);
      setTasks((taskRows ?? []) as TaskRow[]);
      setNotificationsEnabled(Boolean(profile?.notifications_enabled));

      if (profile?.notifications_enabled) {
        void syncBlockNotifications((blockRows ?? []) as BlockRow[]).catch((error) => {
          console.error(error);
        });
      } else {
        void cancelBlockNotifications().catch((error) => {
          console.error(error);
        });
      }
    };

    void load();

    return () => {
      alive = false;
    };
  }, []);

  const selectedConfig = useMemo(() => pickDayConfig(dayConfigs), [dayConfigs]);
  const orderedConfigs = useMemo(
    () => sortDayConfigs(dayConfigs),
    [dayConfigs],
  );
  const profileName =
    userRow?.name?.trim() || draft.name?.trim() || "Sin nombre";
  const profileEmail = userRow?.email || draft.email || "Sin correo";
  const initials = getInitials(profileName, profileEmail);
  const tasksDone = tasks.filter((task) => task.completed).length;

  const handleSignOut = async () => {
    await cancelBlockNotifications();
    await resetOnboarding();
    await supabase.auth.signOut();
    router.replace("/");
  };

  const promptSignOut = () => {
    Alert.alert(
      "Cerrar sesión",
      "Vas a salir de tu cuenta en este dispositivo.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: () => void handleSignOut(),
        },
      ],
    );
  };

  const persistNotificationsEnabled = async (enabled: boolean) => {
    if (!userId) throw new Error("No active user session");

    const { error } = await supabase
      .from("users")
      .update({ notifications_enabled: enabled })
      .eq("id", userId);

    if (error) {
      throw new Error(error.message);
    }
  };

  const disableNotifications = async () => {
    if (!notificationsEnabled) return;

    setSavingNotifications(true);

    try {
      await cancelBlockNotifications();
      await persistNotificationsEnabled(false);
      setNotificationsEnabled(false);
    } catch (error) {
      console.error(error);

      if (notificationsEnabled) {
        void syncBlockNotifications(blocks).catch((syncError) => {
          console.error(syncError);
        });
      }

      Alert.alert(
        "No pudimos desactivar las notificaciones",
        "Probá de nuevo en un momento.",
      );
    } finally {
      setSavingNotifications(false);
    }
  };

  const promptNotifications = async () => {
    if (notificationsEnabled) {
      void disableNotifications();
      return;
    }

    setNotificationPromptVisible(true);
  };

  const confirmNotifications = async () => {
    if (savingNotifications) return;

    setSavingNotifications(true);

    try {
      const granted = await requestBlockNotificationsPermission();

      if (!granted) {
        setNotificationPromptVisible(false);
        Alert.alert(
          "Necesito permiso",
          "Activá las notificaciones para poder avisarte antes de cada bloque.",
        );
        return;
      }

      await syncBlockNotifications(blocks);
      await persistNotificationsEnabled(true);
      setNotificationsEnabled(true);
      setNotificationPromptVisible(false);
    } catch (error) {
      console.error(error);
      await cancelBlockNotifications().catch((cancelError) => {
        console.error(cancelError);
      });
      Alert.alert(
        "No pudimos activar las notificaciones",
        "Probá de nuevo en un momento.",
      );
    } finally {
      setSavingNotifications(false);
    }
  };

  const cancelNotificationsPrompt = () => {
    if (savingNotifications) return;
    setNotificationPromptVisible(false);
  };

  const openConfigEditor = (config: DayConfigRow) => {
    setConfigError(null);
    setDraftConfig({
      ...config,
      wake_time: formatTime(config.wake_time),
      end_time: formatTime(config.end_time),
      applies_to: [...config.applies_to],
    });
    setEditorVisible(true);
  };

  const closeConfigEditor = () => {
    if (savingConfig) return;
    setEditorVisible(false);
    setConfigError(null);
    setDraftConfig(null);
  };

  const saveConfig = async () => {
    if (!draftConfig) return;

    if (
      !isValidTime(draftConfig.wake_time) ||
      !isValidTime(draftConfig.end_time)
    ) {
      setConfigError("Escribe ambos horarios como HH:MM, por ejemplo 07:00 y 21:00.");
      return;
    }

    setSavingConfig(true);
    setConfigError(null);

    const wake_time = normalizeTime(draftConfig.wake_time);
    const end_time = normalizeTime(draftConfig.end_time);

    const { error } = await supabase
      .from("day_configs")
      .update({
        wake_time,
        end_time,
      })
      .eq("id", draftConfig.id);

    if (error) {
      setConfigError(error.message);
      setSavingConfig(false);
      return;
    }

    setSavingConfig(false);
    setDayConfigs((current) =>
      current.map((config) => {
        if (config.id !== draftConfig.id) return config;

        return {
          ...config,
          wake_time,
          end_time,
        };
      }),
    );
    setEditorVisible(false);
    setConfigError(null);
    setDraftConfig(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-48 pt-12"
        showsVerticalScrollIndicator={false}
      >
        <View
          className="relative overflow-hidden  px-5 py-6"
          style={{ borderColor: SOFT_BORDER, backgroundColor: "#FFF" }}
        >
          <Pressable
            onPress={promptSignOut}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            className="absolute right-5 top-5 z-10 h-11 w-11 items-center justify-center rounded-full bg-white active:opacity-80"
            style={{ borderWidth: 1, borderColor: "#F2D5D8" }}
          >
            <Ionicons name="log-out-outline" size={20} color="#E11D48" />
          </Pressable>

          <View className="items-center">
            <View className="mt-5 rounded-full bg-white p-1 shadow-sm shadow-black/10">
              <View className="h-[108px] w-[108px] items-center justify-center rounded-full bg-lime-300">
                <Text className="font-display text-[38px] leading-none tracking-[-0.05em] text-ink">
                  {initials}
                </Text>
              </View>
            </View>
            <Text className="mt-5 text-center font-bodyMedium text-[22px] text-ink">
              {profileName}
            </Text>
            <Text className="mt-1 text-center font-body text-[14px] text-black/55">
              {profileEmail}
            </Text>
            <Text className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-black/35">
              {selectedConfig
                ? `${formatTime(selectedConfig.wake_time)} - ${formatTime(selectedConfig.end_time)}`
                : "Tu horario base"}
            </Text>
            <Text className="mt-4 max-w-[260px] text-center font-body text-[14px] leading-6 text-black/50">
              Block te ayuda a ver tu día claro, sin pelearte con la agenda.
            </Text>
            <View className="mt-4 flex-row flex-wrap justify-center gap-2">
              <Pill label={`${blocks.length} bloques`} tone="lime" />
              <Pill
                label={`${tasksDone}/${tasks.length || 0} tareas`}
                tone="dark"
              />
            </View>
          </View>
        </View>

        <View className="mt-4 gap-3 px-5">
          <View className="flex-row items-end justify-between">
            <View>
              <Text className="font-bodyMedium text-[18px] text-ink">
                Horario de tu semana
              </Text>
              <Text className="mt-1 font-body text-[13px] leading-5 text-black/45">
                Acá defines a qué hora arrancas y cierras tu día.
              </Text>
            </View>
          </View>

          <View className="gap-3">
            {orderedConfigs.map((config) => (
              <Pressable
                key={config.id}
                onPress={() => openConfigEditor(config)}
                accessibilityRole="button"
                accessibilityLabel={`Editar ${config.name}`}
                className="rounded-[28px] border bg-white px-4 py-4 shadow-sm shadow-black/5 active:opacity-85"
                style={{ borderColor: SOFT_BORDER }}
              >
                <View className="flex-row items-start gap-3">
                  <View className="mt-1 h-12 w-1 rounded-full bg-lime-300" />

                  <View className="flex-1">
                    <View className="flex-row flex-wrap items-center gap-2">
                      <Text className="font-bodyMedium text-[16px] text-ink">
                        {config.name}
                      </Text>
                    </View>
                    <View className="mt-2 flex-row flex-wrap gap-2">
                      <Pill
                        label={`Arrancas ${formatTime(config.wake_time)}`}
                        tone="soft"
                      />
                      <Pill
                        label={`Cierras ${formatTime(config.end_time)}`}
                        tone="soft"
                      />
                    </View>
                    <View className="mt-3 flex-row flex-wrap gap-2">
                      {config.applies_to.length ? (
                        config.applies_to.map((day) => (
                          <Badge
                            key={day}
                            label={getDayLabel(day)}
                            tone="soft"
                          />
                        ))
                      ) : (
                        <Badge label="Sin días" tone="soft" />
                      )}
                    </View>
                  </View>
                  <View className="mt-1 rounded-full bg-[#F0F0F0] p-2">
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#111111"
                    />
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="mt-4 gap-3 px-5">
          <Text className="font-bodyMedium text-[18px] text-ink">
            Notificaciones
          </Text>

            <Pressable
              onPress={promptNotifications}
              accessibilityRole="button"
              accessibilityLabel={
                notificationsEnabled
                ? "Desactivar notificaciones"
                : "Activar notificaciones"
            }
              className="rounded-[28px] border bg-white px-4 py-4 shadow-sm shadow-black/5 active:opacity-85"
              style={{ borderColor: SOFT_BORDER }}
            >
              <View className="flex-row items-center gap-3">
                <View className="flex-1">
                  <Text className="font-bodyMedium text-[16px] text-ink">
                    {notificationsEnabled
                      ? "Notificaciones activas"
                      : "Notificaciones apagadas"}
                </Text>
                <Text className="mt-1 font-body text-[13px] leading-5 text-black/45">
                  Te aviso 10 minutos antes de que arranque un bloque.
                </Text>
              </View>

              <View
                className={`rounded-full px-3 py-2 ${notificationsEnabled ? "bg-[#0F0F0F]" : "bg-lime-300"} ${savingNotifications ? "opacity-70" : ""}`}
              >
                <Text
                  className={`font-bodyMedium text-[12px] ${notificationsEnabled ? "text-white" : "text-ink"}`}
                >
                  {savingNotifications
                    ? "Procesando..."
                    : notificationsEnabled
                      ? "Desactivar"
                      : "Activar"}
                </Text>
              </View>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        transparent
        statusBarTranslucent
        visible={notificationPromptVisible}
        animationType="fade"
        onRequestClose={cancelNotificationsPrompt}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View className="flex-1 bg-black/55">
            <Pressable className="absolute inset-0" onPress={cancelNotificationsPrompt} />

            <View className="mt-auto overflow-hidden rounded-t-[24px] bg-white pt-3" style={{ maxHeight: "86%", paddingBottom: 12 + insets.bottom }}>
              <View className="items-center pb-3">
                <View className="h-1 w-10 rounded-full bg-[#D9D9D9]" />
              </View>

              <View className="flex-row items-start justify-between gap-3 px-5 pb-4">
                <View className="flex-1">
                  <Text className="font-display text-[24px] leading-none tracking-[-0.04em] text-ink">
                    Activar notificaciones
                  </Text>
                  <Text className="mt-2 font-body text-[13px] leading-5 text-black/45">
                    Te voy a avisar 10 minutos antes de que empiece un bloque.
                  </Text>
                </View>

                <Pressable
                  onPress={cancelNotificationsPrompt}
                  className="h-10 w-10 items-center justify-center rounded-full bg-[#F0F0F0] active:opacity-80"
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar modal"
                  disabled={savingNotifications}
                >
                  <Ionicons name="close" size={20} color="#111111" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerClassName="px-5 pb-8">
                <View className="gap-4">
                  <View className="rounded-[24px] border bg-[#F8F8F8] px-4 py-4" style={{ borderColor: SOFT_BORDER }}>
                    <View className="flex-row items-start gap-3">
                      <View className="mt-0.5 rounded-full bg-lime-300 p-2">
                        <Ionicons name="time-outline" size={18} color="#111111" />
                      </View>
                      <Text className="flex-1 font-body text-[14px] leading-6 text-ink">
                        Si tienes un bloque a las 10:00, te aviso a las 9:50.
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-3 pt-1">
                    <Pressable
                      onPress={cancelNotificationsPrompt}
                      disabled={savingNotifications}
                      className="flex-1 items-center rounded-full bg-white px-4 py-4 active:opacity-80"
                      style={{ borderWidth: 1, borderColor: SOFT_BORDER }}
                    >
                      <Text className="font-bodyMedium text-[15px] text-ink">Ahora no</Text>
                    </Pressable>

                    <Pressable
                      onPress={confirmNotifications}
                      disabled={savingNotifications}
                      className="flex-1 items-center rounded-full bg-lime-300 px-4 py-4 active:opacity-85"
                    >
                      <Text className="font-bodyMedium text-[15px] text-ink">
                        {savingNotifications ? "Activando..." : "Activar"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        transparent
        statusBarTranslucent
        visible={editorVisible}
        animationType="fade"
        onRequestClose={closeConfigEditor}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View className="flex-1 bg-black/55">
            <Pressable className="absolute inset-0" onPress={closeConfigEditor} />

            <View
              className="mt-auto overflow-hidden rounded-t-[24px] bg-white pt-3"
              style={{ maxHeight: "86%", paddingBottom: 12 + insets.bottom }}
            >
              <View className="items-center pb-3">
                <View className="h-1 w-10 rounded-full bg-[#D9D9D9]" />
              </View>

              <View className="flex-row items-start justify-between gap-3 px-5 pb-4">
                <View className="flex-1">
                  <Text className="font-display text-[24px] leading-none tracking-[-0.04em] text-ink">
                    Ajustar horario
                  </Text>
                  <Text className="mt-2 font-body text-[13px] leading-5 text-black/45">
                    Cambia solo las horas de esta rutina.
                  </Text>
                </View>

                <Pressable
                  onPress={closeConfigEditor}
                  className="h-10 w-10 items-center justify-center rounded-full bg-[#F0F0F0] active:opacity-80"
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar editor"
                >
                  <Ionicons name="close" size={20} color="#111111" />
                </Pressable>
              </View>

              {draftConfig ? (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerClassName="px-5 pb-8"
                >
                  <View className="gap-4">
                    <View className="flex-row gap-3">
                      <View className="flex-1 gap-2">
                        <Text className="font-bodyMedium text-[13px] text-ink">
                          Inicio
                        </Text>
                        <TextInput
                          value={draftConfig.wake_time}
                          onChangeText={(value) =>
                            setDraftConfig((current) =>
                              current
                                ? { ...current, wake_time: value }
                                : current,
                            )
                          }
                          className="rounded-2xl px-4 py-3 font-mono text-[16px] text-ink"
                          style={{
                            borderWidth: 1,
                            borderColor: SOFT_BORDER,
                            backgroundColor: SOFT_SURFACE,
                          }}
                          placeholder="07:00"
                          placeholderTextColor="#8a8a8a"
                          keyboardType="numbers-and-punctuation"
                        />
                      </View>

                      <View className="flex-1 gap-2">
                        <Text className="font-bodyMedium text-[13px] text-ink">
                          Fin
                        </Text>
                        <TextInput
                          value={draftConfig.end_time}
                          onChangeText={(value) =>
                            setDraftConfig((current) =>
                              current ? { ...current, end_time: value } : current,
                            )
                          }
                          className="rounded-2xl px-4 py-3 font-mono text-[16px] text-ink"
                          style={{
                            borderWidth: 1,
                            borderColor: SOFT_BORDER,
                            backgroundColor: SOFT_SURFACE,
                          }}
                          placeholder="21:00"
                          placeholderTextColor="#8a8a8a"
                          keyboardType="numbers-and-punctuation"
                        />
                      </View>
                    </View>

                    {configError ? (
                      <Text className="font-body text-[13px] text-red-600">
                        {configError}
                      </Text>
                    ) : null}

                    <View className="flex-row gap-3 pt-1">
                      <Pressable
                        onPress={closeConfigEditor}
                        disabled={savingConfig}
                        className="flex-1 items-center rounded-full bg-white px-4 py-4 active:opacity-80"
                        style={{ borderWidth: 1, borderColor: SOFT_BORDER }}
                      >
                        <Text className="font-bodyMedium text-[15px] text-ink">
                          Cancelar
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => void saveConfig()}
                        disabled={savingConfig}
                        className={`flex-1 items-center rounded-full bg-lime-300 px-4 py-4 ${savingConfig ? "opacity-70" : "active:opacity-85"}`}
                      >
                        <Text className="font-bodyMedium text-[15px] text-ink">
                          {savingConfig ? "Guardando..." : "Guardar"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </ScrollView>
              ) : null}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function Pill({
  label,
  tone,
}: {
  label: string;
  tone: "lime" | "dark" | "soft";
}) {
  const styles =
    tone === "lime"
      ? "bg-lime-300 border-lime-300/60 text-ink"
      : tone === "dark"
        ? "bg-[#0F0F0F] text-white"
        : "bg-white border-[#E0E0E0] text-ink";

  return (
    <View className={`rounded-full border px-3 py-2 ${styles}`}>
      <Text
        className={`font-bodyMedium text-[12px] ${tone === "dark" ? "text-white" : "text-ink"}`}
      >
        {label}
      </Text>
    </View>
  );
}

function Badge({ label, tone }: { label: string; tone: "dark" | "soft" }) {
  return (
    <View
      className={`rounded-full border px-3 py-1.5 ${tone === "dark" ? "bg-[#0F0F0F]" : "bg-white"}`}
      style={{ borderColor: tone === "dark" ? "#0F0F0F" : SOFT_BORDER }}
    >
      <Text
        className={`font-bodyMedium text-[11px] ${tone === "dark" ? "text-white" : "text-ink"}`}
      >
        {label}
      </Text>
    </View>
  );
}

function pickDayConfig(dayConfigs: DayConfigRow[]) {
  return (
    dayConfigs.find((config) => config.is_default) ?? dayConfigs[0] ?? null
  );
}

function sortDayConfigs(dayConfigs: DayConfigRow[]) {
  return [...dayConfigs].sort((left, right) => {
    if (left.is_default && !right.is_default) return -1;
    if (!left.is_default && right.is_default) return 1;
    return left.name.localeCompare(right.name, "es");
  });
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

function normalizeTime(value: string) {
  const [hours = "", minutes = ""] = value.trim().split(":");
  return `${String(Number(hours)).padStart(2, "0")}:${String(Number(minutes)).padStart(2, "0")}`;
}

function getDayLabel(code: string) {
  return DAY_OPTIONS.find((day) => day.code === code)?.label ?? code;
}

function isValidTime(value: string) {
  return /^([01]?\d|2[0-3]):[0-5]\d$/.test(value.trim());
}

function getInitials(name: string, email: string) {
  const fromName = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  if (fromName) return fromName;

  return email.slice(0, 2).toUpperCase() || "B";
}
