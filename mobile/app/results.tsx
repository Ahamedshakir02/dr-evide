import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Slider from "@react-native-community/slider";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, MapPin, WifiOff } from "lucide-react-native";
import { DEFAULT_LOCATION, DEFAULT_RADIUS_KM, findDoctors } from "../src/lib/api";
import { SPECIALTIES } from "../src/lib/taxonomy";
import type { RankedDoctor, SpecialtySlug } from "../src/lib/types";
import { DoctorCard } from "../src/components/DoctorCard";
import { RankedIcon } from "../src/components/SpecialtyIcon";
import { Pledge } from "../src/components/ui";
import { color, font, radius, space, text } from "../src/theme";

const RADIUS_MIN = 1;
/** Deviation: the mock caps at 15km. Edappal is rural, so the ceiling is 25. */
const RADIUS_MAX = 25;

/** Results — Dr Evide.dc.html screen 02 (lines 149-280). */
export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ specialty?: string; conditions?: string }>();
  const specialty = (params.specialty ?? "general") as SpecialtySlug;
  const conditionsRaw = params.conditions ?? "";

  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [doctors, setDoctors] = useState<RankedDoctor[]>([]);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  const conditions = conditionsRaw ? conditionsRaw.split(",").filter(Boolean) : [];
  const specialtyName = SPECIALTIES[specialty]?.name ?? "Doctors";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await findDoctors({
        specialty,
        conditions,
        ...DEFAULT_LOCATION,
        radiusKm,
      });
      setDoctors(res.doctors);
      setOffline(res.offline);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specialty, conditionsRaw, radiusKm]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }} edges={["top"]}>
      {/* sticky header */}
      <View style={s.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: space[3] }}>
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Back to search"
            style={s.iconBtn}
          >
            <ChevronLeft size={20} color={color.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{specialtyName}</Text>
            {conditions.length > 0 && (
              <Text style={s.matched}>matched to &ldquo;{conditions.join(", ")}&rdquo;</Text>
            )}
          </View>
        </View>

        {/* radius control */}
        <View style={s.radiusCard}>
          <View style={s.radiusHead}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
              <MapPin size={16} color={color.accentText} />
              <Text style={s.radiusLabel}>Within </Text>
              <Text style={s.radiusValue}>{radiusKm} km</Text>
            </View>
            <Text style={s.count}>
              <Text style={{ fontFamily: font.monoBold, color: color.text }}>{doctors.length}</Text>
              {doctors.length === 1 ? " doctor" : " doctors"}
            </Text>
          </View>
          <Slider
            minimumValue={RADIUS_MIN}
            maximumValue={RADIUS_MAX}
            step={1}
            value={radiusKm}
            onSlidingComplete={setRadiusKm}
            minimumTrackTintColor={color.accent}
            maximumTrackTintColor={color.border}
            thumbTintColor={color.accent}
          />
        </View>

        <View style={{ marginTop: space[3] }}>
          <Pledge icon={<RankedIcon />}>Ranked by TrustScore — not by ads</Pledge>
        </View>

        {offline && (
          <View style={s.offlineRow}>
            <WifiOff size={13} color={color.warning} />
            <Text style={s.offlineText}>Offline — showing bundled sample doctors</Text>
          </View>
        )}
      </View>

      {/* results */}
      <ScrollView contentContainerStyle={s.list}>
        {loading && <ActivityIndicator style={{ marginTop: space[12] }} color={color.accent} />}

        {!loading && doctors.length === 0 && (
          <Text style={s.empty}>
            No {specialtyName} doctors within {radiusKm} km.
            {radiusKm < RADIUS_MAX ? " Try widening the radius." : ""}
          </Text>
        )}

        {!loading &&
          doctors.map((d) => (
            <DoctorCard
              key={d.id}
              doctor={d}
              onPress={() =>
                router.push({
                  pathname: "/doctor/[id]",
                  params: {
                    id: String(d.id),
                    conditions: conditionsRaw,
                    radius: String(radiusKm),
                  },
                })
              }
            />
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: 22,
    paddingTop: space[2],
    paddingBottom: space[4],
    borderBottomWidth: 1,
    borderBottomColor: color.border,
    backgroundColor: color.bg,
  },
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
  title: { fontFamily: font.display, fontSize: 20, color: color.text, lineHeight: 24 },
  matched: { fontFamily: font.body, fontSize: 13, color: color.textFaint },
  radiusCard: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: space[3],
  },
  radiusHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: space[2],
  },
  radiusLabel: { fontFamily: font.bodySemibold, fontSize: text.sm, color: color.text },
  radiusValue: { fontFamily: font.monoBold, fontSize: text.sm, color: color.accentText },
  count: { fontFamily: font.body, fontSize: 13, color: color.textMuted },
  offlineRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: space[2] },
  offlineText: { fontFamily: font.body, fontSize: text.xs, color: color.warning },
  list: { padding: 22, gap: 14, paddingBottom: space[12] },
  empty: {
    textAlign: "center",
    color: color.textMuted,
    fontFamily: font.body,
    fontSize: text.base,
    marginTop: space[12],
  },
});
