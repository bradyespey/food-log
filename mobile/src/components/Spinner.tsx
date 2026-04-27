import { ActivityIndicator } from 'react-native';

interface SpinnerProps {
  size?: number;
  color?: string;
}

export default function Spinner({ size = 18, color = '#fff' }: SpinnerProps) {
  return <ActivityIndicator size={size < 24 ? 'small' : 'large'} color={color} />;
}
