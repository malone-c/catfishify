export type ArcadeArticle = {
  id: string
  title: string
  emoji: string
  summary: string
  aliases: string[]
  categories: string[]
}

export const arcadeArticles: ArcadeArticle[] = [
  {
    id: 'einstein',
    title: 'Albert Einstein',
    emoji: '⚛',
    summary: 'A patent clerk whose ideas reshaped modern physics.',
    aliases: ['The patent clerk', 'Person of the Century'],
    categories: [
      '1879 births',
      'German theoretical physicists',
      'Institute for Advanced Study faculty',
      'Nobel laureates in Physics',
      'Time Person of the Century',
      'Swiss patent office people',
    ],
  },
  {
    id: 'lovelace',
    title: 'Ada Lovelace',
    emoji: '⌘',
    summary: 'A Victorian mathematician who imagined more than calculation.',
    aliases: ['Enchantress of Numbers', 'Augusta Ada King'],
    categories: [
      '1815 births',
      'English mathematicians',
      'English women computer scientists',
      'People of the Industrial Revolution',
      'Women of the Victorian era',
      'History of computing in the United Kingdom',
    ],
  },
  {
    id: 'axolotl',
    title: 'Axolotl',
    emoji: '✣',
    summary: 'A lake-dwelling salamander famous for keeping its youthful form.',
    aliases: ['Mexican walking fish', 'Water monster'],
    categories: [
      'Ambystoma',
      'Amphibians of Mexico',
      'Critically endangered biota of Mexico',
      'Endemic fauna of Mexico',
      'Paedomorphism',
      'Regeneration in animals',
    ],
  },
  {
    id: 'everest',
    title: 'Mount Everest',
    emoji: '△',
    summary: 'Earth’s highest summit, straddling two countries.',
    aliases: ['Sagarmatha', 'Chomolungma'],
    categories: [
      'China–Nepal border',
      'Eight-thousanders',
      'Extreme points of Earth',
      'Highest points of countries',
      'Mountains of Tibet',
      'Seven Summits',
    ],
  },
  {
    id: 'kahlo',
    title: 'Frida Kahlo',
    emoji: '❀',
    summary: 'A Mexican painter who turned autobiography into iconography.',
    aliases: ['Magdalena Carmen Frida Kahlo y Calderón'],
    categories: [
      '1907 births',
      'Mexican portrait painters',
      'Mexican women painters',
      'People with polio',
      'Surrealist artists',
      'Self-portraitists',
    ],
  },
  {
    id: 'voyager',
    title: 'Voyager 1',
    emoji: '✦',
    summary: 'A robotic explorer carrying a message beyond the planets.',
    aliases: ['Mariner Jupiter-Saturn 1977'],
    categories: [
      '1977 in spaceflight',
      'Interstellar messages',
      'NASA space probes',
      'Nuclear-powered robots',
      'Spacecraft escaping the Solar System',
      'Voyager program',
    ],
  },
  {
    id: 'pizza',
    title: 'Pizza',
    emoji: '◒',
    summary: 'A flatbread that became one of the world’s most travelled foods.',
    aliases: ['Pizza pie'],
    categories: [
      'Flatbreads',
      'Foods with tomato',
      'Italian cuisine',
      'National dishes',
      'Neapolitan cuisine',
      'Street food',
    ],
  },
  {
    id: 'octopus',
    title: 'Octopus',
    emoji: '≈',
    summary: 'A soft-bodied marine animal with eight arms and startling intelligence.',
    aliases: ['Devilfish'],
    categories: [
      'Aquatic molluscs',
      'Camouflaging animals',
      'Cephalopods',
      'Edible molluscs',
      'Molluscs described in 1758',
      'Octopuses',
    ],
  },
  {
    id: 'curie',
    title: 'Marie Curie',
    emoji: '☢',
    summary: 'A physicist and chemist who won Nobel Prizes in two sciences.',
    aliases: ['Madame Curie', 'Maria Skłodowska-Curie'],
    categories: [
      '1867 births',
      'Nobel laureates in Chemistry',
      'Nobel laureates in Physics',
      'Polish women physicists',
      'Women Nobel laureates',
      'Discoverers of chemical elements',
    ],
  },
  {
    id: 'lamarr',
    title: 'Hedy Lamarr',
    emoji: '⌁',
    summary: 'A film star and inventor whose radio ideas echoed into wireless technology.',
    aliases: ['Hedwig Kiesler'],
    categories: [
      'American film actresses',
      'Austrian emigrants to the United States',
      'Inventors from Austria-Hungary',
      'MGM contract players',
      'Wireless pioneers',
      'Women inventors',
    ],
  },
  {
    id: 'reef',
    title: 'Great Barrier Reef',
    emoji: '≋',
    summary: 'The world’s largest coral reef system, visible at continental scale.',
    aliases: ['The Reef'],
    categories: [
      'Coral reefs of Australia',
      'Geography of Queensland',
      'Marine parks of Australia',
      'Natural wonders of the world',
      'Pacific Ocean',
      'World Heritage Sites in Australia',
    ],
  },
  {
    id: 'chess',
    title: 'Chess',
    emoji: '♞',
    summary: 'A two-player strategy game descended from an ancient Indian board game.',
    aliases: ['The royal game'],
    categories: [
      'Abstract strategy games',
      'Games of mental skill',
      'Indian inventions',
      'Traditional board games',
      'Two-player games',
      'Games related to chaturanga',
    ],
  },
]

export const articleById = Object.fromEntries(
  arcadeArticles.map(article => [article.id, article]),
) as Record<string, ArcadeArticle>

export type RedHerringRound = {
  articleId: string
  clues: string[]
  herring: string
  source: string
}

export const redHerringRounds: RedHerringRound[] = [
  {
    articleId: 'einstein',
    clues: ['German theoretical physicists', 'Nobel laureates in Physics', 'Time Person of the Century'],
    herring: 'Wireless pioneers',
    source: 'Hedy Lamarr',
  },
  {
    articleId: 'axolotl',
    clues: ['Amphibians of Mexico', 'Endemic fauna of Mexico', 'Paedomorphism'],
    herring: 'Camouflaging animals',
    source: 'Octopus',
  },
  {
    articleId: 'everest',
    clues: ['China–Nepal border', 'Eight-thousanders', 'Seven Summits'],
    herring: 'Pacific Ocean',
    source: 'Great Barrier Reef',
  },
  {
    articleId: 'curie',
    clues: ['Nobel laureates in Chemistry', 'Women Nobel laureates', 'Discoverers of chemical elements'],
    herring: 'English women computer scientists',
    source: 'Ada Lovelace',
  },
  {
    articleId: 'pizza',
    clues: ['Flatbreads', 'Italian cuisine', 'Neapolitan cuisine'],
    herring: 'Traditional board games',
    source: 'Chess',
  },
]

export type MultipleChoiceRound = {
  articleId: string
  choiceIds: string[]
}

export const multipleChoiceRounds: MultipleChoiceRound[] = [
  { articleId: 'lovelace', choiceIds: ['lovelace', 'curie', 'lamarr', 'kahlo'] },
  { articleId: 'voyager', choiceIds: ['voyager', 'reef', 'everest', 'einstein'] },
  { articleId: 'octopus', choiceIds: ['octopus', 'axolotl', 'reef', 'pizza'] },
  { articleId: 'chess', choiceIds: ['chess', 'pizza', 'einstein', 'everest'] },
  { articleId: 'lamarr', choiceIds: ['lamarr', 'lovelace', 'kahlo', 'curie'] },
]

export function seededShuffle<T>(items: T[], seed: number): T[] {
  const result = [...items]
  let state = seed || 1
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0
    const swapIndex = state % (index + 1)
    const value = result[index]
    result[index] = result[swapIndex]
    result[swapIndex] = value
  }
  return result
}

export function stringSeed(value: string): number {
  let seed = 2166136261
  for (const character of value) {
    seed ^= character.charCodeAt(0)
    seed = Math.imul(seed, 16777619)
  }
  return seed >>> 0
}
