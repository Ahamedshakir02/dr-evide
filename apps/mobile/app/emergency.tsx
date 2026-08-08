import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MapPin, Phone, TriangleAlert } from "lucide-react-native";
import { strings } from "@dr-evide/core";
import { color, font, radius, space, text } from "../src/theme";

/**
 * Both languages, always, on this screen only.
 *
 * The rest of the app can follow a language preference. This screen cannot
 * wait for one: it appears unannounced, at the moment a red flag fires, and
 * there is no reliable way to know which language the person holding the phone
 * reads most easily — a phone sold in Kerala reports en-IN regardless. Every
 * other screen in this product costs someone a translation when it guesses
 * wrong. This one costs them time they may not have.
 *
 * So the instruction is shown twice rather than chosen. It is the only screen
 * in either app that does this, and the extra height is worth it.
 */
const EN = strings("en");
const ML = strings("ml");

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
            <Text style={s.eyebrow}>{EN.couldBeEmergency}</Text>
            <Text style={[s.eyebrow, s.eyebrowMl]}>{ML.couldBeEmergency}</Text>
            {/* The one expressive element on this view. */}
            <Text style={s.title}>{EN.emergencyTitle}</Text>
            <Text style={s.titleMl}>{ML.emergencyTitle}</Text>
            <Text style={s.body}>
              {flag ? EN.emergencyBodyFlagged(flag) : EN.emergencyBody}
            </Text>
            <Text style={[s.body, s.bodyMl]}>
              {flag ? ML.emergencyBodyFlagged(flag) : ML.emergencyBody}
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
            <View style={{ flex: 1 }}>
              {/* "108" carries this row in either language, so the number stays
                  one line and only the sub-label is doubled. */}
              <Text style={s.callNum}>{EN.call} 108</Text>
              <Text style={s.callSub}>{EN.freeAmbulance}</Text>
              <Text style={[s.callSub, s.callSubMl]}>{ML.freeAmbulance}</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() =>
              Linking.openURL("https://www.google.com/maps/search/?api=1&query=emergency+hospital")
            }
            style={({ pressed }) => [s.outline, pressed && { opacity: 0.85 }]}
          >
            <MapPin size={20} color="#fff" />
            <View>
              <Text style={s.outlineText}>{EN.nearestEmergencyRoom}</Text>
              <Text style={[s.outlineText, s.outlineTextMl]}>{ML.nearestEmergencyRoom}</Text>
            </View>
          </Pressable>

          <View style={{ alignItems: "center", marginTop: space[4] }}>
            <Pressable
              onPress={() => router.replace({ pathname: "/results", params: { specialty: "general" } })}
            >
              <Text style={s.dismiss}>{EN.notAnEmergency}</Text>
              <Text style={[s.dismiss, s.dismissMl]}>{ML.notAnEmergency}</Text>
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
    marginBottom: space[1],
    textAlign: "center",
  },
  eyebrowMl: {
    fontFamily: font.malayalam,
    fontSize: 12,
    // Malayalam has no case, so the tracking that makes an English eyebrow
    // read as a label just pushes the glyphs apart.
    letterSpacing: 0,
    textTransform: "none",
    marginBottom: space[3],
  },
  title: {
    fontFamily: font.displayCaps,
    textTransform: "uppercase",
    fontSize: 44,
    lineHeight: 46,
    color: "#fff",
    textAlign: "center",
    marginBottom: 6,
  },
  /**
   * Malayalam gets its own face and no uppercase. Anton carries no Malayalam
   * glyphs, so the display face would have rendered this as blank boxes, and
   * textTransform: uppercase means nothing in the script — applying the
   * English title's style to it would have produced an unreadable headline on
   * the one screen that must never be unreadable.
   */
  titleMl: {
    fontFamily: font.malayalam,
    fontSize: 26,
    lineHeight: 38,
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
  },
  body: {
    fontFamily: font.body,
    fontSize: 17,
    lineHeight: 26,
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
    maxWidth: 320,
  },
  bodyMl: {
    fontFamily: font.malayalam,
    fontSize: 15,
    lineHeight: 26,
    marginTop: space[2],
  },
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
  callSubMl: { fontFamily: font.malayalam, fontSize: 13, marginTop: 1 },
  outline: {
    marginTop: 14,
    // minHeight, not height: this button carries two lines of label now, and
    // a fixed 56 would have clipped the Malayalam off the bottom.
    minHeight: 56,
    paddingVertical: space[2],
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
  outlineTextMl: { fontFamily: font.malayalam, fontSize: 13, opacity: 0.9 },
  dismiss: {
    fontFamily: font.body,
    fontSize: text.sm,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  /**
   * The underline moved to the Malayalam line, so the pair reads as one
   * control with one rule under it rather than two separate links.
   */
  dismissMl: {
    fontFamily: font.malayalam,
    fontSize: 13,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.4)",
    paddingBottom: 2,
  },
});
