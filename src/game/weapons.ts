import { Weapon } from './types';

export interface WeaponDef {
  id: string;
  name: string;
  type: 'pistol' | 'smg' | 'rifle' | 'sniper' | 'shotgun' | 'heavy' | 'knife' | 'grenade' | 'equipment';
  side: 'both' | 'ct' | 't';
  damage: number;
  headshotDamage: number;
  armorPenetration: number;
  fireRate: number;
  ammo: number;
  maxAmmo: number;
  reserveAmmo: number;
  spread: number;
  movementSpread: number;
  recoilPattern: number[];
  recoilHorizontal: number;
  recoilRecovery: number;
  price: number;
  killReward: number;
  penetration: number;
  range: number;
  reloadTime: number;
  movementSpeed: number;
  automatic: boolean;
  slot?: 'primary' | 'secondary' | 'grenade' | 'equipment';
  grenadeType?: 'he' | 'flash' | 'smoke' | 'molotov' | 'decoy';
  throwForce?: number;
  radius?: number;
  duration?: number;
}

export const WEAPONS: Record<string, WeaponDef> = {
  // === PISTOLS ===
  glock: {
    id: 'glock', name: 'Glock-18', type: 'pistol', side: 't',
    damage: 26, headshotDamage: 88, armorPenetration: 0.65,
    fireRate: 0.12, ammo: 20, maxAmmo: 20, reserveAmmo: 120,
    spread: 0.05, movementSpread: 0.02,
    recoilPattern: [1.0, 1.3, 1.6, 2.0, 2.4, 2.8],
    recoilHorizontal: 0.8, recoilRecovery: 8,
    price: 200, killReward: 300,
    penetration: 0.5, range: 800, reloadTime: 2.2,
    movementSpeed: 1.0, automatic: true,
    slot: 'secondary',
  },
  
  usp: {
    id: 'usp', name: 'USP-S', type: 'pistol', side: 'ct',
    damage: 32, headshotDamage: 102, armorPenetration: 0.7,
    fireRate: 0.15, ammo: 12, maxAmmo: 12, reserveAmmo: 24,
    spread: 0.04, movementSpread: 0.015,
    recoilPattern: [1.0, 1.2, 1.5, 1.8, 2.0],
    recoilHorizontal: 0.5, recoilRecovery: 10,
    price: 200, killReward: 300,
    penetration: 0.6, range: 900, reloadTime: 2.2,
    movementSpeed: 1.0, automatic: false,
    slot: 'secondary',
  },
  
  p250: {
    id: 'p250', name: 'P250', type: 'pistol', side: 'both',
    damage: 35, headshotDamage: 110, armorPenetration: 0.75,
    fireRate: 0.14, ammo: 13, maxAmmo: 13, reserveAmmo: 26,
    spread: 0.045, movementSpread: 0.018,
    recoilPattern: [1.2, 1.5, 1.9, 2.3, 2.7],
    recoilHorizontal: 0.7, recoilRecovery: 9,
    price: 300, killReward: 300,
    penetration: 0.65, range: 850, reloadTime: 2.2,
    movementSpeed: 1.0, automatic: false,
    slot: 'secondary',
  },
  
  deagle: {
    id: 'deagle', name: 'Desert Eagle', type: 'pistol', side: 'both',
    damage: 53, headshotDamage: 175, armorPenetration: 0.9,
    fireRate: 0.45, ammo: 7, maxAmmo: 7, reserveAmmo: 35,
    spread: 0.03, movementSpread: 0.06,
    recoilPattern: [4.0, 5.0, 6.0, 7.0, 8.0],
    recoilHorizontal: 2.5, recoilRecovery: 4,
    price: 700, killReward: 300,
    penetration: 0.9, range: 1200, reloadTime: 2.2,
    movementSpeed: 0.95, automatic: false,
    slot: 'secondary',
  },

  // === SMGS ===
  mac10: {
    id: 'mac10', name: 'MAC-10', type: 'smg', side: 't',
    damage: 29, headshotDamage: 92, armorPenetration: 0.6,
    fireRate: 0.075, ammo: 30, maxAmmo: 30, reserveAmmo: 100,
    spread: 0.06, movementSpread: 0.005,
    recoilPattern: [1.0, 1.2, 1.5, 1.8, 2.0, 2.2, 2.0, 1.8, 2.2, 2.5],
    recoilHorizontal: 1.5, recoilRecovery: 12,
    price: 1050, killReward: 600,
    penetration: 0.4, range: 600, reloadTime: 3.1,
    movementSpeed: 1.0, automatic: true,
    slot: 'primary',
  },
  
  mp9: {
    id: 'mp9', name: 'MP9', type: 'smg', side: 'ct',
    damage: 26, headshotDamage: 85, armorPenetration: 0.55,
    fireRate: 0.07, ammo: 30, maxAmmo: 30, reserveAmmo: 120,
    spread: 0.05, movementSpread: 0.005,
    recoilPattern: [1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.0, 1.8, 2.2],
    recoilHorizontal: 1.2, recoilRecovery: 13,
    price: 1250, killReward: 600,
    penetration: 0.45, range: 650, reloadTime: 2.1,
    movementSpeed: 1.0, automatic: true,
    slot: 'primary',
  },
  
  p90: {
    id: 'p90', name: 'P90', type: 'smg', side: 'both',
    damage: 26, headshotDamage: 84, armorPenetration: 0.6,
    fireRate: 0.07, ammo: 50, maxAmmo: 50, reserveAmmo: 100,
    spread: 0.055, movementSpread: 0.008,
    recoilPattern: [0.8, 1.0, 1.2, 1.5, 1.8, 2.0, 2.2, 2.5, 2.2, 2.0, 2.5, 2.8],
    recoilHorizontal: 1.0, recoilRecovery: 10,
    price: 2350, killReward: 300,
    penetration: 0.5, range: 700, reloadTime: 3.3,
    movementSpeed: 0.96, automatic: true,
    slot: 'primary',
  },

  // === RIFLES ===
  ak47: {
    id: 'ak47', name: 'AK-47', type: 'rifle', side: 't',
    damage: 36, headshotDamage: 116, armorPenetration: 0.85,
    fireRate: 0.1, ammo: 30, maxAmmo: 30, reserveAmmo: 90,
    spread: 0.02, movementSpread: 0.06,
    recoilPattern: [1.5, 2.0, 3.0, 3.5, 4.0, 3.5, 2.5, 1.5, 0.5, -0.5, -1.5, -2.5, -1.5, 0, 1.5, 2.5, 3.0, 2.0, 1.0, -1.0, -2.0, -1.0, 0.5, 1.5, 2.0, 1.0, -0.5, -1.5, -0.5, 1.0],
    recoilHorizontal: 1.5, recoilRecovery: 5,
    price: 2700, killReward: 300,
    penetration: 0.8, range: 1200, reloadTime: 2.5,
    movementSpeed: 0.88, automatic: true,
    slot: 'primary',
  },
  
  m4a4: {
    id: 'm4a4', name: 'M4A4', type: 'rifle', side: 'ct',
    damage: 33, headshotDamage: 105, armorPenetration: 0.8,
    fireRate: 0.09, ammo: 30, maxAmmo: 30, reserveAmmo: 90,
    spread: 0.018, movementSpread: 0.055,
    recoilPattern: [1.2, 1.8, 2.5, 3.0, 3.5, 3.0, 2.0, 1.0, 0, -1.0, -2.0, -1.5, -0.5, 0.5, 1.5, 2.5, 2.0, 1.0, -0.5, -1.5, -1.0, 0, 1.0, 2.0, 1.5, 0.5, -0.5, -1.0, 0, 1.0],
    recoilHorizontal: 1.2, recoilRecovery: 6,
    price: 3100, killReward: 300,
    penetration: 0.7, range: 1100, reloadTime: 3.1,
    movementSpeed: 0.88, automatic: true,
    slot: 'primary',
  },
  
  m4a1s: {
    id: 'm4a1s', name: 'M4A1-S', type: 'rifle', side: 'ct',
    damage: 38, headshotDamage: 120, armorPenetration: 0.85,
    fireRate: 0.1, ammo: 20, maxAmmo: 20, reserveAmmo: 40,
    spread: 0.015, movementSpread: 0.05,
    recoilPattern: [1.0, 1.5, 2.0, 2.5, 3.0, 2.5, 1.5, 0.5, -0.5, -1.5, -1.0, 0, 1.0, 2.0, 1.5, 0.5, -0.5, -1.0, 0, 1.0],
    recoilHorizontal: 0.8, recoilRecovery: 6,
    price: 2900, killReward: 300,
    penetration: 0.7, range: 1100, reloadTime: 3.1,
    movementSpeed: 0.88, automatic: true,
    slot: 'primary',
  },
  
  galil: {
    id: 'galil', name: 'Galil AR', type: 'rifle', side: 't',
    damage: 30, headshotDamage: 96, armorPenetration: 0.75,
    fireRate: 0.09, ammo: 35, maxAmmo: 35, reserveAmmo: 90,
    spread: 0.03, movementSpread: 0.05,
    recoilPattern: [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 3.0, 2.0, 1.0, 0, -1.0, -1.5, -0.5, 0.5, 1.5],
    recoilHorizontal: 1.8, recoilRecovery: 6,
    price: 1800, killReward: 300,
    penetration: 0.65, range: 1000, reloadTime: 3.0,
    movementSpeed: 0.9, automatic: true,
    slot: 'primary',
  },
  
  famas: {
    id: 'famas', name: 'FAMAS', type: 'rifle', side: 'ct',
    damage: 30, headshotDamage: 96, armorPenetration: 0.75,
    fireRate: 0.09, ammo: 25, maxAmmo: 25, reserveAmmo: 90,
    spread: 0.025, movementSpread: 0.05,
    recoilPattern: [1.2, 1.8, 2.5, 3.0, 3.2, 2.8, 2.0, 1.0, 0.5, -0.5, -1.0, -0.5, 0.5, 1.0, 1.5],
    recoilHorizontal: 1.5, recoilRecovery: 6,
    price: 2050, killReward: 300,
    penetration: 0.65, range: 1000, reloadTime: 3.3,
    movementSpeed: 0.9, automatic: true,
    slot: 'primary',
  },

  // === SNIPERS ===
  awp: {
    id: 'awp', name: 'AWP', type: 'sniper', side: 'both',
    damage: 85, headshotDamage: 255, armorPenetration: 0.98,
    fireRate: 1.5, ammo: 5, maxAmmo: 5, reserveAmmo: 30,
    spread: 0.005, movementSpread: 0.15,
    recoilPattern: [8.0],
    recoilHorizontal: 0.5, recoilRecovery: 2,
    price: 4750, killReward: 100,
    penetration: 0.95, range: 2000, reloadTime: 3.7,
    movementSpeed: 0.75, automatic: false,
    slot: 'primary',
  },
  
  ssg08: {
    id: 'ssg08', name: 'SSG 08', type: 'sniper', side: 'both',
    damage: 88, headshotDamage: 180, armorPenetration: 0.9,
    fireRate: 1.25, ammo: 10, maxAmmo: 10, reserveAmmo: 90,
    spread: 0.008, movementSpread: 0.04,
    recoilPattern: [5.0],
    recoilHorizontal: 0.3, recoilRecovery: 3,
    price: 1700, killReward: 300,
    penetration: 0.85, range: 1800, reloadTime: 3.7,
    movementSpeed: 0.95, automatic: false,
    slot: 'primary',
  },

  // === SHOTGUNS ===
  nova: {
    id: 'nova', name: 'Nova', type: 'shotgun', side: 'both',
    damage: 26, headshotDamage: 70, armorPenetration: 0.5,
    fireRate: 0.88, ammo: 8, maxAmmo: 8, reserveAmmo: 32,
    spread: 0.12, movementSpread: 0.02,
    recoilPattern: [3.0],
    recoilHorizontal: 2.0, recoilRecovery: 5,
    price: 1050, killReward: 900,
    penetration: 0.3, range: 400, reloadTime: 0.5,
    movementSpeed: 0.92, automatic: false,
    slot: 'primary',
  },

  // === KNIFE ===
  knife: {
    id: 'knife', name: 'Knife', type: 'knife', side: 'both',
    damage: 55, headshotDamage: 180, armorPenetration: 1.0,
    fireRate: 0.5, ammo: Infinity, maxAmmo: Infinity, reserveAmmo: 0,
    spread: 0, movementSpread: 0,
    recoilPattern: [],
    recoilHorizontal: 0, recoilRecovery: 0,
    price: 0, killReward: 1500,
    penetration: 1, range: 50, reloadTime: 0,
    movementSpeed: 1.0, automatic: false,
    slot: 'knife',
  },

  // === GRENADES ===
  hegrenade: {
    id: 'hegrenade', name: 'HE Grenade', type: 'grenade', side: 'both',
    damage: 0, headshotDamage: 0, armorPenetration: 1.0,
    fireRate: 0, ammo: 1, maxAmmo: 1, reserveAmmo: 0,
    spread: 0, movementSpread: 0,
    recoilPattern: [],
    recoilHorizontal: 0, recoilRecovery: 0,
    price: 300, killReward: 300,
    penetration: 0, range: 0, reloadTime: 0,
    movementSpeed: 1.0, automatic: false,
    slot: 'grenade',
    grenadeType: 'he',
    throwForce: 15,
    radius: 350,
  },
  
  flashbang: {
    id: 'flashbang', name: 'Flashbang', type: 'grenade', side: 'both',
    damage: 0, headshotDamage: 0, armorPenetration: 1.0,
    fireRate: 0, ammo: 1, maxAmmo: 1, reserveAmmo: 0,
    spread: 0, movementSpread: 0,
    recoilPattern: [],
    recoilHorizontal: 0, recoilRecovery: 0,
    price: 200, killReward: 0,
    penetration: 0, range: 0, reloadTime: 0,
    movementSpeed: 1.0, automatic: false,
    slot: 'grenade',
    grenadeType: 'flash',
    throwForce: 18,
    radius: 400,
    duration: 3,
  },
  
  smokegrenade: {
    id: 'smokegrenade', name: 'Smoke Grenade', type: 'grenade', side: 'both',
    damage: 0, headshotDamage: 0, armorPenetration: 1.0,
    fireRate: 0, ammo: 1, maxAmmo: 1, reserveAmmo: 0,
    spread: 0, movementSpread: 0,
    recoilPattern: [],
    recoilHorizontal: 0, recoilRecovery: 0,
    price: 300, killReward: 0,
    penetration: 0, range: 0, reloadTime: 0,
    movementSpeed: 1.0, automatic: false,
    slot: 'grenade',
    grenadeType: 'smoke',
    throwForce: 12,
    radius: 400,
    duration: 18,
  },
  
  molotov: {
    id: 'molotov', name: 'Molotov', type: 'grenade', side: 't',
    damage: 0, headshotDamage: 0, armorPenetration: 1.0,
    fireRate: 0, ammo: 1, maxAmmo: 1, reserveAmmo: 0,
    spread: 0, movementSpread: 0,
    recoilPattern: [],
    recoilHorizontal: 0, recoilRecovery: 0,
    price: 400, killReward: 300,
    penetration: 0, range: 0, reloadTime: 0,
    movementSpeed: 1.0, automatic: false,
    slot: 'grenade',
    grenadeType: 'molotov',
    throwForce: 14,
    radius: 300,
    duration: 7,
  },
  
  decoy: {
    id: 'decoy', name: 'Decoy', type: 'grenade', side: 'both',
    damage: 0, headshotDamage: 0, armorPenetration: 1.0,
    fireRate: 0, ammo: 1, maxAmmo: 1, reserveAmmo: 0,
    spread: 0, movementSpread: 0,
    recoilPattern: [],
    recoilHorizontal: 0, recoilRecovery: 0,
    price: 50, killReward: 0,
    penetration: 0, range: 0, reloadTime: 0,
    movementSpeed: 1.0, automatic: false,
    slot: 'grenade',
    grenadeType: 'decoy',
    throwForce: 16,
    radius: 300,
    duration: 10,
  },

  // === EQUIPMENT ===
  kevlar: {
    id: 'kevlar', name: 'Kevlar', type: 'equipment', side: 'both',
    damage: 0, headshotDamage: 0, armorPenetration: 0,
    fireRate: 0, ammo: 0, maxAmmo: 0, reserveAmmo: 0,
    spread: 0, movementSpread: 0,
    recoilPattern: [],
    recoilHorizontal: 0, recoilRecovery: 0,
    price: 650, killReward: 0,
    penetration: 0, range: 0, reloadTime: 0,
    movementSpeed: 1.0, automatic: false,
    slot: 'equipment',
  },
  
  helmet: {
    id: 'helmet', name: 'Helmet', type: 'equipment', side: 'both',
    damage: 0, headshotDamage: 0, armorPenetration: 0,
    fireRate: 0, ammo: 0, maxAmmo: 0, reserveAmmo: 0,
    spread: 0, movementSpread: 0,
    recoilPattern: [],
    recoilHorizontal: 0, recoilRecovery: 0,
    price: 350, killReward: 0,
    penetration: 0, range: 0, reloadTime: 0,
    movementSpeed: 1.0, automatic: false,
    slot: 'equipment',
  },
  
  defusekit: {
    id: 'defusekit', name: 'Defuse Kit', type: 'equipment', side: 'ct',
    damage: 0, headshotDamage: 0, armorPenetration: 0,
    fireRate: 0, ammo: 0, maxAmmo: 0, reserveAmmo: 0,
    spread: 0, movementSpread: 0,
    recoilPattern: [],
    recoilHorizontal: 0, recoilRecovery: 0,
    price: 400, killReward: 0,
    penetration: 0, range: 0, reloadTime: 0,
    movementSpeed: 1.0, automatic: false,
    slot: 'equipment',
  },
  
  zeus: {
    id: 'zeus', name: 'Zeus x27', type: 'equipment', side: 'both',
    damage: 500, headshotDamage: 500, armorPenetration: 1.0,
    fireRate: 2.0, ammo: 1, maxAmmo: 1, reserveAmmo: 0,
    spread: 0.01, movementSpread: 0.01,
    recoilPattern: [10],
    recoilHorizontal: 0, recoilRecovery: 1,
    price: 200, killReward: 0,
    penetration: 0.1, range: 150, reloadTime: 3,
    movementSpeed: 1.0, automatic: false,
    slot: 'equipment',
  },
  
  healthshot: {
    id: 'healthshot', name: 'Health Shot', type: 'equipment', side: 'both',
    damage: 0, headshotDamage: 0, armorPenetration: 0,
    fireRate: 0, ammo: 1, maxAmmo: 1, reserveAmmo: 0,
    spread: 0, movementSpread: 0,
    recoilPattern: [],
    recoilHorizontal: 0, recoilRecovery: 0,
    price: 50, killReward: 0,
    penetration: 0, range: 0, reloadTime: 2,
    movementSpeed: 1.0, automatic: false,
    slot: 'equipment',
  },
};

export const BUY_CATEGORIES = [
  {
    name: 'Pistols',
    weapons: ['glock', 'usp', 'p250', 'deagle'],
  },
  {
    name: 'SMGs',
    weapons: ['mac10', 'mp9', 'p90'],
  },
  {
    name: 'Rifles',
    weapons: ['galil', 'famas', 'ak47', 'm4a4', 'm4a1s'],
  },
  {
    name: 'Snipers',
    weapons: ['ssg08', 'awp'],
  },
  {
    name: 'Heavy',
    weapons: ['nova'],
  },
  {
    name: 'Grenades',
    weapons: ['hegrenade', 'flashbang', 'smokegrenade', 'molotov', 'decoy'],
  },
  {
    name: 'Equipment',
    weapons: ['kevlar', 'helmet', 'defusekit', 'zeus', 'healthshot'],
  },
];

export function weaponDefToWeapon(def: WeaponDef): Weapon {
  return {
    id: def.id,
    name: def.name,
    damage: def.damage,
    fireRate: def.fireRate,
    ammo: def.ammo,
    maxAmmo: def.maxAmmo,
    reserveAmmo: def.reserveAmmo,
    spread: def.spread,
    automatic: def.automatic,
    type: def.type,
  };
}
