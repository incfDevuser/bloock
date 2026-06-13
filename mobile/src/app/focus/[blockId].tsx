import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Svg, { Circle } from "react-native-svg";

import { PriorityDot } from "@/components/priority-dot";
import { TaskCheck } from "@/components/task-check";
import { TOKENS, type DemoBlockType } from "@/lib/block-demo";
import { supabase } from "../../../utils/supabase";

type FocusTask = {
  id: string;
  text: string;
  priority: "high" | "med" | "low";
  done: boolean;
};

type FocusBlock = {
  id: string;
  name: string;
  type: DemoBlockType;
  startTime: string;
  endTime: string;
  durationMinutes: number;
};

export default function FocusBlockScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ blockId?: string | string[] }>();
  const blockId = Array.isArray(params.blockId) ? params.blockId[0] : params.blockId;

  const [loading, setLoading] = useState(true);
  const [block, setBlock] = useState<FocusBlock | null>(null);
  const [tasks, setTasks] = useState<FocusTask[]>([]);
  const [running, setRunning] = useState(true);
  const [remainingSec, setRemainingSec] = useState(1);

  const meta = block ? TOKENS.blocks[block.type] : null;
  const totalSec = useMemo(() => Math.max(1, (block?.durationMinutes ?? 0) * 60), [block]);
  const doneTasks = tasks.filter((task) => task.done).length;

  useEffect(() => {
    let alive = true;

    const load = async () => {
      if (!blockId) {
        if (alive) {
          setBlock(null);
          setTasks([]);
          setLoading(false);
        }
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        if (alive) setLoading(false);
        return;
      }

      const [{ data: blockRow, error: blockError }, { data: taskRows, error: taskError }] = await Promise.all([
        supabase
          .from("blocks")
          .select("id,name,type,start_time,duration_minutes")
          .eq("id", blockId)
          .maybeSingle(),
        supabase
          .from("tasks")
          .select("id,title,priority,completed")
          .eq("block_id", blockId)
          .eq("user_id", userId)
          .eq("date", todayIsoDate())
          .order("order", { ascending: true }),
      ]);

      if (blockError) console.error(blockError.message);
      if (taskError) console.error(taskError.message);

      if (!alive) return;

      if (!blockRow) {
        setBlock(null);
        setTasks([]);
        setLoading(false);
        return;
      }

      const nextBlock: FocusBlock = {
        id: blockRow.id,
        name: blockRow.name,
        type: blockRow.type,
        startTime: blockRow.start_time,
        endTime: addMinutes(blockRow.start_time, blockRow.duration_minutes),
        durationMinutes: blockRow.duration_minutes,
      };

      setBlock(nextBlock);
      setTasks(
        (taskRows ?? []).map((task) => ({
          id: task.id,
          text: task.title,
          priority: task.priority === "high" ? "high" : task.priority === "low" ? "low" : "med",
          done: task.completed,
        })),
      );
      setRemainingSec(Math.max(1, nextBlock.durationMinutes * 60));
      setRunning(true);
      setLoading(false);
    };

    void load();

    return () => {
      alive = false;
    };
  }, [blockId]);

  useEffect(() => {
    if (!running || loading || !block) return;

    const id = setInterval(() => {
      setRemainingSec((current) => {
        const next = Math.max(0, current - 1);
        if (next === 0) setRunning(false);
        return next;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [running, loading, block]);

  const toggleTask = async (taskId: string) => {
    const current = tasks.find((task) => task.id === taskId);
    if (!current) return;

    const { error } = await supabase.from("tasks").update({ completed: !current.done }).eq("id", taskId);
    if (error) {
      console.error(error.message);
      return;
    }

    setTasks((currentTasks) => currentTasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)));
  };

  const closeFocus = () => {
    if (running) return;
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={TOKENS.primaryDark} />
      </SafeAreaView>
    );
  }

  if (!block || !meta) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center font-display text-[28px] text-ink">Bloque no encontrado</Text>
          <Pressable onPress={() => router.back()} className="mt-6 rounded-full bg-lime-300 px-5 py-3">
            <Text className="font-bodyMedium text-[14px] text-ink">Volver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="relative flex-1">
        <View className="flex-row items-center justify-between px-4 pb-2 pt-3" style={{ paddingTop: 8 }}>
          <View className="flex-row items-center gap-2">
            <View className="h-2.5 w-2.5 rounded-full bg-lime-300" />
            <View>
              <Text className="font-bodyMedium text-[10px] uppercase tracking-[0.2em] text-black/45">Modo foco</Text>
            </View>
          </View>

          <Pressable
            onPress={closeFocus}
            disabled={running}
            className="rounded-full bg-white px-3 py-2"
            style={{ borderWidth: 1, borderColor: "rgba(15,15,15,0.06)", opacity: running ? 0.35 : 1 }}>
            <Text className="font-body text-[13px] text-black/55">{running ? "Pausa para cerrar" : "Cerrar"}</Text>
          </Pressable>
        </View>

        <View className="px-4 pt-2">
          <View className="mx-auto mb-6 h-px w-16 bg-lime-300/60" />

          <View className="relative items-center px-5 py-6">
            <View className="items-center pb-4">
              <Text className="font-mono text-[11px] uppercase tracking-[0.18em] text-black/45">{meta.label} · {block.startTime}–{block.endTime}</Text>
              <Text className="mt-2 text-center font-display text-[27px] leading-[1.05] tracking-[-0.04em] text-ink">
                {block.name}
              </Text>
            </View>

            <View style={{ position: "relative", width: 238, height: 238 }}>
              <FocusRing totalSec={totalSec} remainingSec={remainingSec} color={meta.bg} finished={remainingSec <= 0} />
              <View className="absolute inset-0 items-center justify-center">
                <Text className="font-bodyMedium text-[10.5px] uppercase tracking-[0.18em] text-black/45">
                  {remainingSec <= 0 ? "Listo" : running ? "Restante" : "Pausado"}
                </Text>
                <Text className="mt-2 font-mono text-[42px] leading-[1.05] text-ink" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatCountdown(remainingSec)}
                </Text>
                <Text className="mt-2 font-mono text-[11px] text-black/45" style={{ fontVariantNumeric: "tabular-nums" }}>
                  de {formatCountdown(totalSec)}
                </Text>
              </View>
            </View>

            <View className="mt-5 flex-row gap-3">
              <Pressable
                onPress={() => setRunning((current) => !current)}
                disabled={remainingSec <= 0}
                className="flex-row items-center gap-2 rounded-full px-5 py-3"
                style={{
                  backgroundColor: running ? TOKENS.primary : "#FFFFFF",
                  borderWidth: 1,
                  borderColor: running ? "rgba(15,15,15,0.06)" : "rgba(15,15,15,0.08)",
                  opacity: remainingSec <= 0 ? 0.5 : 1,
                }}>
                <View className={`h-1.5 w-1.5 rounded-full ${running ? "bg-ink" : "bg-ink"}`} />
                <Text className="font-bodyMedium text-[14px] text-ink">{running ? "Pausar" : "Reanudar"}</Text>
              </Pressable>
            </View>

          </View>
        </View>

        <View className="mx-4 mt-4 flex-1 min-h-0 rounded-[22px] bg-white" style={{ marginBottom: 16 + insets.bottom }}>
          <View className="flex-row items-center justify-between px-4 py-3">
            <Text className="font-bodyMedium text-[11px] uppercase tracking-[0.18em] text-black/45">Tareas</Text>
            <Text className="font-mono text-[11px] text-black/45">
              {doneTasks}/{tasks.length}
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingVertical: 4 }}>
            {tasks.length === 0 ? (
              <View className="px-4 py-8">
                <Text className="text-center font-bodyMedium text-[15px] text-ink">Este bloque está libre.</Text>
                <Text className="mt-2 text-center font-body text-[13px] text-black/45">Agregá tareas antes de entrar en foco.</Text>
              </View>
            ) : (
              tasks.map((task) => <FocusTaskRow key={task.id} task={task} onToggle={() => void toggleTask(task.id)} />)
            )}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

function FocusTaskRow({ task, onToggle }: { task: FocusTask; onToggle: () => void }) {
  return (
    <View className="flex-row items-center gap-3 px-4 py-3">
      <TaskCheck checked={task.done} onPress={onToggle} />
      <PriorityDot priority={task.priority} />
      <Text className={`flex-1 font-body text-[15px] leading-6 text-ink ${task.done ? "opacity-45 line-through" : ""}`}>
        {task.text}
      </Text>
    </View>
  );
}

function FocusRing({ totalSec, remainingSec, color, finished }: { totalSec: number; remainingSec: number; color: string; finished: boolean }) {
  const RING_SIZE = 238;
  const RING_STROKE = 8;
  const RING_R = (RING_SIZE - RING_STROKE) / 2;
  const RING_C = 2 * Math.PI * RING_R;
  const pctElapsed = Math.min(1, Math.max(0, 1 - remainingSec / Math.max(1, totalSec)));

  return (
    <Svg width={RING_SIZE} height={RING_SIZE} style={{ transform: [{ rotate: "-90deg" }] }}>
      <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R} fill="none" stroke={TOKENS.surface2} strokeWidth={RING_STROKE} />
      <Circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_R}
        fill="none"
        stroke={finished ? TOKENS.primaryDark : color}
        strokeWidth={RING_STROKE}
        strokeLinecap="round"
        strokeDasharray={RING_C}
        strokeDashoffset={RING_C * (1 - pctElapsed)}
      />
    </Svg>
  );
}

function formatCountdown(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;

  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function addMinutes(start: string, minutes: number) {
  const [hours, mins] = start.split(":").map(Number);
  const total = hours * 60 + mins + minutes;
  const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

function todayIsoDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
