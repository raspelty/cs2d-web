export interface SkinData {
  name: string;
  weapon: string;
  rarity: string;
  collection: string;
  url: string;
  price?: { min: number; max: number };
}

// Rarity colors (CS2 style)
export const RARITY_COLORS: Record<string, string> = {
  'Covert': '#eb4b4b',
  'Classified': '#d32ce6',
  'Restricted': '#8847ff',
  'Mil-spec': '#4b69ff',
  'Industrial Grade': '#5e98d9',
  'Consumer Grade': '#b0c3d9',
  'Extraordinary': '#e4ae39',
};

export function getRarityColor(rarity: string): string {
  for (const [key, color] of Object.entries(RARITY_COLORS)) {
    if (rarity.includes(key)) return color;
  }
  return '#b0c3d9';
}

// Map skin weapon names to our weapon IDs
const WEAPON_NAME_MAP: Record<string, string> = {
  'AK-47': 'ak47',
  'AWP': 'awp',
  'USP-S': 'usp',
  'M4A1-S': 'm4a1s',
  'M4A4': 'm4a4',
  'Glock-18': 'glock',
  'P250': 'p250',
  'Desert Eagle': 'deagle',
  'MAC-10': 'mac10',
  'MP9': 'mp9',
  'P90': 'p90',
  'SSG 08': 'ssg08',
  'Nova': 'nova',
  'Five-SeveN': 'p250', // mapped to closest
  'Tec-9': 'glock',
  'Galil AR': 'galil',
  'FAMAS': 'famas',
};

export function getWeaponIdForSkin(skinWeapon: string): string | null {
  return WEAPON_NAME_MAP[skinWeapon] || null;
}

// All skins from user data
export const ALL_SKINS: SkinData[] = [
  { name: 'Inheritance', weapon: 'AK-47', rarity: 'Covert Rifle', collection: 'The Kilowatt Collection', url: 'https://www.csgodatabase.com/images/skins/AK-47_Inheritance.png', price: { min: 47, max: 279.75 } },
  { name: 'Chrome Cannon', weapon: 'AWP', rarity: 'Covert Sniper Rifle', collection: 'The Kilowatt Collection', url: 'https://www.csgodatabase.com/images/skins/AWP_Chrome_Cannon.png', price: { min: 12.8, max: 163.46 } },
  { name: 'Jawbreaker', weapon: 'USP-S', rarity: 'Classified Pistol', collection: 'The Kilowatt Collection', url: 'https://www.csgodatabase.com/images/skins/USP-S_Jawbreaker.png', price: { min: 4.12, max: 42.96 } },
  { name: 'Black Lotus', weapon: 'M4A1-S', rarity: 'Classified Rifle', collection: 'The Kilowatt Collection', url: 'https://www.csgodatabase.com/images/skins/M4A1-S_Black_Lotus.png', price: { min: 6.73, max: 34.77 } },
  { name: 'Etch Lord', weapon: 'M4A4', rarity: 'Restricted Rifle', collection: 'The Kilowatt Collection', url: 'https://www.csgodatabase.com/images/skins/M4A4_Etch_Lord.png', price: { min: 0.46, max: 10.5 } },
  { name: 'Block-18', weapon: 'Glock-18', rarity: 'Restricted Pistol', collection: 'The Kilowatt Collection', url: 'https://www.csgodatabase.com/images/skins/Glock-18_Block-18.png', price: { min: 0.55, max: 3.76 } },
  { name: 'Hybrid', weapon: 'Five-SeveN', rarity: 'Restricted Pistol', collection: 'The Kilowatt Collection', url: 'https://www.csgodatabase.com/images/skins/Five-SeveN_Hybrid.png', price: { min: 0.42, max: 8.74 } },
  { name: 'Just Smile', weapon: 'MP7', rarity: 'Restricted SMG', collection: 'The Kilowatt Collection', url: 'https://www.csgodatabase.com/images/skins/MP7_Just_Smile.png', price: { min: 0.45, max: 7.54 } },
  { name: 'Light Box', weapon: 'MAC-10', rarity: 'Mil-spec SMG', collection: 'The Kilowatt Collection', url: 'https://www.csgodatabase.com/images/skins/MAC-10_Light_Box.png', price: { min: 0.07, max: 1.53 } },
  { name: 'Dark Sigil', weapon: 'Nova', rarity: 'Mil-spec Shotgun', collection: 'The Kilowatt Collection', url: 'https://www.csgodatabase.com/images/skins/Nova_Dark_Sigil.png', price: { min: 0.06, max: 16.97 } },
  { name: 'Dezastre', weapon: 'SSG 08', rarity: 'Mil-spec Sniper Rifle', collection: 'The Kilowatt Collection', url: 'https://www.csgodatabase.com/images/skins/SSG_08_Dezastre.png', price: { min: 0.07, max: 1.31 } },
  { name: 'Head Shot', weapon: 'AK-47', rarity: 'Covert Rifle', collection: 'The Revolution Collection', url: 'https://www.csgodatabase.com/images/skins/AK-47_Head_Shot.png', price: { min: 29.04, max: 201.4 } },
  { name: 'Temukau', weapon: 'M4A4', rarity: 'Covert Rifle', collection: 'The Revolution Collection', url: 'https://www.csgodatabase.com/images/skins/M4A4_Temukau.png', price: { min: 29.58, max: 206.31 } },
  { name: 'Duality', weapon: 'AWP', rarity: 'Classified Sniper Rifle', collection: 'The Revolution Collection', url: 'https://www.csgodatabase.com/images/skins/AWP_Duality.png', price: { min: 3.28, max: 43.4 } },
  { name: 'Wicked Sick', weapon: 'P2000', rarity: 'Classified Pistol', collection: 'The Revolution Collection', url: 'https://www.csgodatabase.com/images/skins/P2000_Wicked_Sick.png', price: { min: 3.33, max: 62.97 } },
  { name: 'Emphorosaur-S', weapon: 'M4A1-S', rarity: 'Restricted Rifle', collection: 'The Revolution Collection', url: 'https://www.csgodatabase.com/images/skins/M4A1-S_Emphorosaur-S.png', price: { min: 0.54, max: 6.26 } },
  { name: 'Umbral Rabbit', weapon: 'Glock-18', rarity: 'Restricted Pistol', collection: 'The Revolution Collection', url: 'https://www.csgodatabase.com/images/skins/Glock-18_Umbral_Rabbit.png', price: { min: 0.46, max: 4.21 } },
  { name: 'Sakkaku', weapon: 'MAC-10', rarity: 'Restricted SMG', collection: 'The Revolution Collection', url: 'https://www.csgodatabase.com/images/skins/MAC-10_Sakkaku.png', price: { min: 0.43, max: 1.74 } },
  { name: 'Chromatic Aberration', weapon: 'AWP', rarity: 'Covert Sniper Rifle', collection: 'The Recoil Collection', url: 'https://www.csgodatabase.com/images/skins/AWP_Chromatic_Aberration.png', price: { min: 29.75, max: 168.65 } },
  { name: 'Printstream', weapon: 'USP-S', rarity: 'Covert Pistol', collection: 'The Recoil Collection', url: 'https://www.csgodatabase.com/images/skins/USP-S_Printstream.png', price: { min: 33.37, max: 208.15 } },
  { name: 'Ice Coaled', weapon: 'AK-47', rarity: 'Classified Rifle', collection: 'The Recoil Collection', url: 'https://www.csgodatabase.com/images/skins/AK-47_Ice_Coaled.png', price: { min: 4.39, max: 27.71 } },
  // Knives
  { name: 'Kukri Knife', weapon: '★ Kukri Knife', rarity: 'Extraordinary Knife', collection: '', url: 'https://www.csgodatabase.com/images/knives/Kukri_Knife.png' },
  { name: 'Kukri Fade', weapon: '★ Kukri Knife', rarity: 'Extraordinary Knife', collection: '', url: 'https://www.csgodatabase.com/images/knives/Kukri_Knife_Fade.png', price: { min: 229.86, max: 446.03 } },
  { name: 'Kukri Crimson Web', weapon: '★ Kukri Knife', rarity: 'Extraordinary Knife', collection: '', url: 'https://www.csgodatabase.com/images/knives/Kukri_Knife_Crimson_Web.png', price: { min: 88.63, max: 954.68 } },
  { name: 'Kukri Slaughter', weapon: '★ Kukri Knife', rarity: 'Extraordinary Knife', collection: '', url: 'https://www.csgodatabase.com/images/knives/Kukri_Knife_Slaughter.png', price: { min: 158.8, max: 309.83 } },
  { name: 'Kukri Case Hardened', weapon: '★ Kukri Knife', rarity: 'Extraordinary Knife', collection: '', url: 'https://www.csgodatabase.com/images/knives/Kukri_Knife_Case_Hardened.png', price: { min: 108.39, max: 370.01 } },
];

export function getSkinsForWeapon(weaponName: string): SkinData[] {
  return ALL_SKINS.filter(s => s.weapon === weaponName || getWeaponIdForSkin(s.weapon) === weaponName);
}
