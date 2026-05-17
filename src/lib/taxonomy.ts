export const CORE_DIETARY = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "High Protein",
  "Low-Carb",
  "Keto",
  "Quick Meal",
] as const;

export const EXTRA_DIETARY = [
  "Halal",
  "Kosher",
  "Nut-Free",
  "Pescatarian",
] as const;

export const DEFAULT_DIETARY = [...CORE_DIETARY, ...EXTRA_DIETARY] as const;

export const DEFAULT_CUISINES = [
  "Any / Surprise Me",
  // East Asia
  "Chinese", "Cantonese", "Sichuan", "Hunan", "Japanese", "Korean", "Taiwanese", "Mongolian", "Tibetan",
  // SE Asia
  "Thai", "Vietnamese", "Filipino", "Indonesian", "Malaysian", "Singaporean", "Burmese", "Cambodian", "Laotian",
  // South Asia
  "Indian", "Pakistani", "Bangladeshi", "Sri Lankan", "Nepali / Himalayan", "Bhutanese", "Afghan", "South Asian Fusion",
  // Middle East
  "Persian / Iranian", "Turkish", "Lebanese", "Israeli", "Syrian", "Iraqi", "Yemeni", "Middle Eastern",
  // Africa
  "Moroccan", "Egyptian", "Ethiopian", "Eritrean", "Nigerian", "Ghanaian", "Senegalese", "Kenyan", "South African", "Tunisian", "Algerian", "African",
  // Europe
  "Italian", "French", "Spanish", "Portuguese", "Greek", "German", "Austrian", "Swiss", "British", "Scottish", "Irish",
  "Polish", "Russian", "Ukrainian", "Hungarian", "Czech", "Romanian", "Bulgarian", "Serbian", "Croatian",
  "Swedish", "Norwegian", "Danish", "Finnish", "Dutch", "Belgian", "Eastern European", "Mediterranean",
  // Americas
  "Mexican", "Tex-Mex", "American Southern", "Cajun / Creole", "Hawaiian", "Soul Food",
  "Peruvian", "Brazilian", "Argentinian", "Colombian", "Venezuelan", "Chilean", "Latin American",
  // Caribbean
  "Cuban", "Jamaican", "Puerto Rican", "Dominican", "Haitian", "Trinidadian", "Caribbean",
  // Oceania
  "Australian", "New Zealand", "Pacific Islander",
  // Fusion
  "Fusion", "Street Food", "Comfort Food",
];
