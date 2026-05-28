"use client";

import type { ComponentType } from "react";
import MarqueeModule, { type MarqueeProps } from "react-fast-marquee";

const Marquee = (
  "default" in (MarqueeModule as object)
    ? (MarqueeModule as unknown as { default: ComponentType<MarqueeProps> })
        .default
    : MarqueeModule
) as ComponentType<MarqueeProps>;

export function HeroMarquee(props: MarqueeProps) {
  return <Marquee {...props} />;
}
