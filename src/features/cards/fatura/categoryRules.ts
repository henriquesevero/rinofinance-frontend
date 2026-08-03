import type { Category } from "@/features/categories/types"

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
}

interface CategoryRule {
  merchants: string[]
  categoryNames: string[]
}

const RULES: CategoryRule[] = [
  {
    merchants: ["ifood", "ifd*", "ifd ", "99food", "99 food", "rappi", "uber eats", "ubereats", "uber *eats", "aiqfome", "delivery"],
    categoryNames: ["delivery", "alimenta", "restaurante"],
  },
  {
    merchants: [
      "uber", "99app", "99*", "99 tecnolog", "99pop", "cabify", "indriver", "taxi",
      "blablacar", "buser", "metro", "metrô", "bilhete unico", "riocard", "cptm",
    ],
    categoryNames: ["transporte", "carro"],
  },
  {
    merchants: [
      "posto", "combust", "gasolina", "shell", "ipiranga", "petrobras", "br mania",
      "ale ", "estacion", "estapar", "sem parar", "conectcar", "veloe", "autopista",
      "pedagio", "pedágio", "oficina", "autopeca", "autopeça", "goodyear",
    ],
    categoryNames: ["carro", "transporte"],
  },
  {
    merchants: [
      "mercado", "supermerc", "atacad", "carrefour", "pao de acucar", "pão de açúcar",
      "assai", "assaí", "extra ", "hortifruti", "sacol", "zaffari", "condor",
      "hipermercado", "mercearia", "emporio", "empório", "makro", "tenda atacado",
    ],
    categoryNames: ["alimenta", "almoco", "custo fixo"],
  },
  {
    merchants: [
      "restaurante", "lanchonete", "padaria", "pizza", "pizzar", "burger", "mc donald",
      "mcdonald", "burger king", "subway", "starbucks", "outback", "habib", "china in box",
      "sushi", "temaki", "hamburgueria", "cafe", "café", "bar ", "boteco", "churrasc",
      "acai", "açaí", "coco bambu", "madero", "girafas",
    ],
    categoryNames: ["restaurante", "almoco", "alimenta"],
  },
  {
    merchants: [
      "drogasil", "drogaria", "farmacia", "farmácia", "farma", "panvel", "raia",
      "pacheco", "pague menos", "ultrafarma", "hospital", "clinica", "clínica",
      "laborat", "unimed", "amil", "odont", "dentista", "psicolog", "fisioterap",
    ],
    categoryNames: ["saude"],
  },
  {
    merchants: [
      "salao", "salão", "cabeleire", "barbearia", "barber", "manicure", "estetica",
      "estética", "depilacao", "depilação", "sobrancelha", "spa ", "the beauty",
    ],
    categoryNames: ["estetica", "amenidades"],
  },
  {
    merchants: [
      "renner", "riachuelo", "c&a", "cea ", "zara", "hering", "shein", "marisa",
      "centauro", "netshoes", "nike", "adidas", "calcado", "calçado", "youcom",
      "farm rio", "reserva", "track field",
    ],
    categoryNames: ["roupas"],
  },
  {
    merchants: [
      "kabum", "pichau", "terabyte", "fast shop", "apple store", "samsung", "dell",
      "lenovo", "positivo", "fastshop", "gigantec",
    ],
    categoryNames: ["eletronico", "amenidades"],
  },
  {
    merchants: [
      "netflix", "spotify", "disney", "hbo", "max.com", "prime video", "amazon prime",
      "youtube", "deezer", "globoplay", "paramount", "apple.com", "icloud",
      "playstation", "xbox", "steam", "nintendo", "claude", "anthropic", "openai",
      "chatgpt", "*googl",
    ],
    categoryNames: ["entretenimento", "lazer", "anuidades"],
  },
  {
    merchants: ["cinema", "cinemark", "sympla", "ingresso", "eventim", "teatro", "show", "parque"],
    categoryNames: ["lazer", "entretenimento"],
  },
  {
    merchants: [
      "decolar", "latam", "gol ", "azul ", "booking", "airbnb", "hotel", "pousada",
      "cvc", "123milhas", "maxmilhas", "hurb", "localiza", "movida", "unidas",
    ],
    categoryNames: ["viagem"],
  },
  {
    merchants: [
      "alura", "udemy", "coursera", "hotmart", "curso", "faculdade", "universidade",
      "escola", "colegio", "colégio", "descomplica", "livraria", "kindle",
    ],
    categoryNames: ["estudos"],
  },
  {
    merchants: ["seguro", "seguradora", "porto seguro", "allianz", "prudential", "metlife", "sulamerica"],
    categoryNames: ["seguros"],
  },
  {
    merchants: [
      "aluguel", "condominio", "condomínio", "enel", "cemig", "cpfl", "light ", "energia",
      "sabesp", "sanepar", "copasa", "comgas", "gas natural", "vivo", "claro", "tim ",
      "oi fibra", "internet", "leroy", "telhanorte", "madeira madeira", "obramax", "c&c",
    ],
    categoryNames: ["moradia", "infraestrutura", "custo fixo"],
  },
]

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
