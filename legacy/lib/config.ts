export interface AppConfig {
  appInfo: {
    title: string
    subtitle: string
    description: string
    version: string
  }
  features: {
    familyHistory: boolean
    familyStats: boolean
    familyGeo: boolean
    familyAchievements: boolean
    treeSettings: boolean
    darkMode: boolean
    exportTree: boolean
    editMembers: boolean
  }
  navigation: {
    showNavbar: boolean
    showFooter: boolean
    smoothScroll: boolean
  }
  tree: {
    defaultOrientation: string
    defaultDirection: string
    enableZoom: boolean
    enableDrag: boolean
    showMiniTree: boolean
    showDetailPanel: boolean
  }
}

export interface FamilyBrief {
  familyName: string
  origin: string
  established: string
  description: string
  notableMembers: string
  currentGeneration: string
  totalMembers: number
  yearsOfHistory: number
  geography: {
    mainRegion: string
    description: string
  }
  achievements: string[]
}

export interface FooterConfig {
  familyInfo: {
    name: string
    description: string
  }
  contact: {
    location: string
    email: string
    phone: string
  }
  stats: {
    totalMembers: number
    generations: number
    yearsOfHistory: number
  }
  copyright: {
    year: number
    text: string
    madeWithLove: string
  }
}

export interface Theme {
  colors: {
    light: Record<string, string>
    dark: Record<string, string>
  }
  fonts: Record<string, string>
  spacing: Record<string, string>
  borderRadius: Record<string, string>
  shadows: Record<string, string>
  animations: {
    duration: Record<string, string>
    easing: Record<string, string>
  }
  tree: {
    defaultSettings: any
  }
}

// Config loading functions
export async function loadAppConfig(): Promise<AppConfig> {
  const response = await fetch("/config/app-config.json")
  return response.json()
}

export async function loadFamilyBrief(): Promise<FamilyBrief> {
  const response = await fetch("/config/family-brief.json")
  return response.json()
}

export async function loadFooterConfig(): Promise<FooterConfig> {
  const response = await fetch("/config/footer-config.json")
  return response.json()
}

export async function loadTheme(): Promise<Theme> {
  const response = await fetch("/config/theme.json")
  return response.json()
}
