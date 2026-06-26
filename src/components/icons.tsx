import Svg, { Circle, Path } from 'react-native-svg';

export type IconProps = {
  size?: number;
  color?: string;
};

/** Outlined check inside a circle — used in the delivery status pill. */
export function CheckCircleIcon({ size = 22, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} />
      <Path
        d="M7.5 12.5l3 3 6-6.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export type ChatIconProps = IconProps & {
  /** Color showing through the speech-bubble dots (usually the FAB background). */
  dotColor?: string;
};

/** Chevron pointing left — used for back buttons. */
export function ChevronLeftIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18l-6-6 6-6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Filled speech bubble with three dots — used in the floating chat button. */
export function ChatIcon({ size = 24, color = '#ffffff', dotColor = '#000000' }: ChatIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 4h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-7l-4 3.5V16H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
        fill={color}
      />
      <Circle cx={9} cy={10} r={1.2} fill={dotColor} />
      <Circle cx={12} cy={10} r={1.2} fill={dotColor} />
      <Circle cx={15} cy={10} r={1.2} fill={dotColor} />
    </Svg>
  );
}
