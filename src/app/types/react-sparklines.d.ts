declare module "react-sparklines" {
  import { ComponentType, SVGAttributes } from "react";

  export const Sparklines: ComponentType<{ data: number[] } & SVGAttributes<SVGElement>>;
  export const SparklinesLine: ComponentType<SVGAttributes<SVGElement> & { style?: React.CSSProperties }>;
  export const SparklinesSpots: ComponentType<SVGAttributes<SVGElement> & {
    size?: number;
    style?: React.CSSProperties;
  }>;
}
