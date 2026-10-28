import { ReactNode } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { CloudOff, ServerCrash } from "lucide-react-native";
import { useLang } from "../lib/lang";
import { color, font, space, text } from "../theme";

/**
 * "We couldn't check", said plainly.
 *
 * Shown in place of a doctor list or a profile when the server could not be
 * reached or answered with an error. The copy is the website's
 * (offlineTitle/offlineBody, serverTitle/serverBody in core), so the two
 * products describe the same failure the same way. It is careful to say this
 * is not the same as "no doctors nearby".
 *
 * The retry button is passed in as children, because the screen owns what
 * "try again" means.
 */
export function LoadFailure({
  kind,
  children,
}: {
  kind: "offline" | "server";
  children?: ReactNode;
}) {
  const { lang, t } = useLang();
  const ml = lang === "ml";
  const Icon = kind === "offline" ? CloudOff : ServerCrash;

  return (
    <View style={s.wrap} accessibilityRole="alert">
      <Icon size={40} color={color.textMuted} />
      <Text style={[s.title, ml && s.titleMl]}>
        {kind === "offline" ? t.offlineTitle : t.serverTitle}
      </Text>
      <Text style={[s.body, ml && s.bodyMl]}>
        {kind === "offline" ? t.offlineBody : t.serverBody}
      </Text>
      {children ? <View style={s.actions}>{children}</View> : null}
      {/* The one number that works with no data connection at all. */}
      <Pressable
        onPress={() => Linking.openURL("tel:108")}
        accessibilityRole="link"
        hitSlop={8}
      >
        <Text style={[s.emergency, ml && s.bodyMl]}>
          {t.inEmergencyCall} <Text style={s.emergencyNumber}>108</Text>
        </Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: "center", paddingHorizontal: space[4], marginTop: space[12], gap: space[3] },
  title: {
    fontFamily: font.display,
    fontSize: text.xl,
    color: color.text,
    textAlign: "center",
  },
  titleMl: { fontFamily: font.malayalam, fontSize: 17, lineHeight: 28 },
  body: {
    fontFamily: font.body,
    fontSize: text.base,
    lineHeight: 23,
    color: color.textMuted,
    textAlign: "center",
  },
  bodyMl: { fontFamily: font.malayalam, fontSize: 13, lineHeight: 24 },
  actions: { alignSelf: "stretch", marginTop: space[2] },
  emergency: {
    fontFamily: font.bodyMedium,
    fontSize: text.sm,
    color: color.textMuted,
    textAlign: "center",
    marginTop: space[2],
  },
  emergencyNumber: { fontFamily: font.monoBold, color: color.danger },
});
