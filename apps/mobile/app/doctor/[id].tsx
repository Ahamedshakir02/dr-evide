import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, CircleCheck, Navigation, Phone } from "lucide-react-native";
import { currentYear, getDoctor, haversineKm, scoreOne } from "../../src/lib/api";
import { useUserLocation } from "../../src/lib/location";
import {
  MOBILE_RADIUS_DEFAULT_KM,
  SCORE_WEIGHTS,
  SPECIALTIES,
  directionsUrl,
  experienceYears,
  initials,
  telHref,
  type Doctor,
  type ScoreBreakdown,
} from "@dr-evide/core";
import { TrustRing } from "../../src/components/TrustRing";
import {
  Button,
  Card,
  CredentialRow,
  Eyebrow,
  Panel,
  Pledge,
  SamplePill,
  ScoreRow,
  VerifiedPill,
} from "../../src/components/ui";
import { useLang } from "../../src/lib/lang";
import { color, font, radius, space, text } from "../../src/theme";

/** Doctor profile — Dr Evide.dc.html screen 03 (lines 282-407). */
export default function DoctorScreen() {
  const { lang, t } = useLang();
  /** Malayalam needs a different face on every line, not a different string. */
  const ml = lang === "ml";
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; conditions?: string; radius?: string }>();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [score, setScore] = useState<{ trust_score: number; score_breakdown: ScoreBreakdown } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [distanceKm, setDistanceKm] = useState(0);

  /**
   * The same session-cached origin the results screen measured from. Reading it
   * here rather than from DEFAULT_LOCATION is what makes the ring on this
   * screen equal the ring on the card that was tapped — distance feeds the
   * accessibility component of the score, so two origins meant two scores.
   */
  const coords = useUserLocation();

  useEffect(() => {
    (async () => {
      const d = await getDoctor(parseInt(params.id, 10));
      if (d) {
        // Reproduce the search context the list ranked under, so the ring here
        // shows exactly the number shown on the card that was tapped.
        const radiusKm = parseFloat(params.radius ?? "") || MOBILE_RADIUS_DEFAULT_KM;
        const conditions = (params.conditions ?? "").split(",").filter(Boolean);
        const distance_km = haversineKm(coords.lat, coords.lng, d.lat, d.lng);
        setDistanceKm(distance_km);
        setScore(
          scoreOne(
            { ...d, distance_km },
            { matchedConditions: conditions, radiusKm, asOfYear: currentYear() }
          )
        );
      }
      setDoctor(d);
      setLoading(false);
    })();
  }, [params.id, params.conditions, params.radius, coords.lat, coords.lng]);

  if (loading) {
    return (
      <SafeAreaView style={s.screen}>
        <ActivityIndicator style={{ marginTop: space[16] }} color={color.accent} />
      </SafeAreaView>
    );
  }

  if (!doctor || !score) {
    return (
      <SafeAreaView style={s.screen}>
        <Pressable onPress={() => router.back()} style={s.iconBtn}>
          <ChevronLeft size={20} color={color.text} />
        </Pressable>
        <Text style={[s.empty, ml && s.emptyMl]}>{t.doctorNotFound}</Text>
      </SafeAreaView>
    );
  }

  const years = experienceYears(doctor, currentYear());

  return (
    <SafeAreaView style={s.screen} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: space[6] }}>
        <View style={{ paddingHorizontal: 22, paddingTop: space[2] }}>
          <Pressable onPress={() => router.back()} style={s.iconBtn} accessibilityLabel="Back">
            <ChevronLeft size={20} color={color.text} />
          </Pressable>
        </View>

        {/* header */}
        <View style={s.headerRow}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials(doctor.full_name)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{doctor.full_name}</Text>
            <Text style={s.sub}>
              {SPECIALTIES[doctor.specialty_slug].name}
              {doctor.qualifications.length > 0 ? ` · ${doctor.qualifications.join(", ")}` : ""}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              <VerifiedPill verified={doctor.nmc_verified} regNo={doctor.nmc_reg_no} />
              {doctor.is_sample && <SamplePill />}
            </View>
          </View>
        </View>

        {/* quick facts — structural panels, kept sharp */}
        <View style={s.quickfacts}>
          <Panel style={{ flex: 1, alignItems: "center" }}>
            <Text style={s.factValue}>
              {distanceKm.toFixed(1)}
              <Text style={s.factUnit}>km</Text>
            </Text>
            <Eyebrow style={{ fontSize: 10, marginTop: 3 }}>{doctor.town ?? t.distance}</Eyebrow>
          </Panel>
          <Panel style={{ flex: 1, alignItems: "center" }}>
            <Text style={s.factValue}>{doctor.fee_inr !== null ? `₹${doctor.fee_inr}` : "—"}</Text>
            <Eyebrow style={{ fontSize: 10, marginTop: 3 }}>{t.clinicConsult}</Eyebrow>
          </Panel>
          <Panel style={{ flex: 1, alignItems: "center" }}>
            <Text style={s.factValue}>{years ?? "—"}</Text>
            <Eyebrow style={{ fontSize: 10, marginTop: 3 }}>{t.years}</Eyebrow>
          </Panel>
        </View>

        {/* why this doctor ranks here */}
        <Card style={{ marginHorizontal: 22, marginBottom: space[4], padding: 18 }}>
          <View style={s.whyHead}>
            {/* The mock reads "Why she ranks here". Doctor records carry no
                gender, so this stays neutral rather than guessing. */}
            <Text style={[s.whyTitle, ml && s.whyTitleMl]}>{t.whyRanksHere}</Text>
            <TrustRing score={score.trust_score} size={58} showDenominator />
          </View>
          <Text style={[s.whyLede, ml && s.whyLedeMl]}>{t.whyRanksBlurb}</Text>

          <View style={{ gap: 14 }}>
            {/* t.weightLabels, not SCORE_WEIGHTS' own English `label` — the
                translations were already in core and this read past them. */}
            {SCORE_WEIGHTS.map(({ key, max }) => (
              <ScoreRow
                key={key}
                label={t.weightLabels[key]}
                value={score.score_breakdown[key]}
                max={max}
              />
            ))}
          </View>

          <View style={s.whyFoot}>
            <Pledge icon={<CircleCheck size={15} color={color.accent2Text} />}>
              {t.noPaidPlacement}
            </Pledge>
          </View>
        </Card>

        {/* credentials */}
        <View style={{ paddingHorizontal: 22 }}>
          <Eyebrow style={{ marginBottom: space[3] }}>{t.credentials}</Eyebrow>
          <View style={{ gap: space[3] }}>
            {doctor.qualifications.map((q) => (
              <CredentialRow
                key={q}
                title={q}
                verified={doctor.nmc_verified}
                note={
                  doctor.nmc_verified
                    ? `${t.nmcVerified}${doctor.reg_year ? ` · ${doctor.reg_year}` : ""}`
                    : t.notVerified
                }
              />
            ))}
            {/* Sub-specialties are declared by the doctor, never registry-checked. */}
            {doctor.sub_specialties.map((sp) => (
              <CredentialRow key={sp} title={sp} verified={false} />
            ))}
          </View>

          {doctor.timings && (
            <>
              <Eyebrow style={{ marginTop: space[6], marginBottom: space[2] }}>{t.timings}</Eyebrow>
              <Text style={s.timings}>{doctor.timings}</Text>
            </>
          )}
        </View>
      </ScrollView>

      {/* sticky action bar */}
      <View style={s.actionBar}>
        <Button
          label={t.getDirections}
          variant="secondary"
          style={{ flex: 1 }}
          icon={<Navigation size={20} color={color.text} />}
          onPress={() => Linking.openURL(directionsUrl(doctor.lat, doctor.lng))}
        />
        {doctor.phone && (
          <Button
            label={t.callClinic}
            style={{ flex: 1 }}
            icon={<Phone size={20} color="#fff" />}
            onPress={() => Linking.openURL(telHref(doctor.phone!))}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  headerRow: {
    flexDirection: "row",
    gap: space[4],
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: space[2],
    paddingBottom: 18,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: color.flare50,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: font.display, fontSize: 26, color: color.accentText },
  name: { fontFamily: font.display, fontSize: 23, color: color.text, lineHeight: 27 },
  sub: {
    fontFamily: font.body,
    fontSize: 15,
    color: color.textMuted,
    marginBottom: space[2],
  },
  quickfacts: { flexDirection: "row", gap: 10, paddingHorizontal: 22, marginBottom: 18 },
  factValue: { fontFamily: font.monoBold, fontSize: 19, color: color.text },
  factUnit: { fontFamily: font.mono, fontSize: 12, color: color.textFaint },
  whyHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space[3],
    marginBottom: space[1],
  },
  whyTitle: { fontFamily: font.display, fontSize: 17, color: color.text, flex: 1 },
  whyTitleMl: { fontFamily: font.malayalam, fontSize: 15, lineHeight: 26, flex: 1 },
  whyLede: {
    fontFamily: font.body,
    fontSize: 13,
    color: color.textMuted,
    marginBottom: space[4],
    lineHeight: 19,
  },
  whyLedeMl: { fontFamily: font.malayalam, fontSize: 12, lineHeight: 22 },
  whyFoot: {
    marginTop: space[4],
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
  timings: { fontFamily: font.body, fontSize: text.sm, color: color.textMuted },
  actionBar: {
    flexDirection: "row",
    gap: space[3],
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: space[2],
    borderTopWidth: 1,
    borderTopColor: color.border,
    backgroundColor: color.bg,
  },
  empty: {
    textAlign: "center",
    marginTop: space[12],
    fontFamily: font.body,
    color: color.textMuted,
  },
  emptyMl: { fontFamily: font.malayalam, fontSize: 14, lineHeight: 26 },
});
