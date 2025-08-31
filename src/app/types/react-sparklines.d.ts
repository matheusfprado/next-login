declare module "react-sparklines" {
  import { ComponentType, HTMLAttributes } from "react";

  export const Sparklines: ComponentType<HTMLAttributes<HTMLElement> & { data: number[] }>;
  export const SparklinesLine: ComponentType<HTMLAttributes<SVGElement>>;
  export const SparklinesSpots: ComponentType<HTMLAttributes<SVGElement>>;
}
