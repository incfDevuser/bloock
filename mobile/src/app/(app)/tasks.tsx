import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, LayoutAnimation, Platform, Pressable, ScrollView, Text, UIManager, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PriorityDot } from "@/components/priority-dot";
import { TaskCheck } from "@/components/task-check";
import { TaskCreateModal } from "@/components/task-create-modal";
import { TOKENS, blockState, fmtDuration, type TaskPriority } from "@/lib/block-demo";
import { createTask } from "@/lib/task-service";
import { supabase } from "../../../utils/supabase";

type FilterKey = "pendientes" | "todas" | "alta";

type DayConfigRow = {
  id: string;
  name: string;
  wake_time: string;
  end_time: string;
  applies_to: string[];
  is_default: boolean;
};

type TaskRow = {
  id: string;
  block_id: string;
  title: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
  date: string;
  order: number | null;
};

type BlockType = keyof typeof TOKENS.blocks;

type LiveTask = {
  id: string;
  text: string;
  priority: TaskPriority;
  done: boolean;
};

type LiveBlock = {
  id: string;
  dbId: string;
  type: BlockType;
  name: string;
  start: string;
  end: string;
  tasks: LiveTask[];
  isFixed: boolean;
  repeatRule: string | null;
  appliesTo: string[] | null;
};

const filters: { key: FilterKey; label: string }[] = [
  { key: "pendientes", label: "Pendientes" },
  { key: "todas", label: "Todas" },
  { key: "alta", label: "Alta" },
];

export default function TasksScreen() {
  const [blocks, setBlocks] = useState<LiveBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("todas");
  const [expandedBlockIds, setExpandedBlockIds] = useState<Record<string, boolean>>({});
  const [taskDraft, setTaskDraft] = useState<{ blockId: string; blockName: string } | null>(null);

  const totalTasks = useMemo(() => blocks.reduce((sum, block) => sum + block.tasks.length, 0), [blocks]);
  const doneTasks = useMemo(
    () => blocks.reduce((sum, block) => sum + block.tasks.filter((task) => task.done).length, 0),
    [blocks],
  );

  const visibleBlocks = useMemo(() => {
    return blocks.map((block) => {
      const visibleTasks =
        filter === "pendientes"
          ? block.tasks.filter((task) => !task.done)
          : filter === "alta"
            ? block.tasks.filter((task) => task.priority === "high")
            : block.tasks;

      return { ...block, visibleTasks };
    });
  }, [blocks, filter]);

  useEffect(() => {
    let alive = true;

    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    const load = async () => {
      setLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (alive) setUserId(userId ?? null);

      if (!userId) {
        if (alive) {
          setBlocks([]);
          setLoading(false);
        }
        return;
      }

      const [{ data: dayConfigs, error: dayConfigError }, { data: taskRows, error: tasksError }] = await Promise.all([
        supabase.from("day_configs").select("id,name,wake_time,end_time,applies_to,is_default").eq("user_id", userId),
        supabase
          .from("tasks")
          .select("id,block_id,title,priority,completed,date,order")
          .eq("user_id", userId)
          .eq("date", todayIsoDate())
          .order("order", { ascending: true }),
      ]);

      if (dayConfigError) console.error(dayConfigError.message);
      if (tasksError) console.error(tasksError.message);

      const selectedConfig = pickDayConfig(dayConfigs ?? [], getTodayCode());

      if (!selectedConfig) {
        if (alive) {
          setBlocks([]);
          setLoading(false);
        }
        return;
      }

      const { data: blockRows, error: blocksError } = await supabase
        .from("blocks")
        .select("id,day_config_id,name,type,start_time,duration_minutes,color,is_fixed,is_active,repeat_rule,applies_to")
        .eq("day_config_id", selectedConfig.id)
        .eq("is_active", true)
        .order("start_time", { ascending: true });

      if (blocksError) console.error(blocksError.message);

      const tasksByBlock = new Map<string, LiveTask[]>();
      for (const taskRow of taskRows ?? []) {
        const current = tasksByBlock.get(taskRow.block_id) ?? [];
        current.push({
          id: taskRow.id,
          text: taskRow.title,
          priority: normalizePriority(taskRow.priority),
          done: taskRow.completed,
        });
        tasksByBlock.set(taskRow.block_id, current);
      }

      const todayCode = getTodayCode();
      const nextBlocks: LiveBlock[] = (blockRows ?? [])
        .filter((blockRow) => shouldShowBlock(blockRow.repeat_rule, blockRow.applies_to, todayCode))
        .map((blockRow) => ({
          dbId: blockRow.id,
          id: blockRow.id,
          type: blockRow.type in TOKENS.blocks ? (blockRow.type as BlockType) : "otro",
          name: blockRow.name,
          start: blockRow.start_time,
          end: addMinutes(blockRow.start_time, blockRow.duration_minutes),
          tasks: tasksByBlock.get(blockRow.id) ?? [],
          isFixed: Boolean(blockRow.is_fixed),
          repeatRule: blockRow.repeat_rule,
          appliesTo: blockRow.applies_to,
        }));

      if (!alive) return;

      setBlocks(nextBlocks);
      setExpandedBlockIds(Object.fromEntries(nextBlocks.map((block) => [block.id, block.tasks.some((task) => !task.done)])));
      setLoading(false);
    };

    void load();

    return () => {
      alive = false;
    };
  }, []);

  const emptyMessage = useMemo(() => {
    if (blocks.length === 0) {
      return {
        title: "Aún no tienes bloques para hoy.",
        body: "Arma tu día y acá van a aparecer sus tareas.",
      };
    }

    return {
      title: filter === "pendientes" ? "Todo listo por aquí 👌" : "No hay tareas para mostrar.",
      body: filter === "pendientes" ? "Ya cerraste todo lo de hoy." : "Probá con otro filtro.",
    };
  }, [blocks.length, filter]);

  const todayLabel = formatTodayLabel(new Date());

  const toggleBlock = (blockId: string) => {
    LayoutAnimation.configureNext({
      duration: 380,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });

    setExpandedBlockIds((current) => ({
      ...current,
      [blockId]: !current[blockId],
    }));
  };

  const openCreateTask = (blockId: string, blockName: string) => {
    setExpandedBlockIds((current) => ({
      ...current,
      [blockId]: true,
    }));
    setTaskDraft({ blockId, blockName });
  };

  const createTaskForBlock = async ({ title, priority }: { title: string; priority: TaskPriority }) => {
    if (!taskDraft || !userId) return;

    const block = blocks.find((item) => item.id === taskDraft.blockId);
    if (!block) return;

    const row = await createTask({
      userId,
      blockId: taskDraft.blockId,
      title,
      priority: priority === "low" ? "low" : priority === "high" ? "high" : "medium",
      date: todayIsoDate(),
      order: block.tasks.length,
    });

    const normalizedPriority = row.priority === "high" ? "high" : row.priority === "medium" ? "med" : "low";

    setBlocks((current) =>
      current.map((item) =>
        item.id === taskDraft.blockId
          ? {
              ...item,
              tasks: [
                ...item.tasks,
                {
                  id: row.id,
                  text: row.title,
                  priority: normalizedPriority,
                  done: row.completed,
                },
              ],
            }
          : item,
      ),
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {loading ? (
        <View className="absolute inset-0 z-10 items-center justify-center bg-white">
          <ActivityIndicator color={TOKENS.primaryDark} />
        </View>
      ) : null}

      <View style={{ paddingTop: 8, paddingHorizontal: 16, paddingBottom: 6 }}>
        <Text className="font-mono text-[11px] uppercase tracking-[0.28em] text-black/45">{todayLabel}</Text>
        <Text numberOfLines={1} className="mt-4 font-display text-[34px] leading-[0.95] tracking-[-0.06em] text-ink">
          Tareas de hoy.
        </Text>

        <View className="mt-2 flex-row flex-wrap items-center gap-2">
          <Text className="font-body text-[14px] leading-6 text-black/60">
            <Text className="font-bodyMedium text-ink">{doneTasks}</Text> de {totalTasks} tareas completadas
          </Text>
          <View className="rounded-full bg-black/[0.05] px-2 py-1">
            <Text className="font-bodyMedium text-[10px] uppercase tracking-[0.14em] text-black/55">{blocks.length} bloques</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-4 pt-4">
        <View className="flex-row flex-wrap gap-2">
          {filters.map((item) => {
            const active = filter === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setFilter(item.key)}
                className={`rounded-full px-4 py-2 ${active ? "bg-ink" : "border border-black/10 bg-white"}`}>
                <Text className={`font-bodyMedium text-[12px] ${active ? "text-white" : "text-ink"}`}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View className="mt-6 gap-3">
          {!loading && visibleBlocks.length === 0 ? (
            <View className="rounded-[24px] border border-black/10 bg-white p-5">
              <Text className="font-bodyMedium text-[17px] text-ink">{emptyMessage.title}</Text>
              <Text className="mt-2 font-body text-[15px] leading-7 text-black/55">{emptyMessage.body}</Text>
            </View>
          ) : null}

          {visibleBlocks.map((block) => {
            const meta = TOKENS.blocks[block.type];
            const total = block.tasks.length;
            const pending = block.tasks.filter((task) => !task.done).length;
            const state = blockState(block);
            const expanded = expandedBlockIds[block.id] ?? false;

            return (
              <View
                key={block.id}
                className="overflow-hidden rounded-[24px] bg-white"
                style={{
                  shadowColor: "#000",
                  shadowOpacity: 0.06,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 1,
                }}>
                <Pressable
                  onPress={() => toggleBlock(block.id)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  className="px-4 py-4 active:opacity-90">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1 flex-row items-start gap-3">
                      <View className="mt-1.5 h-3 w-3 rounded-full" style={{ backgroundColor: meta.bg }} />
                      <View className="min-w-0 flex-1">
                        <View className="flex-row flex-wrap items-center gap-2">
                          <Text className="font-bodyMedium text-[15px] text-ink">{block.name}</Text>
                          {block.isFixed ? (
                            <View className="rounded-full bg-black/[0.05] px-2 py-1">
                              <Text className="font-bodyMedium text-[10px] uppercase tracking-[0.14em] text-black/55">Fijo</Text>
                            </View>
                          ) : null}
                          {state === "now" ? (
                            <View className="ml-1 rounded-full bg-lime-300 px-3 py-1.5">
                              <Text className="font-bodyMedium text-[10px] uppercase tracking-[0.14em] text-ink">Ahora</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text className="mt-1 font-mono text-[12px] text-black/45">
                          {block.start}–{block.end} · {fmtDuration(block.start, block.end)}
                        </Text>
                        <Text className="mt-1 font-body text-[13px] text-black/45">
                          {total ? `${pending} pendientes de ${total}` : "Sin tareas"}
                        </Text>
                      </View>
                    </View>

                    <View className="mt-0.5 flex-row items-center gap-2">
                      <Pressable
                        onPress={(event) => {
                          event.stopPropagation();
                          openCreateTask(block.id, block.name);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Crear tarea en ${block.name}`}
                        className="h-8 w-8 items-center justify-center rounded-full bg-black/[0.05] active:opacity-80">
                        <Text className="font-bodyMedium text-[18px] leading-none text-ink">+</Text>
                      </Pressable>
                      <Text className="font-mono text-[16px] text-black/35">{expanded ? "⌄" : "›"}</Text>
                    </View>
                  </View>
                </Pressable>

                {expanded ? (
                  <View className="border-t border-black/10">
                    {block.visibleTasks.length ? (
                      block.visibleTasks.map((task, index) => (
                        <View
                          key={task.id}
                          className={`min-h-[56px] flex-row items-start gap-3 px-4 py-3 ${index === 0 ? "" : "border-t border-black/10"}`}>
                          <TaskCheck checked={task.done} onPress={() => toggleTask(block.id, task.id)} />
                          <PriorityDot priority={task.priority} />

                          <View className="min-w-0 flex-1">
                            <Text
                              className={`font-body text-[15px] leading-6 text-ink ${task.done ? "opacity-50 line-through" : ""}`}>
                              {task.text}
                            </Text>
                          </View>

                          <View
                            className="rounded-full px-2 py-1"
                            style={{ backgroundColor: priorityBg(task.priority), opacity: task.done ? 0.55 : 1 }}>
                            <Text className="font-bodyMedium text-[10px] uppercase tracking-[0.14em]" style={{ color: priorityText(task.priority) }}>
                              {priorityLabel(task.priority)}
                            </Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <View className="px-4 py-4">
                        <Text className="font-body text-[14px] text-black/45">
                          {filter === "todas" ? (block.isFixed ? "Bloque fijo, sin tareas." : "Este bloque está libre.") : "Sin tareas para este filtro."}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        <View className="h-44" />
      </ScrollView>

      {taskDraft ? (
        <TaskCreateModal
          key={taskDraft.blockId}
          visible
          blockName={taskDraft.blockName}
          onClose={() => setTaskDraft(null)}
          onSubmit={createTaskForBlock}
        />
      ) : null}
    </SafeAreaView>
  );

  async function toggleTask(blockId: string, taskId: string) {
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

    const block = blocks.find((item) => item.id === blockId);
    const task = block?.tasks.find((item) => item.id === taskId);
    if (!task) return;

    const { error } = await supabase.from("tasks").update({ completed: !task.done }).eq("id", taskId);
    if (error) console.error(error.message);
  }
}

function normalizePriority(priority: TaskRow["priority"]): TaskPriority {
  if (priority === "high") return "high";
  if (priority === "medium") return "med";
  return "low";
}

function priorityLabel(priority: TaskPriority) {
  if (priority === "high") return "Alta";
  if (priority === "med") return "Media";
  return "Baja";
}

function priorityBg(priority: TaskPriority) {
  if (priority === "high") return "rgba(245, 82, 82, 0.14)";
  if (priority === "med") return "rgba(245, 166, 35, 0.14)";
  return "rgba(94, 194, 106, 0.14)";
}

function priorityText(priority: TaskPriority) {
  if (priority === "high") return "#F55252";
  if (priority === "med") return "#F5A623";
  return "#5EC26A";
}

function todayIsoDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayCode() {
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()];
}

function shouldShowBlock(repeatRule: string | null, appliesTo: string[] | null, todayCode: string) {
  if (repeatRule === "daily") return true;
  if (repeatRule === "weekdays") return ["mon", "tue", "wed", "thu", "fri"].includes(todayCode);
  if (Array.isArray(appliesTo) && appliesTo.length > 0) return appliesTo.includes(todayCode);
  return true;
}

function pickDayConfig(configs: DayConfigRow[], todayCode: string) {
  return configs.find((config) => config.applies_to?.includes(todayCode)) ?? configs.find((config) => config.is_default) ?? null;
}

function addMinutes(start: string, minutes: number) {
  const [hours, mins] = start.split(":").map(Number);
  const total = hours * 60 + mins + minutes;
  const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const nextHours = String(Math.floor(normalized / 60)).padStart(2, "0");
  const nextMinutes = String(normalized % 60).padStart(2, "0");
  return `${nextHours}:${nextMinutes}`;
}

function formatTodayLabel(date: Date) {
  const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  return `${days[date.getDay()]} ${date.getDate()} de ${months[date.getMonth()]}`.toUpperCase();
}
