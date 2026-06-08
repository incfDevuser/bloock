import { useEffect, useMemo, useState } from "react";
import {
  Animated,
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

import { PriorityDot } from "@/components/priority-dot";
import { TaskCheck } from "@/components/task-check";
import { TOKENS, fmtDuration, type DemoBlock, type DemoTask } from "@/lib/block-demo";

type BlockSheetProps = {
  block: DemoBlock | null;
  onClose: () => void;
  onUpdateBlock: (blockId: string, patch: { name: string; type: keyof typeof TOKENS.blocks; start: string; end: string }) => Promise<boolean | void> | boolean | void;
  onToggleTask: (blockId: string, taskId: string) => Promise<void> | void;
  onAddTask: (blockId: string, text: string) => Promise<void> | void;
  onDeleteBlock: (blockId: string) => void;
};

export function BlockSheet({ block, onClose, onUpdateBlock, onToggleTask, onAddTask, onDeleteBlock }: BlockSheetProps) {
  const [sheetProgress] = useState(() => new Animated.Value(0));
  const insets = useSafeAreaInsets();

  const meta = block ? TOKENS.blocks[block.type] : null;

  useEffect(() => {
    if (block) {
      Animated.timing(sheetProgress, { toValue: 1, duration: 280, useNativeDriver: true }).start();
    } else {
      sheetProgress.setValue(0);
    }
  }, [block, sheetProgress]);

  const close = () => {
    Animated.timing(sheetProgress, { toValue: 0, duration: 220, useNativeDriver: true }).start(({ finished }) => {
      if (finished) onClose();
    });
  };

  if (!block || !meta) {
    return null;
  }

  return (
    <Modal transparent statusBarTranslucent visible animationType="none" onRequestClose={close}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Animated.View
            className="absolute inset-0 bg-black"
            style={{ opacity: sheetProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }) }}>
            <Pressable className="flex-1" onPress={close} />
          </Animated.View>

          <Animated.View
            className="rounded-t-[24px] bg-white px-0 pt-3"
            style={{
              maxHeight: "74%",
              paddingBottom: 12 + insets.bottom,
              transform: [
                {
                  translateY: sheetProgress.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }),
                },
              ],
              opacity: sheetProgress,
            }}>
            <BlockSheetBody
              key={block.id}
              block={block}
              meta={meta}
              onClose={close}
              onUpdateBlock={onUpdateBlock}
              onToggleTask={onToggleTask}
              onAddTask={onAddTask}
              onDeleteBlock={onDeleteBlock}
            />
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function BlockSheetBody({
  block,
  meta,
  onClose,
  onUpdateBlock,
  onToggleTask,
  onAddTask,
  onDeleteBlock,
}: {
  block: DemoBlock;
  meta: (typeof TOKENS.blocks)[keyof typeof TOKENS.blocks];
  onClose: () => void;
  onUpdateBlock: (blockId: string, patch: { name: string; type: keyof typeof TOKENS.blocks; start: string; end: string }) => Promise<boolean | void> | boolean | void;
  onToggleTask: (blockId: string, taskId: string) => Promise<void> | void;
  onAddTask: (blockId: string, text: string) => Promise<void> | void;
  onDeleteBlock: (blockId: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(block.name);
  const [editType, setEditType] = useState<keyof typeof TOKENS.blocks>(block.type);
  const [editStart, setEditStart] = useState(block.start);
  const [editDuration, setEditDuration] = useState(fmtDuration(block.start, block.end));
  const completion = useMemo(() => {
    if (!block.tasks.length) return 0;
    return block.tasks.filter((task) => task.done).length / block.tasks.length;
  }, [block]);

  const submitTask = async () => {
    const value = draft.trim();
    if (value) {
      await Promise.resolve(onAddTask(block.id, value));
    }
    setDraft("");
    setAdding(false);
  };

  const saveBlock = async () => {
    const name = editName.trim();
    if (!name) return;

    const start = normalizeTime(editStart);
    const durationMinutes = parseDurationToMinutes(editDuration);
    if (!start || !durationMinutes || durationMinutes <= 0) return;

    const end = addMinutes(start, durationMinutes);
    const result = await Promise.resolve(onUpdateBlock(block.id, { name, type: editType, start, end }));
    if (result === false) return;
    setEditing(false);
  };

  return (
    <>
      <View className="items-center pb-3">
        <View className="h-1 w-10 rounded-full bg-black/15" />
      </View>

      <View className="px-5 pb-4">
        <View className="mb-2 flex-row items-center gap-2">
          <View className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.bg }} />
          <Text className="font-mono text-[12px] uppercase tracking-[0.2em] text-black/45">{meta.label}</Text>
        </View>
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 pr-2">
            {editing ? (
              <View className="gap-3">
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Nombre del bloque"
                  placeholderTextColor="#8a8a8a"
                  className="rounded-2xl border border-black/10 px-4 py-3 font-body text-[16px] text-ink"
                />
                <View className="flex-row flex-wrap gap-2">
                  {(Object.keys(TOKENS.blocks) as (keyof typeof TOKENS.blocks)[]).map((type) => {
                    const active = editType === type;
                    return (
                      <Pressable
                        key={type}
                        onPress={() => setEditType(type)}
                        className={`rounded-full border px-3 py-2 ${active ? "bg-black" : "bg-white"}`}
                        style={{ borderColor: active ? "#0F0F0F" : "rgba(15,15,15,0.12)" }}>
                        <Text className={`font-bodyMedium text-[13px] ${active ? "text-white" : "text-black/65"}`}>
                          {TOKENS.blocks[type].label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View className="flex-row gap-3">
                  <View className="flex-1 gap-2">
                    <Text className="font-mono text-[11px] uppercase tracking-[0.2em] text-black/40">Inicio</Text>
                    <TextInput
                      value={editStart}
                      onChangeText={setEditStart}
                      placeholder="08:00"
                      placeholderTextColor="#8a8a8a"
                      keyboardType="numbers-and-punctuation"
                      className="rounded-2xl border border-black/10 px-4 py-3 font-mono text-[15px] text-ink"
                    />
                  </View>
                  <View className="flex-1 gap-2">
                    <Text className="font-mono text-[11px] uppercase tracking-[0.2em] text-black/40">Duración</Text>
                    <TextInput
                      value={editDuration}
                      onChangeText={setEditDuration}
                      placeholder="1h"
                      placeholderTextColor="#8a8a8a"
                      keyboardType="numbers-and-punctuation"
                      className="rounded-2xl border border-black/10 px-4 py-3 font-mono text-[15px] text-ink"
                    />
                  </View>
                </View>
                <View className="flex-row gap-2">
                  <Pressable onPress={() => setEditing(false)} className="rounded-full bg-black/[0.05] px-4 py-2">
                    <Text className="font-bodyMedium text-[13px] text-black/55">Cancelar</Text>
                  </Pressable>
                  <Pressable onPress={saveBlock} className="rounded-full bg-lime-300 px-4 py-2">
                    <Text className="font-bodyMedium text-[13px] text-ink">Guardar</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
                <Text className="font-display text-[26px] leading-[1.05] tracking-[-0.04em] text-ink">{block.name}</Text>
                <Text className="mt-2 font-mono text-[12px] text-black/45">
                  {block.start}–{block.end} · {fmtDuration(block.start, block.end)}
                </Text>
              </>
            )}
          </View>

          <View className="gap-2">
            <Pressable onPress={() => setEditing((current) => !current)} className="rounded-full bg-black/[0.05] px-3 py-2 active:opacity-80">
              <Text className="font-body text-[13px] text-black/45">{editing ? "Ver" : "Editar"}</Text>
            </Pressable>
            <Pressable onPress={onClose} className="rounded-full bg-black/[0.05] px-3 py-2 active:opacity-80">
              <Text className="font-body text-[13px] text-black/45">Cerrar</Text>
            </Pressable>
          </View>
        </View>
        {block.tasks.length ? (
          <Text className="mt-2 font-body text-[13px] text-black/45">
            {block.tasks.filter((task) => task.done).length}/{block.tasks.length} tareas
          </Text>
        ) : null}
        {block.tasks.length ? (
          <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/5">
            <View className="h-full rounded-full" style={{ width: `${completion * 100}%`, backgroundColor: meta.bg }} />
          </View>
        ) : null}
      </View>

      <View className="px-5 pb-3">
        {adding ? (
          <View className="flex-row items-center gap-3 rounded-[12px] bg-black/[0.03] px-4 py-3">
            <View className="h-5 w-5 rounded-full border border-black/20 bg-white" />
            <TextInput
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={submitTask}
              onBlur={submitTask}
              placeholder="Nueva tarea…"
              placeholderTextColor="#8a8a8a"
              className="flex-1 font-body text-[15px] text-ink"
              autoFocus
            />
            <Pressable
              onPress={submitTask}
              disabled={!draft.trim()}
              className={`rounded-full px-3 py-2 ${draft.trim() ? "bg-ink" : "bg-black/10"}`}
              accessibilityRole="button"
              accessibilityLabel="Crear tarea">
              <Text className={`font-bodyMedium text-[13px] ${draft.trim() ? "text-white" : "text-black/35"}`}>Crear</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => setAdding(true)}
            className="flex-row items-center justify-center gap-2 rounded-[12px] border border-dashed border-black/15 bg-transparent py-4">
            <Text className="font-bodyMedium text-[18px] leading-none text-ink">+</Text>
            <Text className="font-body text-[14px] text-black/50">Agregar tarea</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        className="px-2"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="pb-6">
        {block.tasks.length === 0 && !adding ? (
          <View className="px-4 py-10">
            <Text className="text-center font-bodyMedium text-[16px] text-ink">Este bloque está libre.</Text>
            <Text className="mt-2 text-center font-body text-[14px] text-black/45">Agregá lo que necesites hacer aquí.</Text>
          </View>
        ) : null}

        {block.tasks.map((task) => (
          <TaskRow key={task.id} task={task} onToggle={() => void onToggleTask(block.id, task.id)} />
        ))}

        <Pressable
          onPress={() => onDeleteBlock(block.id)}
          className="mx-3 mt-4 items-center rounded-[12px] py-4"
          style={{ backgroundColor: "rgba(245, 82, 82, 0.12)" }}>
          <Text style={{ fontFamily: "DMSans_500Medium", fontSize: 14, color: "#E53935" }}>Eliminar bloque</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

function normalizeTime(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function parseDurationToMinutes(value: string) {
  const trimmed = value.trim().toLowerCase();
  const hoursMatch = trimmed.match(/^(\d+)\s*h(?:\s*(\d+)\s*min)?$/);
  if (hoursMatch) {
    return Number(hoursMatch[1]) * 60 + Number(hoursMatch[2] ?? 0);
  }

  const minutesMatch = trimmed.match(/^(\d+)\s*min$/);
  if (minutesMatch) {
    return Number(minutesMatch[1]);
  }

  const raw = Number(trimmed);
  return Number.isFinite(raw) ? raw : null;
}

function addMinutes(start: string, minutes: number) {
  const [hours, mins] = start.split(":").map(Number);
  const total = hours * 60 + mins + minutes;
  const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

function TaskRow({ task, onToggle }: { task: DemoTask; onToggle: () => void }) {
  return (
    <View className="flex-row items-center gap-3 px-4 py-3">
      <TaskCheck checked={task.done} onPress={onToggle} />
      <PriorityDot priority={task.priority} />
      <Text
        className={`flex-1 font-body text-[15px] leading-6 text-ink ${task.done ? "opacity-50 line-through" : ""}`}>
        {task.text}
      </Text>
    </View>
  );
}
