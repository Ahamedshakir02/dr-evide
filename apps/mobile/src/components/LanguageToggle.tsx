import { Pressable, StyleSheet, Text, View } from "react-native";
import { LANGS, LANG_LABELS } from "@dr-evide/core";
import { useLang } from "../lib/lang";
import { color, font, radius, space } from "../theme";

/**
 * Two buttons, not a picker.
 *
 * There are exactly two languages and both fit, same as the website's toggle.
 * Putting Malayalam inside a dropdown would place it one extra tap away from
 * the people who need it, on the screen where they decide whether this app is
 * for them.
 *
 * Each label is written in its own language - "English" and "മലയാളം" - because
 * someone who cannot read the current interface still has to be able to find
 * the way out of it. A label reading "Malayalam" in English is no help to the
 * person it is for.
 */
export function LanguageToggle() {
  const { lang, setLang, t } = useLang();

  return (
    <View style={s.wrap} accessibilityRole="radiogroup" accessibilityLabel={t.languageLabel}>
      {LANGS.map((l) => {
        const active = l === lang;
        return (
          <Pressable
            key={l}
            onPress={() => setLang(l)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={LANG_LABELS[l]}
            style={[s.btn, active && s.btnActive]}
          >
            <Text
              style={[
                s.label,
                // Malayalam needs its own face here too: General Sans carries
                // no Malayalam glyphs, so "മലയാളം" would render as boxes in
                // the control whose whole job is to offer Malayalam.
                l === "ml" && s.labelMl,
                active && s.labelActive,
              ]}
            >
              {LANG_LABELS[l]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    padding: 3,
    gap: 2,
    borderRadius: radius.pill,
    backgroundColor: color.surface2,
    borderWidth: 1,
    borderColor: color.border,
    /**
     * Never squeezed by whatever sits beside it. A row that ran out of width
     * took it from here first and truncated "English" to "Englis" — on the
     * one control a reader who cannot read the current language depends on.
     * The lockup beside it shrinks instead.
     */
    flexShrink: 0,
  },
  btn: {
    // 36px rather than the 44 a standalone target wants: the two halves sit
    // side by side, so the pair is comfortably over the minimum and a taller
    // control would crowd the wordmark beside it.
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: space[3],
    borderRadius: radius.pill,
  },
  btnActive: { backgroundColor: color.surface },
  label: { fontFamily: font.bodyMedium, fontSize: 13, color: color.textMuted },
  labelMl: { fontFamily: font.malayalam, fontSize: 12 },
  labelActive: { color: color.accentText, fontFamily: font.bodySemibold },
});
