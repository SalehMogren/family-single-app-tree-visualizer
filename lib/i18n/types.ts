import { SupportedLanguage } from "./config";

// Translation namespace types
export interface CommonTranslations {
  // Basic actions
  save: string;
  cancel: string;
  edit: string;
  delete: string;
  add: string;
  close: string;
  back: string;
  next: string;
  confirm: string;

  // Status
  loading: string;
  success: string;
  error: string;
  warning: string;
  info: string;

  // Navigation
  home: string;
  settings: string;
  about: string;
  help: string;

  // Time
  today: string;
  yesterday: string;
  tomorrow: string;

  // Generic
  yes: string;
  no: string;
  ok: string;
  clear: string;
  reset: string;
  search: string;
  filter: string;
  sort: string;

  // Tree specific
  tree: string;
  node: string;
  member: string;
  person: string;
  family: string;
}

export interface FormsTranslations {
  // Field labels
  name: string;
  gender: string;
  birthYear: string;
  deathYear: string;
  occupation: string;
  location: string;
  notes: string;

  // Gender options
  male: string;
  female: string;

  // Placeholders
  namePlaceholder: string;
  birthYearPlaceholder: string;
  deathYearPlaceholder: string;
  occupationPlaceholder: string;
  locationPlaceholder: string;
  notesPlaceholder: string;

  // Validation messages
  nameRequired: string;
  birthYearRequired: string;
  invalidYear: string;
  deathBeforeBirth: string;

  // Form titles
  addMember: string;
  editMember: string;
  memberInfo: string;
}

export interface RelationshipsTranslations {
  // Relationship types
  parent: string;
  father: string;
  mother: string;
  spouse: string;
  husband: string;
  wife: string;
  child: string;
  son: string;
  daughter: string;
  sibling: string;
  brother: string;
  sister: string;

  // Extended family
  grandparent: string;
  grandfather: string;
  grandmother: string;
  grandchild: string;
  grandson: string;
  granddaughter: string;
  uncle: string;
  aunt: string;
  nephew: string;
  niece: string;
  cousin: string;

  // In-laws
  fatherInLaw: string;
  motherInLaw: string;
  sonInLaw: string;
  daughterInLaw: string;
  brotherInLaw: string;
  sisterInLaw: string;

  // Actions
  addParent: string;
  addSpouse: string;
  addChild: string;
  addSibling: string;
  disconnect: string;
  remove: string;
  connect: string;

  // Labels
  parents: string;
  spouses: string;
  children: string;
  siblings: string;
  relationships: string;

  // Relationship manager
  quickAdd: string;
  suggestions: string;
  extended: string;
  modify: string;
  validation: string;

  // Smart suggestions
  smartSuggestions: string;
  noSuggestions: string;
  highPriority: string;
  mediumPriority: string;
  lowPriority: string;

  // Validation messages
  noParents: string;
  ageIssue: string;
  potentialDuplicate: string;
  relationshipsLookGood: string;
}

export interface ToolbarTranslations {
  // File operations
  save: string;
  load: string;
  export: string;
  import: string;

  // History
  undo: string;
  redo: string;

  // View controls
  zoomIn: string;
  zoomOut: string;
  resetView: string;
  fullView: string;
  focusView: string;

  // Layout
  layout: string;
  theme: string;
  darkMode: string;
  lightMode: string;

  // Language
  language: string;
  arabic: string;
  english: string;

  // Statistics
  statistics: string;
  nodesDisplayed: string;
  totalMembers: string;
  treeStats: string;

  // Tooltips
  saveTooltip: string;
  loadTooltip: string;
  exportTooltip: string;
  undoTooltip: string;
  redoTooltip: string;
  zoomInTooltip: string;
  zoomOutTooltip: string;
  resetViewTooltip: string;
}

export interface MessagesTranslations {
  // Success messages
  memberAdded: string;
  memberUpdated: string;
  memberDeleted: string;
  relationshipConnected: string;
  relationshipDisconnected: string;
  dataExported: string;
  dataImported: string;

  // Error messages
  saveError: string;
  deleteError: string;
  relationshipError: string;
  exportError: string;
  importError: string;
  fileError: string;

  // Confirmation messages
  deleteConfirmation: string;
  disconnectConfirmation: string;
  removeConfirmation: string;

  // Info messages
  emptyTree: string;
  startBuilding: string;
  addFirstPerson: string;
  selectMember: string;

  // Warning messages
  unsavedChanges: string;
  invalidData: string;

  // Relationship specific success messages
  parentAdded: string;
  spouseAdded: string;
  childAdded: string;
  siblingAdded: string;

  // Relationship specific error messages
  parentError: string;
  spouseError: string;
  childError: string;
  siblingError: string;
}

export interface FamilyTreeTranslations {
  zoomIn: string;
  zoomOut: string;
  resetView: string;
  settings: string;
  exportPNG: string;
  exportPDF: string;
  width: string;
  height: string;
  horizontalSpacing: string;
  verticalSpacing: string;
  maleColor: string;
  femaleColor: string;
  linkColor: string;
  showName: string;
  showBirthYear: string;
  showDeathYear: string;
  showSpouses: string;
  showGenderIcon: string;
}

// Main translations interface
export interface Translations {
  common: CommonTranslations;
  forms: FormsTranslations;
  relationships: RelationshipsTranslations;
  toolbar: ToolbarTranslations;
  messages: MessagesTranslations;
  familyTree: FamilyTreeTranslations;
}

// Language direction type
export type Direction = "ltr" | "rtl";

// Language context type
export interface LanguageContextType {
  language: SupportedLanguage;
  direction: Direction;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: string, options?: any) => string;
}

// Translation key paths (for type safety)
export type TranslationKey =
  | `common.${keyof CommonTranslations}`
  | `forms.${keyof FormsTranslations}`
  | `relationships.${keyof RelationshipsTranslations}`
  | `toolbar.${keyof ToolbarTranslations}`
  | `messages.${keyof MessagesTranslations}`
  | `familyTree.${keyof FamilyTreeTranslations}`;

// Hook return type
export interface UseTranslationReturn {
  t: (key: string) => string;
  language: SupportedLanguage;
  direction: Direction;
  isRTL: boolean;
  changeLanguage: (language: SupportedLanguage) => void;
}
