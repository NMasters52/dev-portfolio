import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Mail,
  MapPin,
  Menu,
  Moon,
  Phone,
  Sun,
  X,
  type LucideProps,
} from "lucide-react";

type IconName = "check" | "copy" | "download" | "external-link" | "mail" | "map-pin" | "menu" | "moon" | "phone" | "sun" | "x";
type BrandName = "github" | "linkedin";
const brandIconPaths = { github: "/icons/github.svg", linkedin: "/icons/linkedin.svg" } as const;

const icons = {
  check: Check,
  copy: Copy,
  download: Download,
  "external-link": ExternalLink,
  mail: Mail,
  "map-pin": MapPin,
  menu: Menu,
  moon: Moon,
  phone: Phone,
  sun: Sun,
  x: X,
};

export function Icon({ name, ...props }: LucideProps & { name: IconName }) {
  const IconComponent = icons[name];
  return <IconComponent aria-hidden="true" focusable="false" {...props} />;
}

export function BrandIcon({ brand, size = 20, className }: { brand: BrandName; size?: number; className?: string }) {
  const iconPath = brandIconPaths[brand];
  return <span aria-hidden="true" className={`brand-icon${className ? ` ${className}` : ""}`} style={{ height: size, maskImage: `url("${iconPath}")`, WebkitMaskImage: `url("${iconPath}")`, width: size }} />;
}
