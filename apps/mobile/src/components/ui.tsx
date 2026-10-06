import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Check, ShieldCheck, TriangleAlert } from "lucide-react-native";
import { color, font, radius, shadow, space, text } from "../theme";

/* ── Card ─────────────────────────────────────────────────────────────── */

export function Card({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          s.card,
          style,
          pressed && { transform: [{ scale: 0.99 }], borderColor: color.borderStrong },
        ]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[s.card, style]}>{children}</View>;
}

/** Structural panel — sharp corners, per the design system's shape rule. */
export function Panel({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[s.panel, style]}>{children}</View>;
}

/* ── Buttons ──────────────────────────────────────────────────────────── */

export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  icon?: ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const primary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        s.btn,
        primary ? s.btnPrimary : s.btnSecondary,
        pressed && { backgroundColor: primary ? color.accentPress : color.surface2 },
        pressed && { transform: [{ scale: 0.98 }] },
        disabled && { opacity: 0.45 },
        style,
      ]}
    >
      {icon}
      <Text style={[s.btnLabel, { color: primary ? color.accentContrast : color.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

/* ── Labels ───────────────────────────────────────────────────────────── */

export function Eyebrow({ children, style }: { children: ReactNode; style?: object }) {
  return <Text style={[s.eyebrow, style]}>{children}</Text>;
}

export function Mono({ children, style }: { children: ReactNode; style?: object }) {
  return <Text style={[{ fontFamily: font.mono, color: color.text }, style]}>{children}</Text>;
}

/* ── Pills ────────────────────────────────────────────────────────────── */

export function VerifiedPill({ verified, regNo }: { verified: boolean; regNo?: string | null }) {
  if (!verified) {
    return (
      <View style={[s.pill, s.pillUnverified]}>
        <TriangleAlert size={13} color={color.textMuted} />
        <Text style={[s.pillText, { color: color.textMuted }]}>Not yet verified</Text>
      </View>
    );
  }
  return (
    <View style={[s.pill, s.pillVerified]}>
      <ShieldCheck size={13} color={color.accent2Text} />
      <Text style={[s.pillText, { color: color.accent2Text }]}>
        NMC verified{regNo ? ` · ${regNo}` : ""}
      </Text>
    </View>
  );
}

/** Fictional-data marker. Stays until real NMC-verified data replaces the seed. */
export function SamplePill() {
  return (
    <View style={[s.pill, s.pillSample]}>
      <Text style={[s.pillText, { color: color.warningText }]}>Sample data</Text>
    </View>
  );
}

/* ── Credential row ───────────────────────────────────────────────────── */

/**
 * Dr Evide.dc.html:372-390. The dashed treatment on the unverified variant is
 * the point: a self-reported qualification must not pass for a checked one.
 */
export function CredentialRow({
  title,
  verified,
  note,
}: {
  title: string;
  verified: boolean;
  note?: string;
}) {
  return (
    <View style={[s.credRow, !verified && s.credRowUnverified]}>
      <View style={[s.credIcon, !verified && s.credIconUnverified]}>
        {verified ? (
          <Check size={18} color={color.accent2} strokeWidth={2.25} />
        ) : (
          <TriangleAlert size={18} color={color.textFaint} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.credTitle, !verified && { color: color.textMuted }]}>{title}</Text>
        <Text style={[s.credNote, !verified && { color: color.textFaint }]}>
          {note ?? (verified ? "Verified with NMC registry" : "Self-reported · not yet verified")}
        </Text>
      </View>
    </View>
  );
}

/* ── Score bars ───────────────────────────────────────────────────────── */

export function ScoreRow({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  return (
    <View>
      <View style={s.scoreHead}>
        <Text style={s.scoreLabel}>{label}</Text>
        <Text style={{ fontFamily: font.mono, fontSize: text.sm, color: color.textMuted }}>
          {value} / {max}
        </Text>
      </View>
      <View style={s.scoreTrack}>
        <View style={[s.scoreFill, { width: `${Math.round((value / max) * 100)}%` }]} />
      </View>
    </View>
  );
}

/* ── Pledge line ──────────────────────────────────────────────────────── */

export function Pledge({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space[2] }}>
      {icon}
      <Text
        style={{
          fontFamily: font.bodySemibold,
          fontSize: text.sm - 1,
          color: color.accent2Text,
          flex: 1,
        }}
      >
        {children}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.lg,
    padding: space[4],
  },
  panel: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.panel,
    padding: space[3],
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space[2],
    height: 52,
    paddingHorizontal: space[6],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "transparent",
  },
  btnPrimary: { backgroundColor: color.accent, ...shadow.sm },
  btnSecondary: { backgroundColor: color.surface, borderColor: color.borderStrong },
  btnLabel: { fontFamily: font.bodySemibold, fontSize: text.base },
  eyebrow: {
    fontFamily: font.bodySemibold,
    fontSize: text.xs,
    textTransform: "uppercase",
    letterSpacing: 0.96,
    color: color.textMuted,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  pillText: { fontFamily: font.bodySemibold, fontSize: text.xs },
  pillVerified: { backgroundColor: color.accent2Wash, borderColor: color.accent2Edge },
  pillUnverified: {
    backgroundColor: color.surface2,
    borderColor: color.borderStrong,
    borderStyle: "dashed",
  },
  pillSample: { backgroundColor: color.warningWash, borderColor: color.warningEdge },
  credRow: {
    flexDirection: "row",
    gap: space[3],
    alignItems: "center",
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    paddingVertical: space[3],
    paddingHorizontal: 14,
  },
  credRowUnverified: {
    backgroundColor: color.surface2,
    borderStyle: "dashed",
    borderColor: color.borderStrong,
  },
  credIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(19, 122, 82, 0.14)",
  },
  credIconUnverified: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: color.borderStrong,
  },
  credTitle: { fontFamily: font.bodySemibold, fontSize: 15, color: color.text },
  credNote: { fontFamily: font.body, fontSize: text.xs, color: color.accent2Text },
  scoreHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    gap: space[3],
  },
  scoreLabel: { fontFamily: font.bodyMedium, fontSize: text.sm, color: color.text, flex: 1 },
  scoreTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: color.surface2,
    overflow: "hidden",
  },
  scoreFill: { height: "100%", backgroundColor: color.accent, borderRadius: radius.pill },
});
