import { StyleSheet, Text, View } from "react-native";
import { ChevronRight, MapPin } from "lucide-react-native";
import {
  SPECIALTIES,
  experienceYears,
  initials,
  type RankedDoctor,
} from "@dr-evide/core";
import { color, font, radius, space, text } from "../theme";
import { TrustRing } from "./TrustRing";
import { Card, Eyebrow, SamplePill, VerifiedPill } from "./ui";

/** Result row — Dr Evide.dc.html:194-219. */
export function DoctorCard({
  doctor,
  onPress,
  asOfYear,
}: {
  doctor: RankedDoctor;
  onPress: () => void;
  /** The year the score was computed against — see SearchResult.asOfYear. */
  asOfYear: number;
}) {
  const years = experienceYears(doctor, asOfYear);

  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: "row", gap: 14 }}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initials(doctor.full_name)}</Text>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.name}>{doctor.full_name}</Text>
          <Text style={s.sub}>
            {SPECIALTIES[doctor.specialty_slug].name}
            {years !== null ? ` · ${years} yrs` : ""}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            <VerifiedPill verified={doctor.nmc_verified} />
            {doctor.is_sample && <SamplePill />}
          </View>
        </View>

        <View style={{ alignItems: "center" }}>
          <TrustRing score={doctor.trust_score} size={56} />
          <Eyebrow style={{ fontSize: 10, marginTop: 4 }}>Trust</Eyebrow>
        </View>
      </View>

      <View style={s.foot}>
        <View style={s.metaItem}>
          <MapPin size={16} color={color.textMuted} />
          <Text style={s.metaText}>
            {doctor.distance_km.toFixed(1)} km{doctor.town ? ` · ${doctor.town}` : ""}
          </Text>
        </View>
        {doctor.fee_inr !== null && (
          <Text style={[s.metaText, { fontFamily: font.monoBold, color: color.text }]}>
            ₹{doctor.fee_inr}
          </Text>
        )}
        <View style={s.cta}>
          <Text style={s.ctaText}>Profile</Text>
          <ChevronRight size={16} color={color.accentText} />
        </View>
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: color.flare50,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: font.display, fontSize: 20, color: color.accentText },
  name: { fontFamily: font.display, fontSize: 18, color: color.text, lineHeight: 22 },
  sub: { fontFamily: font.body, fontSize: text.sm, color: color.textMuted, marginBottom: space[2] },
  foot: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[4],
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontFamily: font.body, fontSize: text.sm, color: color.textMuted },
  cta: { flexDirection: "row", alignItems: "center", marginLeft: "auto" },
  ctaText: { fontFamily: font.bodySemibold, fontSize: text.sm, color: color.accentText },
});
