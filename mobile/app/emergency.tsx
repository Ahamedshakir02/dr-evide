import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MapPin, Phone, TriangleAlert } from "lucide-react-native";
import { color, font, radius, space, text } from "../src/theme";

/**
 * Emergency interrupt — Dr Evide.dc.html screen 04 (lines 409-458).
 *
 * Reached only when the router trips a red flag. It is an interrupt, not a
 * destination: it owns the whole field and the back gesture is disabled in
 * _layout.tsx, so there is no doctor list behind it to browse instead.
 *
 * `flag` is the matched red-flag keyword only — the typed symptom text never
 * leaves the previous screen. It is sensitive personal data under the DPDP
 * Act 2023.
 */
export default function EmergencyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ flag?: string }>();
  const flag = (params.flag ?? "").trim().slice(0, 80);

  return (
    <View style={{ flex: 1, backgroundColor: color.emergency }}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <ScrollView contentContainerStyle={s.inner}>
          <View style={{ alignItems: "center", paddingTop: space[2] }}>
            <View style={s.disc}>
              <TriangleAlert size={52} color="#fff" strokeWidth={2} />
            </View>
            <Text style={s.eyebrow}>This could be an emergency</Text>
            {/* The one expressive element on this view. */}
            <Text style={s.title}>Don&apos;t wait —{"\n"}get help now</Text>
            <Text style={s.body}>
              {flag ? (
                <>
                  What you described — <Text style={s.bodyStrong}>{flag}</Text> — needs urgent
                  care, not an appointment.
                </>
              ) : (
                <>What you described needs urgent care, not an appointment.</>
              )}
            </Text>
          </View>

          <View style={{ flex: 1, minHeight: space[8] }} />

          {/* CALL 108 */}
          <Pressable
            onPress={() => Linking.openURL("tel:108")}
            accessibilityRole="button"
            accessibilityLabel="Call 108, free ambulance"
            style={({ pressed }) => [s.callCard, pressed && { opacity: 0.92 }]}
          >
            <View style={s.callDisc}>
              <Phone size={30} color="#fff" />
            </View>
            <View>
              <Text style={s.callNum}>Call 108</Text>
              <Text style={s.callSub}>Free ambulance · 24×7 Kerala</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() =>
              Linking.openURL("https://www.google.com/maps/search/?api=1&query=emergency+hospital")
            }
            style={({ pressed }) => [s.outline, pressed && { opacity: 0.85 }]}
          >
            <MapPin size={20} color="#fff" />
            <Text style={s.outlineText}>Nearest emergency room</Text>
          </Pressable>

          <View style={{ alignItems: "center", marginTop: space[4] }}>
            <Pressable
              onPress={() => router.replace({ pathname: "/results", params: { specialty: "general" } })}
            >
              <Text style={s.dismiss}>This isn&apos;t an emergency — continue anyway</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  inner: { flexGrow: 1, paddingHorizontal: 26, paddingTop: 28, paddingBottom: 26 },
  disc: {
    width: 96,
    height: 96,
    marginBottom: 22,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontFamily: font.bodySemibold,
    fontSize: 13,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.85)",
    marginBottom: space[3],
    textAlign: "center",
  },
  title: {
    fontFamily: font.displayCaps,
    textTransform: "uppercase",
    fontSize: 52,
    lineHeight: 50,
    color: "#fff",
    textAlign: "center",
    marginBottom: 18,
  },
  body: {
    fontFamily: font.body,
    fontSize: 17,
    lineHeight: 26,
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
    maxWidth: 320,
  },
  bodyStrong: { fontFamily: font.bodySemibold, color: "#fff" },
  callCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  callDisc: {
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: color.emergency,
    alignItems: "center",
    justifyContent: "center",
  },
  callNum: {
    fontFamily: font.displayCaps,
    textTransform: "uppercase",
    fontSize: 34,
    lineHeight: 36,
    color: color.emergency,
  },
  callSub: {
    fontFamily: font.bodySemibold,
    fontSize: text.sm,
    color: color.textMuted,
    marginTop: 3,
  },
  outline: {
    marginTop: 14,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  outlineText: { fontFamily: font.bodySemibold, fontSize: text.base, color: "#fff" },
  dismiss: {
    fontFamily: font.body,
    fontSize: text.sm,
    color: "rgba(255,255,255,0.8)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.4)",
    paddingBottom: 2,
  },
});
