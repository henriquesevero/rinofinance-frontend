import type { Category } from "@/features/categories/types"

// Lowercases and strips accents so "saude" matches "Saúde", "almoco" matches
// "Almoço", etc.
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
}

// A rule links merchant hints (found in a statement line) to a category
// concept. Because categories are user-defined, the concept is resolved to
// one of the USER's categories by name — `categoryNames` is tried in order,
// so the first that matches an existing category wins (priority).
interface CategoryRule {
  merchants: string[]
  categoryNames: string[]
}

// Tuned to the user's actual categories: Alimentação, Restaurantes, Delivery,
// Almoço, Moradia, Estudos, Saúde, Carro, Transporte, Lazer, Entretenimento,
// Seguros, Amenidades, Anuidades, Roupas, Infraestrutura Casa, Eletronicos,
// Viagem, Estética, Custo Fixo. All strings are accent-insensitive.
const RULES: CategoryRule[] = [
  // Delivery de comida (antes do transporte, p/ pegar "uber eats")
  {
    merchants: ["ifood", "ifd*", "ifd ", "99food", "99 food", "rappi", "uber eats", "ubereats", "uber *eats", "aiqfome", "delivery"],
    categoryNames: ["delivery", "alimenta", "restaurante"],
  },
  // Transporte por app / mobilidade
  {
    merchants: [
      "uber", "99app", "99*", "99 tecnolog", "99pop", "cabify", "indriver", "taxi",
      "blablacar", "buser", "metro", "metrô", "bilhete unico", "riocard", "cptm",
    ],
    categoryNames: ["transporte", "carro"],
  },
  // Combustível / carro
  {
    merchants: [
      "posto", "combust", "gasolina", "shell", "ipiranga", "petrobras", "br mania",
      "ale ", "estacion", "estapar", "sem parar", "conectcar", "veloe", "autopista",
      "pedagio", "pedágio", "oficina", "autopeca", "autopeça", "goodyear",
    ],
    categoryNames: ["carro", "transporte"],
  },
  // Mercado / supermercado -> Alimentação (não há categoria "Mercado")
  {
    merchants: [
      "mercado", "supermerc", "atacad", "carrefour", "pao de acucar", "pão de açúcar",
      "assai", "assaí", "extra ", "hortifruti", "sacol", "zaffari", "condor",
      "hipermercado", "mercearia", "emporio", "empório", "makro", "tenda atacado",
    ],
    categoryNames: ["alimenta", "almoco", "custo fixo"],
  },
  // Restaurantes / lanches
  {
    merchants: [
      "restaurante", "lanchonete", "padaria", "pizza", "pizzar", "burger", "mc donald",
      "mcdonald", "burger king", "subway", "starbucks", "outback", "habib", "china in box",
      "sushi", "temaki", "hamburgueria", "cafe", "café", "bar ", "boteco", "churrasc",
      "acai", "açaí", "coco bambu", "madero", "girafas",
    ],
    categoryNames: ["restaurante", "almoco", "alimenta"],
  },
  // Saúde / farmácia
  {
    merchants: [
      "drogasil", "drogaria", "farmacia", "farmácia", "farma", "panvel", "raia",
      "pacheco", "pague menos", "ultrafarma", "hospital", "clinica", "clínica",
      "laborat", "unimed", "amil", "odont", "dentista", "psicolog", "fisioterap",
    ],
    categoryNames: ["saude"],
  },
  // Estética / beleza
  {
    merchants: [
      "salao", "salão", "cabeleire", "barbearia", "barber", "manicure", "estetica",
      "estética", "depilacao", "depilação", "sobrancelha", "spa ", "the beauty",
    ],
    categoryNames: ["estetica", "amenidades"],
  },
  // Roupas / vestuário
  {
    merchants: [
      "renner", "riachuelo", "c&a", "cea ", "zara", "hering", "shein", "marisa",
      "centauro", "netshoes", "nike", "adidas", "calcado", "calçado", "youcom",
      "farm rio", "reserva", "track field",
    ],
    categoryNames: ["roupas"],
  },
  // Eletrônicos
  {
    merchants: [
      "kabum", "pichau", "terabyte", "fast shop", "apple store", "samsung", "dell",
      "lenovo", "positivo", "fastshop", "gigantec",
    ],
    categoryNames: ["eletronico", "amenidades"],
  },
  // Streaming / serviços digitais -> Entretenimento
  {
    merchants: [
      "netflix", "spotify", "disney", "hbo", "max.com", "prime video", "amazon prime",
      "youtube", "deezer", "globoplay", "paramount", "apple.com", "icloud",
      "playstation", "xbox", "steam", "nintendo", "claude", "anthropic", "openai",
      "chatgpt", "*googl",
    ],
    categoryNames: ["entretenimento", "lazer", "anuidades"],
  },
  // Lazer / eventos
  {
    merchants: ["cinema", "cinemark", "sympla", "ingresso", "eventim", "teatro", "show", "parque"],
    categoryNames: ["lazer", "entretenimento"],
  },
  // Viagem
  {
    merchants: [
      "decolar", "latam", "gol ", "azul ", "booking", "airbnb", "hotel", "pousada",
      "cvc", "123milhas", "maxmilhas", "hurb", "localiza", "movida", "unidas",
    ],
    categoryNames: ["viagem"],
  },
  // Estudos / educação
  {
    merchants: [
      "alura", "udemy", "coursera", "hotmart", "curso", "faculdade", "universidade",
      "escola", "colegio", "colégio", "descomplica", "livraria", "kindle",
    ],
    categoryNames: ["estudos"],
  },
  // Seguros
  {
    merchants: ["seguro", "seguradora", "porto seguro", "allianz", "prudential", "metlife", "sulamerica"],
    categoryNames: ["seguros"],
  },
  // Moradia / contas da casa
  {
    merchants: [
      "aluguel", "condominio", "condomínio", "enel", "cemig", "cpfl", "light ", "energia",
      "sabesp", "sanepar", "copasa", "comgas", "gas natural", "vivo", "claro", "tim ",
      "oi fibra", "internet", "leroy", "telhanorte", "madeira madeira", "obramax", "c&c",
    ],
    categoryNames: ["moradia", "infraestrutura", "custo fixo"],
  },
]

// Suggests one of the user's own category ids for a purchase description, or
// "" when nothing matches (unknown merchant, or no fitting category exists).
export function suggestCategoryId(description: string, categories: Category[]): string {
  const desc = normalize(description)
  const cats = categories.map((c) => ({ id: c.id, name: normalize(c.name) }))
  for (const rule of RULES) {
    if (!rule.merchants.some((m) => desc.includes(normalize(m)))) continue
    for (const hint of rule.categoryNames) {
      const match = cats.find((c) => c.name.includes(hint))
      if (match) return match.id
    }
  }
  return ""
}
