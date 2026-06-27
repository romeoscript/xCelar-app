import Svg, { Circle, Path, Rect } from 'react-native-svg';

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

export function SearchIcon({ size = 22, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={7} stroke={color} strokeWidth={2} />
      <Path d="m20 20-3-3" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function WalletIcon({ size = 18, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={6} width={18} height={13} rx={2.5} stroke={color} strokeWidth={2} />
      <Path d="M3 9h18" stroke={color} strokeWidth={2} />
      <Circle cx={16.5} cy={13.5} r={1.2} fill={color} />
    </Svg>
  );
}

export function HomeIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 11.5 12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1v-9"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PackageIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3 3 7.5v9L12 21l9-4.5v-9L12 3Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path d="M3 7.5 12 12l9-4.5M12 12v9" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}

export function LockerIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={4} width={7} height={7} rx={1.5} stroke={color} strokeWidth={2} />
      <Rect x={13} y={4} width={7} height={7} rx={1.5} stroke={color} strokeWidth={2} />
      <Rect x={4} y={13} width={7} height={7} rx={1.5} stroke={color} strokeWidth={2} />
      <Rect x={13} y={13} width={7} height={7} rx={1.5} stroke={color} strokeWidth={2} />
    </Svg>
  );
}

export function UserIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={2} />
      <Path
        d="M4 20c0-3.6 3.6-6 8-6s8 2.4 8 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 22, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PencilIcon({ size = 22, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 20l1-4L16 5l3 3L8 19l-4 1Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 7l3 3" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function CrosshairIcon({ size = 22, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={7} stroke={color} strokeWidth={2} />
      <Path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={12} cy={12} r={2.2} fill={color} />
    </Svg>
  );
}

export function PinIcon({ size = 22, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={10} r={2.5} stroke={color} strokeWidth={2} />
    </Svg>
  );
}

/** Delivery truck — local, door-to-door road shipping. */
export function TruckIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M15 18H9" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path
        d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={7} cy={18} r={2} stroke={color} strokeWidth={2} />
      <Circle cx={17} cy={18} r={2} stroke={color} strokeWidth={2} />
    </Svg>
  );
}

/** Plane lifting off — sending a package abroad (export). */
export function PlaneTakeoffIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M2 22h20" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path
        d="M6.36 17.4 4 17l-2-4 1.1-.55a2 2 0 0 1 1.8 0l.17.1a2 2 0 0 0 1.8 0L8 12 5 6l.9-.45a2 2 0 0 1 2.09.2l4.02 3a2 2 0 0 0 2.1.2l4.19-2.06a2.41 2.41 0 0 1 1.73-.17L21 7a1.4 1.4 0 0 1 .87 1.99l-.38.76c-.23.46-.6.84-1.07 1.08L7.58 17.2a2 2 0 0 1-1.22.18Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Cargo ship — inbound freight (import). */
export function ShipIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 10.19V14M12 2v3" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path
        d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19.38 20A11.6 11.6 0 0 0 21 14l-8.19-3.64a2 2 0 0 0-1.62 0L3 14a11.6 11.6 0 0 0 2.81 7.76"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Calculator — get a price quote. */
export function CalculatorIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={2} width={16} height={20} rx={2.5} stroke={color} strokeWidth={2} />
      <Rect x={7.5} y={5} width={9} height={3.5} rx={1} stroke={color} strokeWidth={2} />
      <Circle cx={8.5} cy={13} r={0.9} fill={color} />
      <Circle cx={12} cy={13} r={0.9} fill={color} />
      <Circle cx={15.5} cy={13} r={0.9} fill={color} />
      <Circle cx={8.5} cy={17.5} r={0.9} fill={color} />
      <Circle cx={12} cy={17.5} r={0.9} fill={color} />
      <Circle cx={15.5} cy={17.5} r={0.9} fill={color} />
    </Svg>
  );
}

/** ID card — the user's profile. */
export function IdCardIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={5} width={18} height={14} rx={2.5} stroke={color} strokeWidth={2} />
      <Circle cx={8.5} cy={11} r={2} stroke={color} strokeWidth={2} />
      <Path
        d="M5.5 16c.5-1.6 1.7-2.3 3-2.3s2.5.7 3 2.3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path d="M14.5 10h3.5M14.5 13.5h2.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/** Padlock — password & security. */
export function LockIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={10} width={16} height={11} rx={2.5} stroke={color} strokeWidth={2} />
      <Path d="M8 10V8a4 4 0 0 1 8 0v2" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={12} cy={15} r={1.4} fill={color} />
    </Svg>
  );
}

/** Fingerprint — biometric unlock. */
export function FingerprintIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M5 19.5C5.5 18 6 15 6 12c0-.7.12-1.37.34-2" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M8.65 22c.21-.66.45-1.32.57-2" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M14 13.12c0 2.38 0 6.38-1 8.88" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M21.8 16c.2-2 .13-5.35 0-6" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M9 6.8a6 6 0 0 1 9 5.2c0 .47 0 1.17-.02 2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/** Bell — push notifications. */
export function BellIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M10.3 21a2 2 0 0 0 3.4 0" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path
        d="M3.26 15.33A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.67C19.41 13.96 18 12.5 18 8A6 6 0 0 0 6 8c0 4.5-1.41 5.96-2.74 7.33Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** People — saved recipients. */
export function UsersIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={9} cy={8} r={3.5} stroke={color} strokeWidth={2} />
      <Path d="M2.5 20c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M16 5a3.5 3.5 0 0 1 0 6.5M18 14.5c2.2.6 3.5 2.2 3.5 4.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/** Circled "i" — about / info. */
export function InfoIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} />
      <Path d="M12 11v5" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M12 8h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/** Circled "?" — FAQ / help. */
export function HelpCircleIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} />
      <Path
        d="M9.5 9.5a2.5 2.5 0 0 1 4.5 1.4c0 1.6-2 2.1-2 3.1"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 17h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/** Document with lines — legal text (terms / privacy). */
export function DocumentIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path d="M14 3v5h5" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M9 13h6M9 17h4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/** Shield with a check — privacy policy. */
export function ShieldIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3 5 6v5c0 4.4 3 7.5 7 9 4-1.5 7-4.6 7-9V6l-7-3Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path d="m9 12 2 2 4-4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Arrow leaving a doorway — sign out. */
export function LogoutIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m16 17 5-5-5-5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 12H9" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/** Handset — call us. */
export function PhoneCallIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15.5 21A13.5 13.5 0 0 1 3 8.5 2.5 2.5 0 0 1 5.5 6h2a1 1 0 0 1 1 .76l.9 3.2a1 1 0 0 1-.27.98l-1.4 1.4a12 12 0 0 0 5.03 5.03l1.4-1.4a1 1 0 0 1 .98-.27l3.2.9a1 1 0 0 1 .76 1V18.5A2.5 2.5 0 0 1 15.5 21Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Envelope — email us. */
export function MailIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={5} width={18} height={14} rx={2.5} stroke={color} strokeWidth={2} />
      <Path d="m4 7 8 5 8-5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Converging arrows — pickup ⇄ drop-off route. */
export function RouteSwapIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9h14" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M14 6l3 3-3 3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 15H7" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M10 12l-3 3 3 3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Cloud with an up arrow — file upload dropzone. */
export function CloudUploadIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.24"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 12v9" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="m16 16-4-4-4 4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Framed picture — gallery / photos. */
export function ImageIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={18} height={18} rx={2.5} stroke={color} strokeWidth={2} />
      <Circle cx={9} cy={9} r={1.6} stroke={color} strokeWidth={2} />
      <Path d="m21 15-4-4a2 2 0 0 0-2.8 0L6 19" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Camera — take a photo. */
export function CameraIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14.5 4h-5L7.5 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.5L14.5 4Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={13} r={3.2} stroke={color} strokeWidth={2} />
    </Svg>
  );
}

/** Outlined speech bubble — contact us. */
export function MessageIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 11.5a8.38 8.38 0 0 1-9 8.5 9 9 0 0 1-3.8-.8L3 21l1.3-4.2A8.38 8.38 0 0 1 3.5 12 8.5 8.5 0 0 1 12 3.5a8.38 8.38 0 0 1 9 8Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Trash can — destructive delete. */
export function TrashIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M10 11v6M14 11v6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
