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

/** Open eye — "show password". */
export function EyeIcon({ size = 22, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={2} />
    </Svg>
  );
}

/** Eye with a slash — "hide password". */
export function EyeOffIcon({ size = 22, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.9 4.24A9.1 9.1 0 0 1 12 5c6.5 0 10 7 10 7a13.3 13.3 0 0 1-2.16 3.19M6.6 6.6A13.3 13.3 0 0 0 2 12s3.5 7 10 7a9 9 0 0 0 3.4-.65M3 3l18 18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.5 9.5a3 3 0 0 0 4 4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

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
