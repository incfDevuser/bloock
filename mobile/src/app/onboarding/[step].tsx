import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { Redirect, router, useLocalSearchParams } from "expo-router";

import { OnboardingShell } from "@/components/onboarding-shell";
import {
  buildOnboardingSetup,
  formatBlockSummary,
  getNextStep,
  getPreviousStep,
  getStepIndex,
  isValidTime,
  onboardingStepMeta,
  onboardingSteps,
  type OnboardingStep,
} from "@/lib/onboarding";
import { useOnboarding } from "@/providers/onboarding-provider";
import { supabase } from "../../../utils/supabase";

function isStep(value: string | string[] | undefined): value is OnboardingStep {
  return typeof value === "string" && onboardingSteps.includes(value as OnboardingStep);
}

export default function OnboardingStepScreen() {
  const params = useLocalSearchParams<{ step?: string }>();
  const step = params.step;
  const { hydrated, completed, draft, patchDraft, completeOnboarding, blocks } = useOnboarding();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const currentStep = isStep(step) ? step : null;

  useEffect(() => {
    if (hydrated && completed) {
      router.replace("/home");
    }
  }, [completed, hydrated]);

  const progress = useMemo(() => {
    if (!currentStep) {
      return 0;
    }

    return Math.round((getStepIndex(currentStep) / onboardingSteps.length) * 100);
  }, [currentStep]);

  if (!hydrated) {
    return <View className="flex-1" />;
  }

  if (!currentStep) {
    return <Redirect href="/onboarding/name" />;
  }

  const meta = onboardingStepMeta[currentStep];
  const previousStep = getPreviousStep(currentStep);
  const nextStep = getNextStep(currentStep);

  const goBack = () => {
    if (previousStep) {
      router.push(`/onboarding/${previousStep}`);
      return;
    }

    router.replace("/");
  };

  const goNext = async () => {
    setError(null);

    if (currentStep === "name" && draft.name.trim().length < 2) {
      setError("Escribí tu nombre.");
      return;
    }

    if (currentStep === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      setError("Poné un correo válido.");
      return;
    }

    if (currentStep === "password" && draft.password.trim().length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (currentStep === "day-start" && !isValidTime(draft.dayStart)) {
      setError("Usá formato HH:MM.");
      return;
    }

    if (currentStep === "day-end" && !isValidTime(draft.dayEnd)) {
      setError("Usá formato HH:MM.");
      return;
    }

    if (currentStep === "day-end" && isEndBeforeOrEqualStart(draft.dayStart, draft.dayEnd)) {
      setError("La hora de cierre debe ser después de la de inicio.");
      return;
    }

    if (currentStep === "review") {
      setBusy(true);

      try {
        const signupResult = await supabase.auth.signUp({
          email: draft.email.trim(),
          password: draft.password,
          options: {
            data: {
              displayName: draft.name.trim(),
              name: draft.name.trim(),
            },
          },
        });

        if (signupResult.error) {
          setError(signupResult.error.message);
          return;
        }

        const session = signupResult.data.session ?? (await supabase.auth.getSession()).data.session;

        if (!session?.user.id) {
          setError("Tu cuenta se creó, pero necesitas confirmar el correo para seguir.");
          return;
        }

        const userId = session.user.id;
        const email = session.user.email ?? draft.email.trim();
        const { dayConfig, blocks: fixedBlocks } = buildOnboardingSetup(draft);

        const { error: userError } = await supabase.from("users").upsert(
          {
            id: userId,
            email,
            name: draft.name.trim(),
          },
          { onConflict: "id" },
        );

        if (userError) {
          setError(userError.message);
          return;
        }

        const { data: dayConfigRow, error: dayConfigError } = await supabase
          .from("day_configs")
          .insert({
            user_id: userId,
            ...dayConfig,
          })
          .select("id")
          .single();

        if (dayConfigError) {
          setError(dayConfigError.message);
          return;
        }

        if (fixedBlocks.length) {
          const { error: blocksError } = await supabase.from("blocks").insert(
            fixedBlocks.map((block) => ({
              user_id: userId,
              day_config_id: dayConfigRow.id,
              ...block,
            })),
          );

          if (blocksError) {
            setError(blocksError.message);
            return;
          }
        }

        await completeOnboarding();
        router.replace("/home");
      } finally {
        setBusy(false);
      }
      return;
    }

    if (nextStep) {
      router.push(`/onboarding/${nextStep}`);
    }
  };

  return (
    <OnboardingShell
      eyebrow={meta.eyebrow}
      title={meta.title}
      helper={meta.helper}
      progress={progress}
      onBack={goBack}
      footer={
        <Pressable
          onPress={goNext}
          disabled={busy}
          className={`items-center rounded-full bg-lime-300 px-6 py-4 shadow-sm shadow-lime-300/30 ${busy ? "opacity-70" : ""}`}>
          <Text className="font-bodyMedium text-[16px] text-ink">
            {busy ? "Creando..." : currentStep === "review" ? "Crear usuario y entrar" : "Seguir"}
          </Text>
        </Pressable>
      }>
      {currentStep === "name" ? (
        <TextInput
          value={draft.name}
          onChangeText={(value) => patchDraft((current) => ({ ...current, name: value }))}
          placeholder="Tu nombre"
          placeholderTextColor="#8a8a8a"
          className="rounded-2xl border border-lime-200 px-4 py-4 font-body text-[16px] text-ink"
        />
      ) : null}

      {currentStep === "email" ? (
        <TextInput
          value={draft.email}
          onChangeText={(value) => patchDraft((current) => ({ ...current, email: value }))}
          placeholder="tu@email.com"
          placeholderTextColor="#8a8a8a"
          autoCapitalize="none"
          keyboardType="email-address"
          className="rounded-2xl border border-lime-200 px-4 py-4 font-body text-[16px] text-ink"
        />
      ) : null}

      {currentStep === "password" ? (
        <TextInput
          value={draft.password}
          onChangeText={(value) => patchDraft((current) => ({ ...current, password: value }))}
          placeholder="Mínimo 6 caracteres"
          placeholderTextColor="#8a8a8a"
          secureTextEntry
          autoComplete="password"
          className="rounded-2xl border border-lime-200 px-4 py-4 font-body text-[16px] text-ink"
        />
      ) : null}

      {currentStep === "day-start" || currentStep === "day-end" ? (
        <View className="gap-3">
          <TextInput
            value={currentStep === "day-start" ? draft.dayStart : draft.dayEnd}
            onChangeText={(value) =>
              patchDraft((current) =>
                currentStep === "day-start" ? { ...current, dayStart: value } : { ...current, dayEnd: value },
              )
            }
            placeholder="08:00"
            placeholderTextColor="#8a8a8a"
            keyboardType="numbers-and-punctuation"
            className="rounded-2xl border border-lime-20 px-4 py-4 font-mono text-[18px] text-ink"
          />
          <Text className="font-body text-[13px] text-black/45">Formato sugerido: 08:00</Text>
        </View>
      ) : null}

      {currentStep === "weekdays" ? (
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => patchDraft((current) => ({ ...current, weekdays: true }))}
            className={`flex-1 rounded-2xl px-4 py-4 ${draft.weekdays ? "bg-lime-300" : "bg-black/5"}`}>
            <Text className={`text-center font-bodyMedium text-[16px] ${draft.weekdays ? "text-ink" : "text-black/65"}`}>
              Sí
            </Text>
          </Pressable>
          <Pressable
            onPress={() => patchDraft((current) => ({ ...current, weekdays: false }))}
            className={`flex-1 rounded-2xl px-4 py-4 ${!draft.weekdays ? "bg-lime-300" : "bg-black/5"}`}>
            <Text className={`text-center font-bodyMedium text-[16px] ${!draft.weekdays ? "text-ink" : "text-black/65"}`}>
              No
            </Text>
          </Pressable>
        </View>
      ) : null}

      {currentStep === "meals" ? (
        <View className="gap-3">
          <MealCard
            label="Desayuno"
            config={draft.breakfast}
            onToggle={(enabled) => patchDraft((current) => ({ ...current, breakfast: { ...current.breakfast, enabled } }))}
            onTimeChange={(time) => patchDraft((current) => ({ ...current, breakfast: { ...current.breakfast, time } }))}
            onDurationChange={(durationMinutes) =>
              patchDraft((current) => ({ ...current, breakfast: { ...current.breakfast, durationMinutes } }))
            }
          />
          <MealCard
            label="Almuerzo"
            config={draft.lunch}
            onToggle={(enabled) => patchDraft((current) => ({ ...current, lunch: { ...current.lunch, enabled } }))}
            onTimeChange={(time) => patchDraft((current) => ({ ...current, lunch: { ...current.lunch, time } }))}
            onDurationChange={(durationMinutes) =>
              patchDraft((current) => ({ ...current, lunch: { ...current.lunch, durationMinutes } }))
            }
          />
          <MealCard
            label="Cena"
            config={draft.dinner}
            onToggle={(enabled) => patchDraft((current) => ({ ...current, dinner: { ...current.dinner, enabled } }))}
            onTimeChange={(time) => patchDraft((current) => ({ ...current, dinner: { ...current.dinner, time } }))}
            onDurationChange={(durationMinutes) =>
              patchDraft((current) => ({ ...current, dinner: { ...current.dinner, durationMinutes } }))
            }
          />
        </View>
      ) : null}

      {currentStep === "sport" ? (
        <View className="gap-4">
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => patchDraft((current) => ({ ...current, sport: { ...current.sport, enabled: true } }))}
              className={`flex-1 rounded-2xl px-4 py-4 ${draft.sport.enabled ? "bg-lime-300" : "bg-black/5"}`}>
              <Text className={`text-center font-bodyMedium text-[16px] ${draft.sport.enabled ? "text-ink" : "text-black/65"}`}>
                Sí
              </Text>
            </Pressable>
            <Pressable
              onPress={() => patchDraft((current) => ({ ...current, sport: { ...current.sport, enabled: false } }))}
              className={`flex-1 rounded-2xl px-4 py-4 ${!draft.sport.enabled ? "bg-lime-300" : "bg-black/5"}`}>
              <Text className={`text-center font-bodyMedium text-[16px] ${!draft.sport.enabled ? "text-ink" : "text-black/65"}`}>
                No
              </Text>
            </Pressable>
          </View>

          {draft.sport.enabled ? (
            <View className="gap-3">
              <TextInput
                value={draft.sport.time}
                onChangeText={(time) =>
                  patchDraft((current) => ({ ...current, sport: { ...current.sport, time } }))
                }
                placeholder="18:00"
                placeholderTextColor="#8a8a8a"
                keyboardType="numbers-and-punctuation"
                className="rounded-2xl border border-lime-200 px-4 py-4 font-mono text-[18px] text-ink"
              />
              <TextInput
                value={String(draft.sport.durationMinutes)}
                onChangeText={(value) =>
                  patchDraft((current) => ({
                    ...current,
                    sport: { ...current.sport, durationMinutes: Number.parseInt(value || "0", 10) || 0 },
                  }))
                }
                placeholder="60"
                placeholderTextColor="#8a8a8a"
                keyboardType="number-pad"
                className="rounded-2xl border border-lime-200 px-4 py-4 font-mono text-[18px] text-ink"
              />
            </View>
          ) : null}
        </View>
      ) : null}

      {currentStep === "review" ? (
        <View className="gap-4">
          <SummaryRow label="Nombre" value={draft.name || "Sin nombre"} />
          <SummaryRow label="Correo" value={draft.email || "Sin correo"} />
          <SummaryRow label="Contraseña" value={draft.password ? "••••••••" : "Sin contraseña"} />
          <SummaryRow label="Día" value={`${draft.dayStart} → ${draft.dayEnd}`} />
          <SummaryRow label="Lunes a viernes" value={draft.weekdays ? "Sí" : "No"} />

          <View className="mt-2 rounded-2xl bg-black/3 p-3">
            <Text className="font-bodyMedium text-[14px] text-black/75">Bloques fijos</Text>
            <View className="mt-3 gap-2">
              {blocks.length ? (
                blocks.map((block) => (
                  <View key={block.key} className="rounded-2xl bg-white px-4 py-3">
                    <Text className="font-bodyMedium text-[15px] text-ink">{block.label}</Text>
                    <Text className="mt-1 font-mono text-[12px] text-black/45">
                      {formatBlockSummary(block)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="font-body text-[14px] text-black/45">Todavía no hay bloques fijos.</Text>
              )}
            </View>
          </View>
        </View>
      ) : null}

      {error ? <Text className="mt-4 font-body text-[13px] text-red-500">{error}</Text> : null}
    </OnboardingShell>
  );
}

function MealCard({
  label,
  config,
  onToggle,
  onTimeChange,
  onDurationChange,
}: {
  label: string;
  config: { enabled: boolean; time: string; durationMinutes: number };
  onToggle: (enabled: boolean) => void;
  onTimeChange: (time: string) => void;
  onDurationChange: (durationMinutes: number) => void;
}) {
  return (
    <View
      className={`overflow-hidden rounded-[28px] border bg-white ${config.enabled ? "border-lime-300/70" : "border-black/10"}`}
      style={{
        shadowColor: "#000",
        shadowOpacity: config.enabled ? 0.08 : 0.04,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 1,
      }}>
      <View className={`h-1.5 ${config.enabled ? "bg-lime-300" : "bg-black/10"}`} />

      <View className="p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <View className={`h-2.5 w-2.5 rounded-full ${config.enabled ? "bg-lime-300" : "bg-black/20"}`} />
              <Text className="font-bodyMedium text-[17px] text-ink">{label}</Text>
            </View>
            <Text className="mt-2 max-w-[220px] font-body text-[13px] leading-5 text-black/45">
              {label === "Desayuno"
                ? "Arranca liviano y temprano."
                : label === "Almuerzo"
                  ? "Pausa central para resetear."
                  : "Cierre del día con un bloque fijo."}
            </Text>
          </View>

          <Pressable
            onPress={() => onToggle(!config.enabled)}
            className={`rounded-full px-3 py-2.5 ${config.enabled ? "bg-lime-300" : "bg-black/[0.04]"}`}>
            <Text className="font-bodyMedium text-[12px] uppercase tracking-[0.14em] text-ink">
              {config.enabled ? "Activo" : "Inactivo"}
            </Text>
          </Pressable>
        </View>

        {config.enabled ? (
          <View className="mt-4 gap-3">
            <View className="flex-row gap-3">
              <View className="flex-1 gap-2">
                <Text className="font-bodyMedium text-[11px] uppercase tracking-[0.16em] text-black/40">
                  Hora
                </Text>
                <TextInput
                  value={config.time}
                  onChangeText={onTimeChange}
                  placeholder="08:00"
                  placeholderTextColor="#8a8a8a"
                  keyboardType="numbers-and-punctuation"
                  className="rounded-[20px] border border-black/10 bg-black/[0.03] px-4 py-4 font-mono text-[16px] text-ink"
                />
              </View>

              <View className="w-[120px] gap-2">
                <Text className="font-bodyMedium text-[11px] uppercase tracking-[0.16em] text-black/40">
                  Duración
                </Text>
                <TextInput
                  value={String(config.durationMinutes)}
                  onChangeText={(value) => onDurationChange(Number.parseInt(value || "0", 10) || 0)}
                  placeholder="30"
                  placeholderTextColor="#8a8a8a"
                  keyboardType="number-pad"
                  className="rounded-[20px] border border-black/10 bg-black/[0.03] px-4 py-4 font-mono text-[16px] text-ink"
                />
              </View>
            </View>

            <View className="flex-row items-center justify-between rounded-[20px] bg-black/[0.03] px-4 py-3">
              <Text className="font-body text-[13px] text-black/50">Vista previa</Text>
              <Text className="font-mono text-[13px] text-ink">
                {config.time} · {formatDurationLabel(config.durationMinutes)}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between rounded-2xl bg-black/[0.03] px-4 py-3">
      <Text className="font-body text-[13px] uppercase tracking-[0.16em] text-black/45">{label}</Text>
      <Text className="ml-4 flex-1 text-right font-bodyMedium text-[15px] text-ink">{value}</Text>
    </View>
  );
}

function isEndBeforeOrEqualStart(start: string, end: string) {
  return timeToMinutes(end) <= timeToMinutes(start);
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatDurationLabel(minutes: number) {
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `${hours} h` : `${hours} h ${remainder} min`;
}
