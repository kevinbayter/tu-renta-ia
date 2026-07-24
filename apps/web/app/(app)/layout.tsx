import { Cascaron } from '@/components/shell/cascaron';

export default function LayoutApp({ children }: { children: React.ReactNode }) {
  return <Cascaron>{children}</Cascaron>;
}
