import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronDown, MapPin, Pencil, ShieldCheck } from "lucide-react-native";
import { SPECIALTIES } from "@dr-evide/core";
import { routeSymptom } from "../src/lib/api";
import type { RoutingResult, SpecialtySlug } from "@dr-evide/core";
import { SpecialtyIcon } from "../src/components/SpecialtyIcon";
import { Button, Card, Eyebrow } from "../src/components/ui";
import { color, font, radius, space, text } from "../src/theme";

/** Home — Dr Evide.dc.html screen 01 (lines 40-147). */
export default function HomeScreen() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [routing, setRouting] = useState<RoutingResult | null>(null);

  async function handleFind() {
    setLoading(true);
    setRouting(null);
    try {
      const result = await routeSymptom(value);

      if (result.emergency) {
        // Only the matched red-flag keyword is passed on — never the typed
        // symptom text, which is sensitive personal data under the DPDP Act.
        router.push({
          pathname: "/emergency",
          params: { flag: result.matched_conditions[0] ?? "" },
        });
        return;
      }

      setRouting(result);
      if (result.specialties.length === 1) {
        goToResults(result.specialties[0].slug, result.matched_conditions);
      }
    } finally {
      setLoading(false);
    }
  }

  function goToResults(specialty: SpecialtySlug | string, conditions: string[] = []) {
    router.push({
      pathname: "/results",
      params: { specialty, conditions: conditions.join(",") },
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: space[8] }} keyboardShouldPersistTaps="handled">
        {/* top bar */}
        <View style={s.topbar}>
          <View>
            <Text style={s.wordmark}>Dr Evide</Text>
            <Text style={s.wordmarkMl}>ഡോക്ടർ എവിടെ?</Text>
          </View>
          <View style={s.locationTag}>
            <MapPin size={16} color={color.text} />
            <Text style={s.locationText}>Edappal</Text>
            <ChevronDown size={14} color={color.text} />
          </View>
        </View>

        {/* hero */}
        <View style={{ paddingHorizontal: 22, paddingTop: space[4] }}>
          <Text style={s.h1}>What&apos;s bothering you?</Text>
          <Text style={s.lede}>
            Tell us in your own words. We&apos;ll find the right kind of doctor.
          </Text>

          <TextInput
            style={s.textarea}
            placeholder="e.g. My hair is falling a lot lately…"
            placeholderTextColor={color.textFaint}
            multiline
            numberOfLines={3}
            maxLength={500}
            value={value}
            onChangeText={setValue}
            textAlignVertical="top"
          />

          <View style={s.hintRow}>
            <Pencil size={15} color={color.textFaint} />
            <Text style={s.hintText}>Malayalam &amp; English both work</Text>
          </View>

          <Button
            label={loading ? "Finding…" : "Find the right doctor"}
            onPress={handleFind}
            disabled={loading || value.trim().length < 3}
            icon={loading ? <ActivityIndicator color="#fff" /> : undefined}
            style={{ height: 58, borderRadius: radius.lg }}
          />

          {/* ambiguous routing — let them choose */}
          {routing && routing.specialties.length > 1 && (
            <Card style={{ marginTop: space[4] }}>
              <Eyebrow style={{ marginBottom: space[3] }}>
                This could be one of two departments
              </Eyebrow>
              <View style={{ gap: space[3] }}>
                {routing.specialties.map((sp) => (
                  <Pressable
                    key={sp.slug}
                    onPress={() => goToResults(sp.slug, routing.matched_conditions)}
                  >
                    <Text style={s.choiceName}>{SPECIALTIES[sp.slug].name}</Text>
                    <Text style={s.choiceReason}>{sp.reason}</Text>
                  </Pressable>
                ))}
              </View>
            </Card>
          )}
        </View>

        {/* divider */}
        <View style={s.dividerRow}>
          <View style={s.rule} />
          <Eyebrow>Or pick a department</Eyebrow>
          <View style={s.rule} />
        </View>

        {/* department grid */}
        <View style={s.grid}>
          {(Object.entries(SPECIALTIES) as [SpecialtySlug, (typeof SPECIALTIES)[SpecialtySlug]][]).map(
            ([slug, info]) => (
              <Card key={slug} style={s.tile} onPress={() => goToResults(slug)}>
                <View style={s.iconTile}>
                  <SpecialtyIcon name={info.icon} />
                </View>
                <Text style={s.tileName}>{info.tileLabel}</Text>
                <Text style={s.tileSub}>{info.name}</Text>
              </Card>
            )
          )}
        </View>

        {/* integrity note — a structural panel, so it stays sharp */}
        <View style={s.trustPanel}>
          <ShieldCheck size={22} color={color.accent2} />
          <Text style={s.trustText}>
            Doctors are ranked only by verified credentials and real reviews.{" "}
            <Text style={{ fontFamily: font.bodySemibold, color: color.text }}>
              No one can pay to rank higher.
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 6,
  },
  wordmark: { fontFamily: font.display, fontSize: 22, color: color.text, lineHeight: 26 },
  wordmarkMl: {
    fontFamily: font.malayalam,
    fontSize: 14,
    color: color.accentText,
    marginTop: 2,
  },
  locationTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
    height: 38,
    paddingHorizontal: space[3],
    borderRadius: radius.pill,
    backgroundColor: color.surface2,
    borderWidth: 1,
    borderColor: color.border,
  },
  locationText: { fontFamily: font.bodyMedium, fontSize: text.sm, color: color.text },
  h1: {
    fontFamily: font.display,
    fontSize: 32,
    lineHeight: 36,
    color: color.text,
    marginBottom: 6,
  },
  lede: { fontFamily: font.body, fontSize: text.base, color: color.textMuted, marginBottom: space[4] },
  textarea: {
    minHeight: 96,
    padding: space[4],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.borderStrong,
    backgroundColor: color.surface,
    fontFamily: font.body,
    fontSize: 17,
    lineHeight: 24,
    color: color.text,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
    marginVertical: space[3],
    marginHorizontal: 2,
  },
  hintText: { fontFamily: font.body, fontSize: 13, color: color.textFaint },
  choiceName: { fontFamily: font.display, fontSize: 17, color: color.accentText },
  choiceReason: {
    fontFamily: font.body,
    fontSize: 13,
    color: color.textMuted,
    lineHeight: 19,
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 22,
    paddingTop: space[6],
    paddingBottom: space[3],
  },
  rule: { flex: 1, height: 1, backgroundColor: color.border },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space[3],
    paddingHorizontal: 22,
  },
  tile: { width: "47.5%", gap: space[3], padding: space[4] },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: color.flare50,
    alignItems: "center",
    justifyContent: "center",
  },
  tileName: { fontFamily: font.display, fontSize: 17, color: color.text },
  tileSub: { fontFamily: font.body, fontSize: 13, color: color.textFaint },
  trustPanel: {
    flexDirection: "row",
    gap: space[3],
    alignItems: "flex-start",
    marginHorizontal: 22,
    marginTop: space[6],
    padding: space[4],
    backgroundColor: color.surface2,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.panel,
  },
  trustText: {
    flex: 1,
    fontFamily: font.body,
    fontSize: text.sm,
    color: color.textMuted,
    lineHeight: 21,
  },
});
