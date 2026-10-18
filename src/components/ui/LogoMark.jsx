import { useId } from 'react';

/** Kinetic Voxel logo: three ascending voxel columns — a sorted array. Decorative (aria-hidden). */
export default function LogoMark({ size = 26, className = 'logo-mark' }) {
  const id = useId().replace(/:/g, '');
  const f = `lgF${id}`;
  const s = `lgS${id}`;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 26 26" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={f} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFB07A" />
          <stop offset=".55" stopColor="#FF6B2C" />
          <stop offset="1" stopColor="#FF2E88" />
        </linearGradient>
        <linearGradient id={s} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B8336A" />
          <stop offset="1" stopColor="#5E1238" />
        </linearGradient>
      </defs>
      <path d="M2 24V17h5v7z" fill={`url(#${f})`} />
      <path d="M2 17l2.5-2.5h5L7 17z" fill="#FFD9C2" />
      <path d="M7 17l2.5-2.5V21.5L7 24z" fill={`url(#${s})`} />
      <path d="M9.5 24V11.5h5V24z" fill={`url(#${f})`} />
      <path d="M9.5 11.5L12 9h5l-2.5 2.5z" fill="#FFD9C2" />
      <path d="M14.5 11.5L17 9v12.5L14.5 24z" fill={`url(#${s})`} />
      <path d="M17 24V5.5h5V24z" fill={`url(#${f})`} />
      <path d="M17 5.5L19.5 3h5L22 5.5z" fill="#FFF1E8" />
      <path d="M22 5.5L24.5 3v18.5L22 24z" fill={`url(#${s})`} />
    </svg>
  );
}
