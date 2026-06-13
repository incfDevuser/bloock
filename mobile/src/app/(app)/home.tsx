import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";

import { BlockSheet } from "@/components/block-sheet";
import { PrimaryButton } from "@/components/primary-button";
import { NOW_MIN, TOKENS, blockState, type DemoBlock } from "@/lib/block-demo";
import { createTask } from "@/lib/task-service";
import { supabase } from "../../../utils/supabase";

const HOUR_PX = 60;
const GUTTER_PX = 52;

const T = {
  bg: TOKENS.bg,
  surface: TOKENS.surface,
  border: TOKENS.border,
  primary: TOKENS.primary,
  text: TOKENS.text,
  textSecondary: TOKENS.textSecondary,
  textDisabled: TOKENS.textDisabled,
};

type DayConfigRow = {
  id: string;
  name: string;
  wake_time: string;
  end_time: string;
  applies_to: string[];
  is_default: boolean;
};

type BlockTask = {
  id: string;
  text: string;
  priority: "high" | "med" | "low";
  done: boolean;
};

type LiveBlock = DemoBlock & {
  dbId: string;
};

type DemoBlockType = keyof typeof TOKENS.blocks;
type RepeatRule = "daily" | "weekdays" | "custom";
type DayCode = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

type CreateBlockDraft = {
  name: string;
  type: DemoBlockType;
  startMin: number;
  durationMinutes: number;
  repeatRule: RepeatRule;
  selectedDays: DayCode[];
};

type FreeSlot = {
  startMin: number;
  endMin: number;
};

const BLOCK_TYPES: DemoBlockType[] = ["trabajo", "deporte", "comida", "emprendimiento", "estudios", "universidad", "fijo", "otro"];
const DAY_OPTIONS: { code: DayCode; label: string }[] = [
  { code: "mon", label: "L" },
  { code: "tue", label: "M" },
  { code: "wed", label: "X" },
  { code: "thu", label: "J" },
  { code: "fri", label: "V" },
  { code: "sat", label: "S" },
  { code: "sun", label: "D" },
];

const DAY_CODES: DayCode[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function BlockCard({
  block,
  onOpen,
  timelineStartMin,
}: {
  block: DemoBlock;
  onOpen: (block: DemoBlock) => void;
  timelineStartMin: number;
}) {
  const meta = TOKENS.blocks[block.type];
  const color = meta.bg;
  const state = blockState(block);
  const total = block.tasks.length;
  const done = block.tasks.filter((task) => task.done).length;

  const startMin = timeToMin(block.start);
  const endMin = timeToMin(block.end);
  const top = ((startMin - timelineStartMin) / 60) * HOUR_PX + 8;
  const height = ((endMin - startMin) / 60) * HOUR_PX;

  const isShort = height < 44;
  const isTiny = height < 28;

  return (
    <Pressable
      onPress={() => onOpen(block)}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top,
        height,
        backgroundColor: tint(color, state === "now" ? 0.38 : 0.28),
        borderWidth: 1,
        borderColor: tint(color, 0.28),
        borderLeftWidth: 4,
        borderLeftColor: color,
        borderRadius: 8,
        paddingHorizontal: isTiny ? 8 : 10,
        paddingVertical: isTiny ? 2 : 6,
        opacity: state === "past" ? 0.68 : 1,
        overflow: "hidden",
        shadowColor: state === "now" ? color : "#000",
        shadowOpacity: state === "now" ? 0.34 : 0,
        shadowRadius: state === "now" ? 14 : 0,
        shadowOffset: { width: 0, height: 4 },
        elevation: state === "now" ? 5 : 0,
        display: "flex",
        flexDirection: isShort ? "row" : "column",
        alignItems: isShort ? "center" : "stretch",
        justifyContent: isShort ? "space-between" : "flex-start",
        gap: isShort ? 8 : 2,
      }}>
      {isShort ? (
        <>
          <Text
            numberOfLines={1}
            className="flex-1 font-bodyMedium text-[12px]"
            style={{ minWidth: 0, color: T.text }}>
            {block.name}
          </Text>
          <Text className="font-mono text-[10px]" style={{ color: T.textSecondary }}>
            {block.start}
          </Text>
        </>
      ) : (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text
              numberOfLines={1}
              className="flex-1 font-bodyMedium text-[13px]"
              style={{ minWidth: 0, lineHeight: 15, color: T.text }}>
              {block.name}
            </Text>
            {state === "now" ? (
              <View style={{ backgroundColor: T.primary, borderRadius: 9999, paddingHorizontal: 6, paddingVertical: 1 }}>
                <Text className="font-bodyMedium text-[9px]" style={{ letterSpacing: 0.4, color: "#0F0F0F" }}>
                  AHORA
                </Text>
              </View>
            ) : null}
          </View>

          <Text className="font-mono text-[11px]" style={{ lineHeight: 14, color: T.textSecondary }}>
            {block.start}–{block.end}
          </Text>

          {height >= 80 && total > 0 ? (
            <View style={{ marginTop: "auto", flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: tint(color, 0.28), overflow: "hidden" }}>
                <View style={{ width: `${(done / total) * 100}%`, height: "100%", backgroundColor: color, borderRadius: 2 }} />
              </View>
              <Text className="font-bodyMedium text-[11px]" style={{ color: T.textSecondary }}>
                {done}/{total}
              </Text>
            </View>
          ) : null}
        </>
      )}
    </Pressable>
  );
}

export default function HomeScreen() {
  const scrollRef = useRef<ScrollView | null>(null);
  const insets = useSafeAreaInsets();

  const [blocks, setBlocks] = useState<LiveBlock[]>([]);
  const [dayConfig, setDayConfig] = useState<DayConfigRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [createDraft, setCreateDraft] = useState<CreateBlockDraft | null>(null);

  const totalTasks = useMemo(() => blocks.reduce((sum, block) => sum + block.tasks.length, 0), [blocks]);
  const doneTasks = useMemo(
    () => blocks.reduce((sum, block) => sum + block.tasks.filter((task) => task.done).length, 0),
    [blocks],
  );
  const dayStartMin = useMemo(() => timeToMin(dayConfig?.wake_time ?? "06:00"), [dayConfig]);
  const dayEndMin = useMemo(() => timeToMin(dayConfig?.end_time ?? "23:00"), [dayConfig]);
  const timelineMinutes = useMemo(() => Math.max(60, dayEndMin - dayStartMin), [dayEndMin, dayStartMin]);
  const freeSlots = useMemo(() => computeFreeSlots(sortBlocksByStart(blocks), dayStartMin, dayEndMin), [blocks, dayStartMin, dayEndMin]);
  const selectedBlock = useMemo(
    () => blocks.find((block) => block.id === selectedBlockId) ?? null,
    [blocks, selectedBlockId],
  );
  const createConflict = useMemo(() => {
    if (!createDraft) return null;

    const startMin = createDraft.startMin;
    const endMin = Math.min(startMin + createDraft.durationMinutes, dayEndMin);

    return sortBlocksByStart(blocks).find((block) => {
      const blockStart = timeToMin(block.start);
      const blockEnd = timeToMin(block.end);
      return startMin < blockEnd && endMin > blockStart;
    }) ?? null;
  }, [blocks, createDraft, dayEndMin]);

  const salutation = getSalutation();

  useFocusEffect(
    useCallback(() => {
      let alive = true;

      const load = async () => {
        setLoading(true);

        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user.id;
        if (alive) setUserId(userId ?? null);

        if (!userId) {
          if (alive) setLoading(false);
          return;
        }

        const [{ data: userRow }, { data: dayConfigs, error: dayConfigError }] = await Promise.all([
          supabase.from("users").select("name,email").eq("id", userId).maybeSingle(),
          supabase
            .from("day_configs")
            .select("id,name,wake_time,end_time,applies_to,is_default")
            .eq("user_id", userId),
        ]);

        if (dayConfigError) console.error(dayConfigError.message);

        const selectedConfig = pickDayConfig(dayConfigs ?? [], getTodayCode());

        if (!selectedConfig) {
          if (alive) {
            setUserName(userRow?.name ?? userRow?.email ?? "");
            setDayConfig(null);
            setBlocks([]);
            setLoading(false);
          }
          return;
        }

        const [{ data: blockRows, error: blocksError }, { data: taskRows, error: tasksError }] = await Promise.all([
          supabase
            .from("blocks")
            .select("id,day_config_id,name,type,start_time,duration_minutes,color,is_fixed,is_active,repeat_rule,applies_to")
            .eq("day_config_id", selectedConfig.id)
            .eq("is_active", true)
            .order("start_time", { ascending: true }),
          supabase
            .from("tasks")
            .select("id,block_id,title,priority,completed,date,order")
            .eq("date", todayIsoDate())
            .eq("user_id", userId)
            .order("order", { ascending: true }),
        ]);

        if (blocksError) console.error(blocksError.message);
        if (tasksError) console.error(tasksError.message);

        const tasksByBlock = new Map<string, BlockTask[]>();
        for (const task of taskRows ?? []) {
          const normalizedPriority = task.priority === "high" ? "high" : task.priority === "medium" ? "med" : "low";
          const current = tasksByBlock.get(task.block_id) ?? [];
          current.push({
            id: task.id,
            text: task.title,
            priority: normalizedPriority,
            done: task.completed,
          });
          tasksByBlock.set(task.block_id, current);
        }

        const todayCode = getTodayCode();
        const nextBlocks: LiveBlock[] = (blockRows ?? [])
          .filter((blockRow) => shouldShowBlock(blockRow.repeat_rule, blockRow.applies_to, todayCode))
          .map((blockRow) => ({
            dbId: blockRow.id,
            id: blockRow.id,
            type: blockRow.type,
            name: blockRow.name,
            start: blockRow.start_time,
            end: addMinutes(blockRow.start_time, blockRow.duration_minutes),
            tasks: tasksByBlock.get(blockRow.id) ?? [],
          }));

        if (!alive) return;

        setUserName(userRow?.name ?? userRow?.email ?? "");
        setDayConfig(selectedConfig);
        setBlocks(nextBlocks);
        setLoading(false);
      };

      void load();

      return () => {
        alive = false;
      };
    }, []),
  );

  useEffect(() => {
    if (!scrollRef.current) return;
    const nowY = ((NOW_MIN - dayStartMin) / 60) * HOUR_PX;
    scrollRef.current.scrollTo({ y: Math.max(0, nowY - 140), animated: false });
  }, [loading, dayStartMin]);

  const openBlock = (block: DemoBlock) => setSelectedBlockId(block.id);

  const openCreateBlock = (startMin: number) => {
    const snapped = clamp(roundToQuarterHour(startMin), dayStartMin, Math.max(dayStartMin, dayEndMin - 60));
    setCreateDraft({
      name: "",
      type: "otro",
      startMin: snapped,
      durationMinutes: 60,
      repeatRule: "custom",
      selectedDays: [getTodayCode() as DayCode],
    });
  };

  const handleTimelinePress = (event: { nativeEvent: { locationX: number; locationY: number } }) => {
    if (event.nativeEvent.locationX < GUTTER_PX) return;
    const rawMin = dayStartMin + Math.round(((event.nativeEvent.locationY - 8) / HOUR_PX) * 60);
    openCreateBlock(rawMin);
  };

  const updateCreateDraft = (patch: Partial<CreateBlockDraft>) => {
    setCreateDraft((current) => {
      if (!current) return current;
      const next = { ...current, ...patch };

      if (Object.prototype.hasOwnProperty.call(patch, "durationMinutes") && !Object.prototype.hasOwnProperty.call(patch, "startMin")) {
        next.durationMinutes = clamp(next.durationMinutes, 15, Math.max(15, dayEndMin - next.startMin));
      }

      if (Object.prototype.hasOwnProperty.call(patch, "startMin") && !Object.prototype.hasOwnProperty.call(patch, "durationMinutes")) {
        next.startMin = clamp(next.startMin, dayStartMin, Math.max(dayStartMin, dayEndMin - next.durationMinutes));
      }

      return next;
    });
  };

  const shiftCreateStart = (delta: number) => {
    if (!createDraft) return;
    updateCreateDraft({ startMin: createDraft.startMin + delta });
  };

  const shiftCreateDuration = (delta: number) => {
    if (!createDraft) return;
    updateCreateDraft({ durationMinutes: clamp(createDraft.durationMinutes + delta, 15, Math.max(15, dayEndMin - createDraft.startMin)) });
  };

  const toggleCreateDay = (day: DayCode) => {
    if (!createDraft) return;

    updateCreateDraft({
      repeatRule: "custom",
      selectedDays: createDraft.selectedDays.includes(day)
        ? createDraft.selectedDays.filter((code) => code !== day)
        : [...createDraft.selectedDays, day],
    });
  };

  const setRepeatPreset = (repeatRule: RepeatRule) => {
    if (!createDraft) return;

    updateCreateDraft({
      repeatRule,
      selectedDays:
        repeatRule === "custom"
          ? createDraft.selectedDays.length
            ? createDraft.selectedDays
            : [getTodayCode() as DayCode]
          : createDraft.selectedDays,
    });
  };

  const saveCreateBlock = async () => {
    if (!createDraft || !userId || !dayConfig) return;

    const name = createDraft.name.trim();
    if (!name) return;

    if (createConflict) return;

    const duration = Math.min(createDraft.durationMinutes, dayEndMin - createDraft.startMin);
    const appliesTo =
      createDraft.repeatRule === "daily"
        ? DAY_CODES
        : createDraft.repeatRule === "weekdays"
          ? ["mon", "tue", "wed", "thu", "fri"]
          : createDraft.selectedDays.length
            ? createDraft.selectedDays
            : [getTodayCode() as DayCode];

    const payload = {
      user_id: userId,
      day_config_id: dayConfig.id,
      name,
      type: createDraft.type,
      start_time: minToTime(createDraft.startMin),
      duration_minutes: duration,
      color: TOKENS.blocks[createDraft.type].bg,
      is_fixed: false,
      is_active: true,
      repeat_rule: createDraft.repeatRule,
      applies_to: appliesTo,
    };

    const { data, error } = await supabase.from("blocks").insert(payload).select("id,name,type,start_time,duration_minutes").single();

    if (error || !data) {
      console.error(error?.message ?? "Could not create block");
      return;
    }

    const nextBlock: LiveBlock = {
      dbId: data.id,
      id: data.id,
      type: data.type,
      name: data.name,
      start: data.start_time,
      end: addMinutes(data.start_time, data.duration_minutes),
      tasks: [],
    };

    setBlocks((current) => sortBlocksByStart([...current, nextBlock]));
    setCreateDraft(null);
  };

  const toggleTask = async (blockId: string, taskId: string) => {
    const block = blocks.find((item) => item.id === blockId);
    const task = block?.tasks.find((item) => item.id === taskId);
    if (!task) return;

    const { error } = await supabase.from("tasks").update({ completed: !task.done }).eq("id", taskId);
    if (error) {
      console.error(error.message);
      return;
    }

    setBlocks((current) =>
      current.map((item) =>
        item.id === blockId
          ? {
              ...item,
              tasks: item.tasks.map((currentTask) =>
                currentTask.id === taskId ? { ...currentTask, done: !currentTask.done } : currentTask,
              ),
            }
          : item,
      ),
    );
  };

  const addTask = (blockId: string, text: string) => {
    const block = blocks.find((item) => item.id === blockId);
    if (!block || !userId) return;

    return createTask({
      userId,
      blockId,
      title: text,
      priority: "low",
      date: todayIsoDate(),
      order: block.tasks.length,
    })
      .then((row) => {
        const nextTask = {
          id: row.id,
          text: row.title,
          priority: row.priority === "high" ? "high" : row.priority === "medium" ? "med" : "low",
          done: row.completed,
        };

        setBlocks((current) => {
          return current.map((item) =>
            item.id === blockId
              ? {
                  ...item,
                  tasks: [...item.tasks, nextTask],
                }
              : item,
          );
        });
      })
      .catch((error: unknown) => {
        console.error(error instanceof Error ? error.message : "Could not create task");
      });
  };

  const updateBlock = async (
    blockId: string,
    patch: { name: string; type: DemoBlockType; start: string; end: string },
  ) => {
    const duration = timeToMin(patch.end) - timeToMin(patch.start);
    const color = TOKENS.blocks[patch.type].bg;

    const { error } = await supabase
      .from("blocks")
      .update({
        name: patch.name,
        type: patch.type,
        start_time: patch.start,
        duration_minutes: duration,
        color,
      })
      .eq("id", blockId);

    if (error) {
      console.error(error.message);
      return false;
    }

    setBlocks((current) =>
      sortBlocksByStart(
        current.map((block) =>
          block.id === blockId
            ? {
                ...block,
                name: patch.name,
                type: patch.type,
                start: patch.start,
                end: patch.end,
              }
            : block,
        ),
      ),
    );

    return true;
  };

  const deleteBlock = async (blockId: string) => {
    setSelectedBlockId(null);
    setBlocks((current) => current.filter((block) => block.id !== blockId));

    const { error } = await supabase.from("blocks").delete().eq("id", blockId);
    if (error) {
      console.error(error.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {loading ? (
        <View className="absolute inset-0 z-10 items-center justify-center bg-white">
          <ActivityIndicator color={TOKENS.primaryDark} />
        </View>
      ) : null}

      <View style={{ flex: 1, backgroundColor: "#FFFFFF", opacity: loading ? 0 : 1 }}>
        <View style={{ paddingTop: 8, paddingHorizontal: 16, paddingBottom: 6 }}>
        <Text className="text-[11px] uppercase tracking-[0.26em] text-black/40">
          {formatTodayLabel(new Date())}
        </Text>

        <Text className="mt-4 max-w-[260px] font-display text-[34px] leading-[0.95] tracking-[-0.06em] text-ink">
          {userName ? `${salutation}, ${shortName(userName).toLowerCase()}.` : `${salutation}.`}
        </Text>

        <Text className="mt-2 max-w-[340px] font-body text-[14px] leading-6 text-black/55">
          {totalTasks === 0
            ? "Hoy va liviano. Sin tareas en agenda."
            : doneTasks === totalTasks
              ? "Todo listo por aquí 👌"
              : `Te quedan ${totalTasks - doneTasks} tareas en el día.`}
        </Text>
        </View>

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 120,
          }}
          style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
          <Pressable className="relative self-stretch" style={{ height: (timelineMinutes / 60) * HOUR_PX + 12 }} onPress={handleTimelinePress}>
            <View pointerEvents="box-none" className="absolute inset-0" style={{ zIndex: 0 }}>
              <View
                className="absolute left-0 right-0 top-0"
                pointerEvents="none"
                style={{ height: (timelineMinutes / 60) * HOUR_PX + 12, zIndex: 3 }}>
              {Array.from({ length: Math.max(1, Math.floor(dayEndMin / 60) - Math.ceil(dayStartMin / 60) + 1) }).map((_, index) => {
                const hour = Math.ceil(dayStartMin / 60) + index;
                const y = ((hour * 60 - dayStartMin) / 60) * HOUR_PX + 8;

                return (
                  <View key={hour} className="absolute left-0 right-0" style={{ top: y }}>
                    <Text
                      className="absolute left-0 w-[52px] pr-2 text-right font-mono text-[10.5px] tracking-[0.02em]"
                      style={{ top: -6, color: T.textDisabled }}>
                      {hour === 24 ? "00" : String(hour).padStart(2, "0")}:
                      {"00"}
                    </Text>
                    <View className="absolute left-[52px] right-0 h-px" style={{ backgroundColor: T.border }} />
                  </View>
                );
              })}
              </View>

              <View className="absolute top-0" style={{ left: GUTTER_PX + 6, right: 4, height: (timelineMinutes / 60) * HOUR_PX + 12, zIndex: 2 }}>
                {freeSlots.map((slot) => {
                const height = ((slot.endMin - slot.startMin) / 60) * HOUR_PX;
                if (height < 18) return null;

                return (
                  <View
                    key={`${slot.startMin}-${slot.endMin}`}
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: 4,
                      right: 4,
                      top: ((slot.startMin - dayStartMin) / 60) * HOUR_PX + 8,
                      height,
                      justifyContent: "center",
                    }}>
                    <Text
                      style={{
                        fontFamily: "DMSans_500Medium",
                        fontSize: 12,
                        color: "rgba(15,15,15,0.26)",
                        letterSpacing: 0.2,
                      }}>
                      {height >= 45 ? "Ventana libre" : "Horario libre"}
                    </Text>
                  </View>
                );
              })}

                {blocks.map((block) => (
                  <BlockCard key={block.id} block={block} onOpen={openBlock} timelineStartMin={dayStartMin} />
                ))}
              </View>

              {NOW_MIN >= dayStartMin && NOW_MIN < dayEndMin ? (
                <View
                  className="absolute left-0 right-0 flex-row items-center"
                  pointerEvents="none"
                  style={{ top: ((NOW_MIN - dayStartMin) / 60) * HOUR_PX + 8, zIndex: 4 }}>
                  <Text className="w-[52px] pr-2 text-right font-mono text-[10px] font-semibold" style={{ color: "#F55252" }}>
                    {String(Math.floor(NOW_MIN / 60)).padStart(2, "0")}:{String(NOW_MIN % 60).padStart(2, "0")}
                  </Text>
                  <View className="flex-1 flex-row items-center">
                    <View className="h-px flex-1 bg-red-500" />
                    <View
                      className="h-2.5 w-2.5 rounded-full bg-red-500"
                      style={{ shadowColor: "#F55252", shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } }}
                    />
                  </View>
                </View>
              ) : null}
            </View>
          </Pressable>

        </ScrollView>
      </View>

      <Modal transparent statusBarTranslucent visible={!!createDraft} animationType="fade" onRequestClose={() => setCreateDraft(null)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }}>
            <Pressable style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} onPress={() => setCreateDraft(null)} />

            {createDraft ? (
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
                  <View style={{ width: 40, height: 4, borderRadius: 9999, backgroundColor: T.border }} />
                </View>

                <View style={{ paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={{ fontFamily: "Syne_700Bold", fontSize: 24, letterSpacing: -0.8, color: T.text }}>Nuevo bloque</Text>
                  <Pressable onPress={() => setCreateDraft(null)} hitSlop={10}>
                    <Text style={{ fontFamily: "DMSans_500Medium", fontSize: 14, color: "rgba(15,15,15,0.45)" }}>Cerrar</Text>
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 + insets.bottom }}>
                <Text style={{ fontFamily: "DMSans_500Medium", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8, color: "rgba(15,15,15,0.4)" }}>Nombre</Text>
                <TextInput
                  value={createDraft.name}
                  onChangeText={(value) => updateCreateDraft({ name: value })}
                  placeholder="Trabajo, ducha, gym..."
                  placeholderTextColor="#9A9A9A"
                  style={{
                    marginTop: 8,
                    borderRadius: 14,
                    backgroundColor: "rgba(15,15,15,0.04)",
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    fontFamily: "DMSans_400Regular",
                    fontSize: 16,
                    color: T.text,
                  }}
                />

                <Text style={{ marginTop: 20, fontFamily: "DMSans_500Medium", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8, color: "rgba(15,15,15,0.4)" }}>Tipo</Text>
                <View style={{ marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {BLOCK_TYPES.map((type) => {
                    const active = createDraft.type === type;
                    const color = TOKENS.blocks[type].bg;
                    return (
                      <Pressable
                        key={type}
                        onPress={() => updateCreateDraft({ type })}
                        style={{
                          borderRadius: 9999,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          backgroundColor: active ? tint(color, 0.16) : "#F3F3F3",
                          borderWidth: 1,
                          borderColor: active ? color : "#E6E6E6",
                        }}>
                        <Text style={{ fontFamily: "DMSans_500Medium", fontSize: 13, color: active ? T.text : T.textSecondary }}>
                          {TOKENS.blocks[type].label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={{ marginTop: 20, flexDirection: "row", gap: 12 }}>
                  <TimeAdjustRow
                    label="Hora de inicio"
                    value={minToTime(createDraft.startMin)}
                    onMinus={() => shiftCreateStart(-15)}
                    onPlus={() => shiftCreateStart(15)}
                  />
                  <TimeAdjustRow
                    label="Duración"
                    value={minuteDurationLabel(createDraft.durationMinutes)}
                    onMinus={() => shiftCreateDuration(-15)}
                    onPlus={() => shiftCreateDuration(15)}
                  />
                </View>

                {createConflict ? (
                  <View style={{ marginTop: 12, borderRadius: 14, backgroundColor: "rgba(245, 82, 82, 0.12)", paddingHorizontal: 14, paddingVertical: 12 }}>
                    <Text style={{ fontFamily: "DMSans_500Medium", fontSize: 13, color: "#E53935" }}>
                      Ese horario ya está ocupado por {createConflict.name}.
                    </Text>
                    <Text style={{ marginTop: 4, fontFamily: "DMSans_400Regular", fontSize: 12, color: "rgba(229,57,53,0.9)" }}>
                      Prueba con otro tramo.
                    </Text>
                  </View>
                ) : null}

                <Text style={{ marginTop: 20, fontFamily: "DMSans_500Medium", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8, color: "rgba(15,15,15,0.4)" }}>Repetición</Text>
                <View style={{ marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {[
                    { rule: "daily" as const, label: "Todos los días" },
                    { rule: "weekdays" as const, label: "Lun a Vie" },
                    { rule: "custom" as const, label: "Personalizado" },
                  ].map((option) => {
                    const active = createDraft.repeatRule === option.rule;
                    return (
                      <Pressable
                        key={option.rule}
                        onPress={() => setRepeatPreset(option.rule)}
                        style={{
                          borderRadius: 9999,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          backgroundColor: active ? tint(T.primary, 0.16) : "#F3F3F3",
                          borderWidth: 1,
                          borderColor: active ? T.primary : "#E6E6E6",
                        }}>
                        <Text style={{ fontFamily: "DMSans_500Medium", fontSize: 13, color: active ? T.text : T.textSecondary }}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {createDraft.repeatRule === "custom" ? (
                  <>
                    <Text style={{ marginTop: 16, fontFamily: "DMSans_500Medium", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8, color: "rgba(15,15,15,0.4)" }}>
                      Días
                    </Text>
                    <View style={{ marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                      {DAY_OPTIONS.map((day) => {
                        const active = createDraft.selectedDays.includes(day.code);
                        return (
                          <Pressable
                            key={day.code}
                            onPress={() => toggleCreateDay(day.code)}
                            style={{
                              minWidth: 40,
                              borderRadius: 9999,
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              alignItems: "center",
                              backgroundColor: active ? tint(T.primary, 0.16) : "#F3F3F3",
                              borderWidth: 1,
                              borderColor: active ? T.primary : "#E6E6E6",
                            }}>
                            <Text style={{ fontFamily: "DMSans_500Medium", fontSize: 13, color: active ? T.text : T.textSecondary }}>
                              {day.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                ) : null}

                <View style={{ marginTop: 28, alignItems: "center" }}>
                  <PrimaryButton
                    label="Crear bloque"
                    onPress={saveCreateBlock}
                    disabled={!createDraft.name.trim() || !dayConfig || !userId || !!createConflict}
                    fullWidth
                  />
                </View>
              </ScrollView>
            </View>
          ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <BlockSheet
        block={selectedBlock}
        onClose={() => setSelectedBlockId(null)}
        onUpdateBlock={updateBlock}
        onToggleTask={toggleTask}
        onAddTask={addTask}
        onDeleteBlock={deleteBlock}
      />
    </SafeAreaView>
  );
}

function getTodayCode() {
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()];
}

function todayIsoDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addMinutes(start: string, minutes: number) {
  const [hours, mins] = start.split(":").map(Number);
  const total = hours * 60 + mins + minutes;
  if (total >= 24 * 60) {
    return "00:00";
  }
  const nextHours = String(Math.floor(total / 60)).padStart(2, "0");
  const nextMinutes = String(total % 60).padStart(2, "0");
  return `${nextHours}:${nextMinutes}`;
}

function timeToMin(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function minToTime(value: number) {
  const normalized = ((value % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function roundToQuarterHour(value: number) {
  return Math.round(value / 15) * 15;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function tint(hex: string, alpha: number) {
  const cleaned = hex.replace("#", "");
  const normalized = cleaned.length === 3 ? cleaned.split("").map((char) => char + char).join("") : cleaned;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatTodayLabel(date: Date) {
  const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  return `${days[date.getDay()]} ${date.getDate()} de ${months[date.getMonth()]}`.toUpperCase();
}

function getSalutation() {
  return "Hola";
}

function shortName(value: string) {
  return value.split(/[\s@]/)[0] || value;
}

function minuteDurationLabel(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

function TimeAdjustRow({
  label,
  value,
  onMinus,
  onPlus,
}: {
  label: string;
  value: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: "DMSans_500Medium", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8, color: "rgba(15,15,15,0.4)" }}>
        {label}
      </Text>
      <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", borderRadius: 14, backgroundColor: "rgba(15,15,15,0.04)", paddingHorizontal: 8, paddingVertical: 8 }}>
        <Pressable onPress={onMinus} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 9999, backgroundColor: "#FFFFFF" }}>
          <Text style={{ fontFamily: "DMSans_500Medium", fontSize: 18, color: T.text }}>-</Text>
        </Pressable>
        <Text style={{ flex: 1, textAlign: "center", fontFamily: "JetBrainsMono_400Regular", fontSize: 14, color: T.text }}>{value}</Text>
        <Pressable onPress={onPlus} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 9999, backgroundColor: "#FFFFFF" }}>
          <Text style={{ fontFamily: "DMSans_500Medium", fontSize: 18, color: T.text }}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function sortBlocksByStart(blocks: LiveBlock[]) {
  return [...blocks].sort((a, b) => timeToMin(a.start) - timeToMin(b.start));
}

function shouldShowBlock(repeatRule: string | null, appliesTo: string[] | null, todayCode: string) {
  if (repeatRule === "daily") return true;
  if (repeatRule === "weekdays") return ["mon", "tue", "wed", "thu", "fri"].includes(todayCode);
  if (Array.isArray(appliesTo) && appliesTo.length > 0) return appliesTo.includes(todayCode);
  return true;
}

function computeFreeSlots(blocks: LiveBlock[], dayStartMin: number, dayEndMin: number): FreeSlot[] {
  const slots: FreeSlot[] = [];
  let cursor = dayStartMin;

  for (const block of blocks) {
    const blockStart = timeToMin(block.start);
    const blockEnd = timeToMin(block.end);

    if (blockStart > cursor) {
      slots.push({ startMin: cursor, endMin: Math.min(blockStart, dayEndMin) });
    }

    cursor = Math.max(cursor, Math.min(blockEnd, dayEndMin));
    if (cursor >= dayEndMin) break;
  }

  if (cursor < dayEndMin) {
    slots.push({ startMin: cursor, endMin: dayEndMin });
  }

  return slots.filter((slot) => slot.endMin - slot.startMin > 0);
}

function pickDayConfig(configs: DayConfigRow[], todayCode: string) {
  return configs.find((config) => config.applies_to?.includes(todayCode)) ?? configs.find((config) => config.is_default) ?? null;
}
