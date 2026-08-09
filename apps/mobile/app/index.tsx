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
import { Pencil, ShieldCheck } from "lucide-react-native";
import { SPECIALTIES, specialtyText } from "@dr-evide/core";
import { routeSymptom } from "../src/lib/api";
import type { RoutingResult, SpecialtySlug } from "@dr-evide/core";
import { SpecialtyIcon } from "../src/components/SpecialtyIcon";
import { LanguageToggle } from "../src/components/LanguageToggle";
import { Button, Card, Eyebrow } from "../src/components/ui";
import { useLang } from "../src/lib/lang";
import { color, font, radius, space, text } from "../src/theme";

/** Home — Dr Evide.dc.html screen 01 (lines 40-147). */
export default function HomeScreen() {
  const router = useRouter();
  const { lang, t } = useLang();
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
          {/* The lockup yields the width, never the control. Without this the
              row squeezed the toggle instead: "English" rendered as "Englis"
              with the h cut off, on the control whose job is to let someone
              who cannot read the current language get out of it. */}
          <View style={s.brand}>
            <Text style={s.wordmark}>Dr Evide</Text>
            <Text style={s.wordmarkMl}>ഡോക്ടർ എവിടെ?</Text>
          </View>
          {/* This space held a static "Edappal ⌄" tag: a plain View with a
              dropdown chevron and no handler, so it advertised a location
              picker that did not exist. The real location is asked for on the
              results screen, which is where it changes what you see, and the
              space now holds a control that does something. */}
          <LanguageToggle />
        </View>

        {/* hero */}
        <View style={{ paddingHorizontal: 22, paddingTop: space[4] }}>
          <Text style={[s.h1, lang === "ml" && s.h1Ml]}>{t.symptomLabel}</Text>
          <Text style={[s.lede, lang === "ml" && s.ledeMl]}>{t.homeSub}</Text>

          <TextInput
            style={[s.textarea, lang === "ml" && s.textareaMl]}
            placeholder={t.symptomPlaceholder}
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
            <Text style={[s.hintText, lang === "ml" && s.hintTextMl]}>{t.bilingualHint}</Text>
          </View>

          <Button
            label={loading ? t.finding : t.findDoctor}
            onPress={handleFind}
            disabled={loading || value.trim().length < 3}
            icon={loading ? <ActivityIndicator color="#fff" /> : undefined}
            style={{ height: 58, borderRadius: radius.lg }}
          />

          {/* ambiguous routing — let them choose */}
          {routing && routing.specialties.length > 1 && (
            <Card style={{ marginTop: space[4] }}>
              <Eyebrow style={{ marginBottom: space[3] }}>{t.ambiguousHeading}</Eyebrow>
              <View style={{ gap: space[3] }}>
                {routing.specialties.map((sp) => (
                  <Pressable
                    key={sp.slug}
                    onPress={() => goToResults(sp.slug, routing.matched_conditions)}
                  >
                    <Text style={[s.choiceName, lang === "ml" && s.choiceNameMl]}>
                      {specialtyText(sp.slug, lang).name}
                    </Text>
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
          <Eyebrow>{t.orPickDepartment}</Eyebrow>
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
                {/* specialtyText() rather than info.tileLabel — the Malayalam
                    department names were already in the taxonomy, and the app
                    was reading straight past them to the English fields. */}
                <Text style={[s.tileName, lang === "ml" && s.tileNameMl]}>
                  {specialtyText(slug, lang).tileLabel}
                </Text>
                <Text style={[s.tileSub, lang === "ml" && s.tileSubMl]}>
                  {specialtyText(slug, lang).name}
                </Text>
              </Card>
            )
          )}
        </View>

        {/* integrity note — a structural panel, so it stays sharp */}
        <View style={s.trustPanel}>
          <ShieldCheck size={22} color={color.accent2} />
          <Text style={[s.trustText, lang === "ml" && s.trustTextMl]}>
            {t.trustScoreBlurb}{" "}
            <Text
              style={[
                { fontFamily: font.bodySemibold, color: color.text },
                lang === "ml" && { fontFamily: font.malayalam },
              ]}
            >
              {t.noPaidPlacement}
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
    gap: space[3],
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 6,
  },
  brand: { flexShrink: 1 },
  wordmark: { fontFamily: font.display, fontSize: 22, color: color.text, lineHeight: 26 },
  wordmarkMl: {
    fontFamily: font.malayalam,
    fontSize: 14,
    /**
     * Malayalam stacks vowel signs above and below the baseline, and a line
     * box sized for Latin at 14px clips them — this line lost its descenders
     * to the row below it. Same reason every other Malayalam style in this
     * app names a line height.
     */
    lineHeight: 22,
    color: color.accentText,
    marginTop: 2,
  },
  h1: {
    fontFamily: font.display,
    fontSize: 32,
    lineHeight: 36,
    color: color.text,
    marginBottom: 6,
  },
  /**
   * Malayalam overrides, applied per-string rather than by swapping the whole
   * stylesheet.
   *
   * Clash Display and General Sans carry no Malayalam glyphs, so every style
   * that names them has to name Noto Sans Malayalam instead or the text
   * renders as boxes. The sizes step down a little because Malayalam sets
   * taller than Latin at the same point size, and its line heights step up:
   * the script stacks vowel signs above and below the baseline, and the Latin
   * line heights clip them.
   */
  h1Ml: { fontFamily: font.malayalam, fontSize: 26, lineHeight: 40 },
  lede: { fontFamily: font.body, fontSize: text.base, color: color.textMuted, marginBottom: space[4] },
  ledeMl: { fontFamily: font.malayalam, fontSize: 14, lineHeight: 26 },
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
  textareaMl: { fontFamily: font.malayalam, fontSize: 15, lineHeight: 26 },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
    marginVertical: space[3],
    marginHorizontal: 2,
  },
  hintText: { fontFamily: font.body, fontSize: 13, color: color.textFaint },
  hintTextMl: { fontFamily: font.malayalam, fontSize: 12, lineHeight: 20 },
  choiceName: { fontFamily: font.display, fontSize: 17, color: color.accentText },
  choiceNameMl: { fontFamily: font.malayalam, fontSize: 15, lineHeight: 26 },
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
  tileNameMl: { fontFamily: font.malayalam, fontSize: 14, lineHeight: 24 },
  tileSub: { fontFamily: font.body, fontSize: 13, color: color.textFaint },
  tileSubMl: { fontFamily: font.malayalam, fontSize: 11, lineHeight: 20 },
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
  trustTextMl: { fontFamily: font.malayalam, fontSize: 13, lineHeight: 24 },
});
