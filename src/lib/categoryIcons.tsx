import { Speaker, Waves, SlidersHorizontal, Mic, Cable, Volume2, type LucideIcon } from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  speaker: Speaker,
  top: Speaker,
  sub: Waves,
  woofer: Waves,
  mixer: SlidersHorizontal,
  dsp: SlidersHorizontal,
  mic: Mic,
  cable: Cable,
  accessory: Cable,
  accessories: Cable,
};

export function iconForCategory(name: string): LucideIcon {
  const key = name.toLowerCase();
  for (const [needle, Icon] of Object.entries(CATEGORY_ICONS)) {
    if (key.includes(needle)) return Icon;
  }
  return Volume2;
}

const CATEGORY_IMAGES: Record<string, string> = {
  accessor: "/images/category-accessories.jpg",
  cable: "/images/category-cable.jpg",
  mic: "/images/category-microphones.jpg",
  dsp: "/images/category-mixing-dsp.jpg",
  mixer: "/images/category-mixer.jpg",
  conditioner: "/images/category-power-conditioner.jpg",
  subwoofer: "/images/category-powered-subwoofer.jpg",
  speaker: "/images/category-powered-speakers.jpg",
};

export function imageForCategory(name: string): string {
  const key = name.toLowerCase();
  for (const [needle, src] of Object.entries(CATEGORY_IMAGES)) {
    if (key.includes(needle)) return src;
  }
  return "/images/category-products.jpg";
}

export function CategoryIcon({
  name,
  className,
  strokeWidth,
}: {
  name: string;
  className?: string;
  strokeWidth?: number;
}) {
  // Selects among the fixed, module-level icons above — nothing is created
  // here, only picked, but the compiler lint can't tell those apart.
  const Icon = iconForCategory(name);
  // eslint-disable-next-line react-hooks/static-components
  return <Icon className={className} strokeWidth={strokeWidth} />;
}
