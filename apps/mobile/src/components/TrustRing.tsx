import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { color, font } from "../theme";

/**
 * TrustScore ring (Dr Evide.dc.html:206-212).
 *
 * The web version uses conic-gradient, which React Native has no equivalent
 * for, so the arc is drawn as a stroked SVG circle with a dash offset. Same
 * result: the sweep IS the score, readable without a legend.
 */
export function TrustRing({
  score,
  size = 56,
  showDenominator = false,
}: {
  score: number;
  size?: number;
  showDenominator?: boolean;
}) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const filled = circumference * (Math.min(Math.max(score, 0), 100) / 100);

  return (
    <View
      style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}
      accessibilityRole="image"
      accessibilityLabel={`TrustScore ${score} out of 100`}
    >
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color.border}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color.accent}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeLinecap="butt"
          // Start the sweep at 12 o'clock, as the CSS conic-gradient does.
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <Text
        style={{
          fontFamily: font.monoBold,
          fontSize: Math.round(size * 0.32),
          color: color.accentText,
          lineHeight: Math.round(size * 0.36),
        }}
      >
        {score}
      </Text>
      {showDenominator && (
        <Text
          style={{
            fontFamily: font.body,
            fontSize: 8,
            letterSpacing: 0.5,
            color: color.textFaint,
            textTransform: "uppercase",
          }}
        >
          of 100
        </Text>
      )}
    </View>
  );
}
