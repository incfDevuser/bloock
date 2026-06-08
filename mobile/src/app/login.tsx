import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { router } from "expo-router";

import { OnboardingShell } from "@/components/onboarding-shell";
import { useOnboarding } from "@/providers/onboarding-provider";
import { supabase } from "../../utils/supabase";

export default function LoginScreen() {
  const { hydrated, completed, completeOnboarding } = useOnboarding();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (hydrated && completed) {
      router.replace("/home");
    }
  }, [completed, hydrated]);

  const submit = async () => {
    setError(null);

    const normalizedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Poné un correo válido.");
      return;
    }

    if (!password.trim()) {
      setError("Escribí tu contraseña.");
      return;
    }

    setBusy(true);
    try {
      const result = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (result.error) {
        setError(result.error.message);
        return;
      }

      if (!result.data.session) {
        setError("No pudimos iniciar sesión.");
        return;
      }

      await completeOnboarding();
      router.replace("/home");
    } finally {
      setBusy(false);
    }
  };

  if (!hydrated) {
    return <View className="flex-1" />;
  }

  return (
    <OnboardingShell
      eyebrow="Bienvenido"
      title="Ingresá a Block"
      helper="Usá el correo y la contraseña de tu cuenta."
      progress={100}
      onBack={() => router.replace("/")}
      footer={
        <Pressable
          onPress={submit}
          disabled={busy}
          className={`items-center rounded-full bg-lime-300 px-6 py-4 shadow-sm shadow-lime-300/30 ${busy ? "opacity-70" : ""}`}>
          <Text className="font-bodyMedium text-[16px] text-ink">{busy ? "Entrando..." : "Iniciar sesión"}</Text>
        </Pressable>
      }>
      <View className="gap-4">
        <View className="gap-2">
          <Text className="font-mono text-[11px] uppercase tracking-[0.22em] text-black/40">Correo</Text>
          <TextInput
            value={email}
            onChangeText={(value) => setEmail(value)}
            placeholder="tu@email.com"
            placeholderTextColor="#8a8a8a"
            autoCapitalize="none"
            keyboardType="email-address"
            className="rounded-2xl border border-lime-200 px-4 py-4 font-body text-[16px] text-ink"
          />
        </View>

        <View className="gap-2">
          <Text className="font-mono text-[11px] uppercase tracking-[0.22em] text-black/40">Contraseña</Text>
          <TextInput
            value={password}
            onChangeText={(value) => setPassword(value)}
            placeholder="Tu contraseña"
            placeholderTextColor="#8a8a8a"
            secureTextEntry
            autoComplete="password"
            className="rounded-2xl border border-lime-200 px-4 py-4 font-body text-[16px] text-ink"
          />
        </View>

        {error ? <Text className="font-body text-[13px] text-red-500">{error}</Text> : null}
      </View>
    </OnboardingShell>
  );
}
