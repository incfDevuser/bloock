import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";

const PRIMARY_DARK = "#A8CC1A";
const INACTIVE = "#666666";

type GlyphType = "today" | "week" | "tasks" | "settings";

type Props = {
  type: GlyphType;
  focused: boolean;
  size?: number;
};

export function TabGlyph({ type, focused, size = 22 }: Props) {
  const color = focused ? PRIMARY_DARK : INACTIVE;
  const strokeWidth = focused ? 2 : 1.5;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round">
      {type === "today" && (
        <>
          <Circle cx={12} cy={12} r={4} />
          <Line x1={12} y1={2} x2={12} y2={4} />
          <Line x1={12} y1={20} x2={12} y2={22} />
          <Line x1={4.93} y1={4.93} x2={6.34} y2={6.34} />
          <Line x1={17.66} y1={17.66} x2={19.07} y2={19.07} />
          <Line x1={2} y1={12} x2={4} y2={12} />
          <Line x1={20} y1={12} x2={22} y2={12} />
          <Line x1={4.93} y1={19.07} x2={6.34} y2={17.66} />
          <Line x1={17.66} y1={6.34} x2={19.07} y2={4.93} />
        </>
      )}

      {type === "week" && (
        <>
          <Rect x={3} y={4} width={18} height={18} rx={2} ry={2} />
          <Line x1={16} y1={2} x2={16} y2={6} />
          <Line x1={8} y1={2} x2={8} y2={6} />
          <Line x1={3} y1={10} x2={21} y2={10} />
        </>
      )}

      {type === "tasks" && (
        <>
          <Polyline points="9 11 12 14 22 4" />
          <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </>
      )}

      {type === "settings" && (
        <>
          <Path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <Circle cx={12} cy={12} r={3} />
        </>
      )}
    </Svg>
  );
}
