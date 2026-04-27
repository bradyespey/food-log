// Icon component wrapping @expo/vector-icons Feather (bundled with Expo 52).

import type { ComponentProps } from 'react';
import { Feather } from '@expo/vector-icons';

export const ICON_MAP = {
  camera: 'camera',
  list: 'list',
  settings: 'settings',
  check: 'check',
  alert: 'alert-triangle',
  edit: 'edit',
  trash: 'trash-2',
  back: 'chevron-left',
  plus: 'plus',
  sparkle: 'zap',
  upload: 'upload',
  droplet: 'droplet',
  chevron: 'chevron-right',
  home: 'home',
  x: 'x',
  copy: 'copy',
} as const;

export type IconName = keyof typeof ICON_MAP;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export default function Icon({ name, size = 22, color = '#111' }: IconProps) {
  return (
    <Feather
      name={ICON_MAP[name] as ComponentProps<typeof Feather>['name']}
      size={size}
      color={color}
    />
  );
}
