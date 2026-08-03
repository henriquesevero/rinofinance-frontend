import {
  Baby,
  BookOpen,
  Briefcase,
  Bus,
  Car,
  Clapperboard,
  Coffee,
  CreditCard,
  Dumbbell,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Music,
  PawPrint,
  PiggyBank,
  Plane,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Stethoscope,
  Tag,
  Utensils,
  Wifi,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react"

export const CATEGORY_ICONS: { name: string; Icon: LucideIcon }[] = [
  { name: "utensils", Icon: Utensils },
  { name: "cart", Icon: ShoppingCart },
  { name: "bag", Icon: ShoppingBag },
  { name: "car", Icon: Car },
  { name: "fuel", Icon: Fuel },
  { name: "bus", Icon: Bus },
  { name: "home", Icon: Home },
  { name: "zap", Icon: Zap },
  { name: "wifi", Icon: Wifi },
  { name: "phone", Icon: Smartphone },
  { name: "movie", Icon: Clapperboard },
  { name: "music", Icon: Music },
  { name: "game", Icon: Gamepad2 },
  { name: "gym", Icon: Dumbbell },
  { name: "health", Icon: HeartPulse },
  { name: "medical", Icon: Stethoscope },
  { name: "education", Icon: GraduationCap },
  { name: "books", Icon: BookOpen },
  { name: "travel", Icon: Plane },
  { name: "gift", Icon: Gift },
  { name: "coffee", Icon: Coffee },
  { name: "pet", Icon: PawPrint },
  { name: "baby", Icon: Baby },
  { name: "work", Icon: Briefcase },
  { name: "card", Icon: CreditCard },
  { name: "savings", Icon: PiggyBank },
  { name: "tools", Icon: Wrench },
]

const ICON_MAP = new Map(CATEGORY_ICONS.map((i) => [i.name, i.Icon]))

interface CategoryIconProps {
  name?: string
  className?: string
  style?: React.CSSProperties
}

export function CategoryIcon({ name, className, style }: CategoryIconProps) {
  const Icon = (name && ICON_MAP.get(name)) || Tag
  return <Icon className={className} style={style} />
}
