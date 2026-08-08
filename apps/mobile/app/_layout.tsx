import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { Anton_400Regular } from "@expo-google-fonts/anton";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from "@expo-google-fonts/jetbrains-mono";
import { NotoSansMalayalam_600SemiBold } from "@expo-google-fonts/noto-sans-malayalam";
import { LangProvider } from "../src/lib/lang";
import { color } from "../src/theme";

SplashScreen.preventAutoHideAsync();

/**
 * Clash Display and General Sans are Fontshare faces with no npm package, so
 * they load from Fontshare's CDN as TTF (React Native can't read woff2).
 * Anton, JetBrains Mono and Noto Sans Malayalam ship as bundled assets, so
 * the type that carries meaning — the emergency headline, every number, and
 * the Malayalam name — still renders with no network.
 *
 * If the remote faces fail, useFonts reports an error and we render anyway on
 * the system font rather than holding the splash screen forever.
 */
const FONTSHARE = "https://cdn.fontshare.com/wf";

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Anton: Anton_400Regular,
    JetBrainsMono: JetBrainsMono_400Regular,
    JetBrainsMonoBold: JetBrainsMono_700Bold,
    NotoSansMalayalam: NotoSansMalayalam_600SemiBold,
    ClashDisplay: `${FONTSHARE}/FPDAZ2S6SW4QMSRIIKNNGTPM6VIXYMKO/5HNPQ453FRLIQWV2FNOBUU3FKTDZQVSG/Z3MGHFHX6DCTLQ55LJYRJ5MDCZPMFZU6.ttf`,
    GeneralSans: `${FONTSHARE}/MFQT7HFGCR2L5ULQTW6YXYZXXHMPKLJ3/YWQ244D6TACUX5JBKATPOW5I5MGJ3G73/7YY3ZAAE3TRV2LANYOLXNHTPHLXVWTKH.ttf`,
    GeneralSansMedium: `${FONTSHARE}/3RZHWSNONLLWJK3RLPEKUZOMM56GO4LJ/BPDRY7AHVI3MCDXXVXTQQ76H3UXA63S3/SB2OEB6IKZPRR6JT4GFJ2TFT6HBB6AZN.ttf`,
    GeneralSansSemibold: `${FONTSHARE}/K46YRH762FH3QJ25IQM3VAXAKCHEXXW4/ISLWQPUZHZF33LRIOTBMFOJL57GBGQ4B/3ZLMEXZEQPLTEPMHTQDAUXP5ZZXCZAEN.ttf`,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <LangProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: color.bg },
          animation: "slide_from_right",
        }}
      >
        {/* The emergency screen is an interrupt, not a destination — it comes
            up from the bottom and owns the whole field. It renders both
            languages itself rather than reading the provider, so it is
            correct even before anyone has chosen one. */}
        <Stack.Screen
          name="emergency"
          options={{ animation: "slide_from_bottom", gestureEnabled: false }}
        />
      </Stack>
    </LangProvider>
  );
}
