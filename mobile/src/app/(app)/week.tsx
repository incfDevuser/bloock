import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BlockSheet } from "@/components/block-sheet";
import { NOW_MIN, TOKENS, blockState, type DemoBlock } from "@/lib/block-demo";
import { supabase } from "../../../utils/supabase";

const HOUR_PX = 60;
const GUTTER_PX = 52;
const DAY_COL_WIDTH = 106;
const DAY_HEADER_HEIGHT = 54;

const T = {
  bg: TOKENS.bg,
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

type LiveBlock = DemoBlock & {
  dbId: string;
  repeatRule: string | null;
  appliesTo: string[] | null;
};

type WeekDayCode = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type WeekDay = {
  code: WeekDayCode;
  shortLabel: string;
  date: Date;
  isToday: boolean;
};

type WeekBlockInstance = {
  block: LiveBlock;
  state: "past" | "now" | "future";
  top: number;
  height: number;
};

type WeekColumn = WeekDay & {
  blocks: WeekBlockInstance[];
};

const WEEK_DAY_META: Record<WeekDayCode, { shortLabel: string }> = {
  mon: { shortLabel: "Lun" },
  tue: { shortLabel: "Mar" },
  wed: { shortLabel: "Mié" },
  thu: { shortLabel: "Jue" },
  fri: { shortLabel: "Vie" },
  sat: { shortLabel: "Sáb" },
  sun: { shortLabel: "Dom" },
};

export default function WeekScreen() {
  const verticalRef = useRef<ScrollView | null>(null);
  const horizontalRef = useRef<ScrollView | null>(null);
  const mountedRef = useRef(true);

  const [blocks, setBlocks] = useState<LiveBlock[]>([]);
  const [dayConfig, setDayConfig] = useState<DayConfigRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<DemoBlock | null>(null);

  const weekDays = useMemo(() => buildWeekDays(new Date()), []);
  const dayStartMin = useMemo(() => timeToMin(dayConfig?.wake_time ?? "06:00"), [dayConfig]);
  const dayEndMin = useMemo(() => timeToMin(dayConfig?.end_time ?? "23:00"), [dayConfig]);
  const timelineMinutes = useMemo(() => Math.max(60, dayEndMin - dayStartMin), [dayEndMin, dayStartMin]);
  const weekColumns = useMemo<WeekColumn[]>(
    () =>
      weekDays.map((day) => {
        const items = blocks
          .filter((block) => shouldShowBlock(block.repeatRule, block.appliesTo, day.code))
          .map((block) => {
            const startMin = timeToMin(block.start);
            const endMin = timeToMin(block.end);

            return {
              block,
              state: getBlockStateForDate(block, day.date),
              top: ((startMin - dayStartMin) / 60) * HOUR_PX,
              height: ((endMin - startMin) / 60) * HOUR_PX,
            } satisfies WeekBlockInstance;
          })
          .sort((a, b) => a.top - b.top);

        return { ...day, blocks: items };
      }),
    [blocks, dayStartMin, weekDays],
  );
  const weekRangeLabel = useMemo(() => formatWeekRange(weekDays[0].date, weekDays[6].date), [weekDays]);

  const loadWeekData = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        if (mountedRef.current) {
          setDayConfig(null);
          setBlocks([]);
        }
        return;
      }

      const { data: dayConfigs, error: dayConfigError } = await supabase
        .from("day_configs")
        .select("id,name,wake_time,end_time,applies_to,is_default")
        .eq("user_id", userId);

      if (dayConfigError) console.error(dayConfigError.message);

      const selectedConfig = pickDayConfig(dayConfigs ?? []);

      if (!selectedConfig) {
        if (mountedRef.current) {
          setDayConfig(null);
          setBlocks([]);
        }
        return;
      }

      const dayConfigIds = (dayConfigs ?? []).map((config) => config.id);

      const { data: blockRows, error: blocksError } = await supabase
        .from("blocks")
        .select("id,day_config_id,name,type,start_time,duration_minutes,color,is_fixed,is_active,repeat_rule,applies_to")
        .in("day_config_id", dayConfigIds)
        .eq("is_active", true)
        .order("start_time", { ascending: true });

      if (blocksError) console.error(blocksError.message);

      const nextBlocks: LiveBlock[] = (blockRows ?? []).map((blockRow) => ({
        dbId: blockRow.id,
        id: blockRow.id,
        type: blockRow.type,
        name: blockRow.name,
        start: minToTime(timeToMin(blockRow.start_time)),
        end: addMinutes(blockRow.start_time, blockRow.duration_minutes),
        tasks: [],
        repeatRule: blockRow.repeat_rule,
        appliesTo: blockRow.applies_to,
      }));

      if (!mountedRef.current) return;

      setDayConfig(selectedConfig);
      setBlocks(nextBlocks);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    void loadWeekData();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!verticalRef.current || !horizontalRef.current) return;

    const nowY = ((NOW_MIN - dayStartMin) / 60) * HOUR_PX;
    const todayIndex = weekDays.findIndex((day) => day.isToday);

    horizontalRef.current.scrollTo({ x: Math.max(0, todayIndex * DAY_COL_WIDTH - 24), animated: false });
    verticalRef.current.scrollTo({ y: Math.max(0, nowY - 140), animated: false });
  }, [dayStartMin, weekDays]);

  const openBlock = (block: DemoBlock) => setSelectedBlock(block);

  const toggleTask = (blockId: string, taskId: string) => {
    setBlocks((current) =>
      current.map((block) =>
        block.id === blockId
          ? {
              ...block,
              tasks: block.tasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)),
            }
          : block,
      ),
    );
  };

  const addTask = (blockId: string, text: string) => {
    setBlocks((current) =>
      current.map((block) =>
        block.id === blockId
          ? {
              ...block,
              tasks: [
                ...block.tasks,
                {
                  id: `${blockId}-${Date.now()}`,
                  text,
                  priority: "low",
                  done: false,
                },
              ],
            }
          : block,
      ),
    );
  };

  const updateBlock = async (
    blockId: string,
    patch: { name: string; type: keyof typeof TOKENS.blocks; start: string; end: string },
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
    );

    return true;
  };

  const deleteBlock = async (blockId: string) => {
    setSelectedBlock(null);
    setBlocks((current) => current.filter((block) => block.id !== blockId));

    const { error } = await supabase.from("blocks").delete().eq("id", blockId);
    if (error) console.error(error.message);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadWeekData(false);
    } finally {
      if (mountedRef.current) setRefreshing(false);
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
          <Text style={{ fontFamily: "DMSans_500Medium", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2, color: "rgba(15,15,15,0.4)" }}>
            {weekRangeLabel}
          </Text>

          <Text
            numberOfLines={1}
            style={{ marginTop: 16, fontFamily: "Syne_700Bold", fontSize: 30, lineHeight: 30, letterSpacing: -0.7, color: T.text }}>
            Semana en marcha.
          </Text>

          <Text style={{ marginTop: 8, maxWidth: 340, fontFamily: "DMSans_400Regular", fontSize: 14, lineHeight: 24, color: "rgba(15,15,15,0.55)" }}>
            Tu semana, en bloques.
          </Text>
        </View>

        <ScrollView
          ref={verticalRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          style={{ flex: 1, backgroundColor: "#FFFFFF" }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={TOKENS.primaryDark} colors={[TOKENS.primaryDark]} />}
        >
          <ScrollView
            ref={horizontalRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24 }}
            style={{ backgroundColor: "#FFFFFF" }}>
            <View style={{ width: GUTTER_PX + weekDays.length * DAY_COL_WIDTH, height: DAY_HEADER_HEIGHT + (timelineMinutes / 60) * HOUR_PX + 20 }}>
              <View style={{ position: "absolute", left: GUTTER_PX, right: 0, top: 0, height: DAY_HEADER_HEIGHT, flexDirection: "row" }}>
                {weekColumns.map((day) => (
                  <View
                    key={day.code}
                    style={{
                      width: DAY_COL_WIDTH,
                      alignItems: "center",
                      justifyContent: "center",
                      borderLeftWidth: 1,
                      borderColor: T.border,
                      backgroundColor: day.isToday ? "rgba(200,241,53,0.12)" : "transparent",
                    }}>
                    <Text style={{ fontFamily: "DMSans_500Medium", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, color: day.isToday ? T.text : T.textSecondary }}>
                      {day.shortLabel}
                    </Text>
                    <Text style={{ marginTop: 2, fontFamily: "JetBrainsMono_400Regular", fontSize: 13, color: T.text }}>
                      {day.date.getDate()}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={{ position: "absolute", left: 0, right: 0, top: DAY_HEADER_HEIGHT, bottom: 0 }}>
                {Array.from({ length: Math.max(1, Math.floor(dayEndMin / 60) - Math.ceil(dayStartMin / 60) + 1) }).map((_, index) => {
                  const hour = Math.ceil(dayStartMin / 60) + index;
                  const y = ((hour * 60 - dayStartMin) / 60) * HOUR_PX + 8;

                  return (
                    <View key={hour} style={{ position: "absolute", left: 0, right: 0, top: y }}>
                      <Text style={{ position: "absolute", left: 0, width: GUTTER_PX, paddingRight: 10, textAlign: "right", top: -6, fontFamily: "JetBrainsMono_400Regular", fontSize: 10.5, color: T.textDisabled }}>
                        {String(hour).padStart(2, "0")}:
                        {"00"}
                      </Text>
                      <View style={{ position: "absolute", left: GUTTER_PX, right: 0, height: 1, backgroundColor: T.border }} />
                    </View>
                  );
                })}

                {weekColumns.map((day, dayIndex) => (
                  <View
                    key={day.code}
                    style={{
                      position: "absolute",
                      left: GUTTER_PX + dayIndex * DAY_COL_WIDTH,
                      top: 0,
                      width: DAY_COL_WIDTH,
                      height: (timelineMinutes / 60) * HOUR_PX + 12,
                      borderLeftWidth: 1,
                      borderColor: T.border,
                      backgroundColor: day.isToday ? "rgba(200,241,53,0.06)" : "transparent",
                    }}>
                    {day.blocks.map((instance) => (
                      <WeekBlockCard
                        key={`${day.code}-${instance.block.id}-${instance.top}`}
                        block={instance.block}
                        state={instance.state}
                        top={instance.top + 8}
                        height={instance.height}
                        left={4}
                        width={DAY_COL_WIDTH - 8}
                        onOpen={openBlock}
                      />
                    ))}
                  </View>
                ))}

                {NOW_MIN >= dayStartMin && NOW_MIN < dayEndMin ? (
                  <View style={{ position: "absolute", left: 0, right: 0, top: ((NOW_MIN - dayStartMin) / 60) * HOUR_PX + 8, zIndex: 5 }} pointerEvents="none">
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={{ width: GUTTER_PX, paddingRight: 10, textAlign: "right", fontFamily: "JetBrainsMono_400Regular", fontSize: 10, fontWeight: "600", color: "#F55252" }}>
                        {String(Math.floor(NOW_MIN / 60)).padStart(2, "0")}:{String(NOW_MIN % 60).padStart(2, "0")}
                      </Text>
                      <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                        <View style={{ height: 1.5, flex: 1, backgroundColor: "#F55252" }} />
                        <View style={{ width: 9, height: 9, borderRadius: 9999, backgroundColor: "#F55252", shadowColor: "#F55252", shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } }} />
                      </View>
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
          </ScrollView>
        </ScrollView>
      </View>

      <BlockSheet
        block={selectedBlock}
        onClose={() => setSelectedBlock(null)}
        onUpdateBlock={updateBlock}
        onToggleTask={toggleTask}
        onAddTask={addTask}
        onDeleteBlock={deleteBlock}
      />
    </SafeAreaView>
  );
}

function WeekBlockCard({
  block,
  state,
  top,
  height,
  left,
  width,
  onOpen,
}: {
  block: LiveBlock;
  state: "past" | "now" | "future";
  top: number;
  height: number;
  left: number;
  width: number;
  onOpen: (block: DemoBlock) => void;
}) {
  const meta = TOKENS.blocks[block.type];
  const color = meta.bg;
  const total = block.tasks.length;
  const done = block.tasks.filter((task) => task.done).length;
  const isShort = height < 44;
  const isTiny = height < 28;

  return (
    <Pressable
      onPress={() => onOpen(block)}
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        backgroundColor: tint(color, state === "now" ? 0.38 : 0.28),
        borderWidth: 1,
        borderColor: tint(color, 0.28),
        borderLeftWidth: 4,
        borderLeftColor: color,
        borderRadius: 8,
        paddingHorizontal: isTiny ? 6 : 8,
        paddingVertical: isTiny ? 2 : 6,
        opacity: state === "past" ? 0.65 : 1,
        overflow: "hidden",
        shadowColor: state === "now" ? color : "#000",
        shadowOpacity: state === "now" ? 0.3 : 0,
        shadowRadius: state === "now" ? 10 : 0,
        shadowOffset: { width: 0, height: 4 },
        elevation: state === "now" ? 4 : 0,
      }}>
      {isShort ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text numberOfLines={1} style={{ flex: 1, minWidth: 0, fontFamily: "DMSans_500Medium", fontSize: 11.5, color: T.text }}>
            {block.name}
          </Text>
          <Text style={{ fontFamily: "JetBrainsMono_400Regular", fontSize: 9.5, color: T.textSecondary }}>{block.start}</Text>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text numberOfLines={1} style={{ flex: 1, minWidth: 0, fontFamily: "DMSans_500Medium", fontSize: 12.5, lineHeight: 15, color: T.text }}>
              {block.name}
            </Text>
            {state === "now" ? (
              <View style={{ backgroundColor: T.primary, borderRadius: 9999, paddingHorizontal: 5, paddingVertical: 1 }}>
                <Text style={{ fontFamily: "DMSans_500Medium", fontSize: 8.5, color: "#0F0F0F" }}>AHORA</Text>
              </View>
            ) : null}
          </View>

          <Text style={{ marginTop: 2, fontFamily: "JetBrainsMono_400Regular", fontSize: 10.5, lineHeight: 14, color: T.textSecondary }}>
            {block.start}–{block.end}
          </Text>

          {height >= 70 && total > 0 ? (
            <View style={{ marginTop: "auto", flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: tint(color, 0.2), overflow: "hidden" }}>
                <View style={{ width: `${(done / total) * 100}%`, height: "100%", backgroundColor: color, borderRadius: 2 }} />
              </View>
              <Text style={{ fontFamily: "DMSans_500Medium", fontSize: 10, color: T.textSecondary }}>
                {done}/{total}
              </Text>
            </View>
          ) : null}
        </>
      )}
    </Pressable>
  );
}

function buildWeekDays(reference: Date): WeekDay[] {
  const start = startOfWeek(reference);

  return ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((code, index) => {
    const date = addDays(start, index);
    return {
      code,
      shortLabel: WEEK_DAY_META[code].shortLabel,
      date,
      isToday: isSameDay(date, new Date()),
    };
  });
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = (day + 6) % 7;
  next.setDate(next.getDate() - diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatWeekRange(start: Date, end: Date) {
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  if (start.getMonth() === end.getMonth()) {
    return `SEMANA DEL ${start.getDate()} AL ${end.getDate()} DE ${months[start.getMonth()]}`;
  }
  return `SEMANA DEL ${start.getDate()} DE ${months[start.getMonth()]} AL ${end.getDate()} DE ${months[end.getMonth()]}`;
}

function getBlockStateForDate(block: DemoBlock, date: Date): "past" | "now" | "future" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  if (isSameDay(target, today)) {
    return blockState(block);
  }

  return target < today ? "past" : "future";
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

function addMinutes(start: string, minutes: number) {
  const [hours, mins] = start.split(":").map(Number);
  const total = hours * 60 + mins + minutes;
  if (total >= 24 * 60) return "00:00";
  const nextHours = String(Math.floor(total / 60)).padStart(2, "0");
  const nextMinutes = String(total % 60).padStart(2, "0");
  return `${nextHours}:${nextMinutes}`;
}

function shouldShowBlock(repeatRule: string | null, appliesTo: string[] | null, todayCode: string) {
  if (repeatRule === "daily") return true;
  if (repeatRule === "weekdays") return ["mon", "tue", "wed", "thu", "fri"].includes(todayCode);
  if (Array.isArray(appliesTo) && appliesTo.length > 0) return appliesTo.includes(todayCode);
  return true;
}

function tint(hex: string, alpha: number) {
  const cleaned = hex.replace("#", "");
  const normalized = cleaned.length === 3 ? cleaned.split("").map((char) => char + char).join("") : cleaned;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function pickDayConfig(configs: DayConfigRow[]) {
  const list = Array.isArray(configs) ? configs : [];

  for (const config of list) {
    if (config.is_default) {
      return config;
    }
  }

  return list[0] ?? null;
}
