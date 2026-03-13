import { GameMode } from './types';

export const GAME_MODES: GameMode[] = [
  {
    name: 'CASUAL',
    type: 'casual',
    maxRounds: 15,
    respawn: false,
    teamSwitch: true,
    description: 'Standard bomb defusal. Switch sides after 15 rounds.',
  },
  {
    name: 'DEATHMATCH',
    type: 'deathmatch',
    maxScore: 50,
    respawn: true,
    respawnTime: 3,
    teamSwitch: false,
    description: 'Instant respawns. First to 50 kills wins.',
  },
  {
    name: 'COMPETITIVE',
    type: 'competitive',
    maxRounds: 30,
    respawn: false,
    teamSwitch: true,
    description: 'Ranked mode. First to 16 rounds wins.',
  },
  {
    name: 'ARMS RACE',
    type: 'armsrace',
    maxScore: 10,
    respawn: true,
    respawnTime: 2,
    teamSwitch: false,
    description: 'Progress through weapons. First to knife kill wins.',
  },
  {
    name: 'DEMOLITION',
    type: 'demolition',
    maxRounds: 20,
    respawn: false,
    teamSwitch: true,
    description: 'Bomb defusal with weapon progression.',
  },
  {
    name: 'ZOMBIE',
    type: 'zombie',
    maxRounds: 10,
    respawn: true,
    respawnTime: 5,
    teamSwitch: false,
    description: 'Survive the zombie horde.',
  },
  {
    name: 'HOSTAGE',
    type: 'hostage',
    maxRounds: 15,
    respawn: false,
    teamSwitch: true,
    description: 'Rescue the hostages.',
  },
];

export const MAPS_BY_MODE: Record<string, string[]> = {
  casual: ['DUST II', 'MIRAGE', 'INFERNO', 'OVERPASS', 'VERTIGO'],
  deathmatch: ['DUST II', 'MIRAGE', 'INFERNO', 'NUKE', 'TRAIN'],
  competitive: ['DUST II', 'MIRAGE', 'INFERNO', 'OVERPASS', 'VERTIGO'],
  armsrace: ['ARMS RACE', 'SHORTDUST', 'LAKE', 'SAFEHOUSE'],
  demolition: ['DEMOLITION', 'SHORTTRAIN', 'SUGARCANE'],
  zombie: ['ZOMBIE', 'ZOMBIE_MANSION', 'ZOMBIE_HOTEL'],
  hostage: ['HOSTAGE', 'OFFICE', 'ITALY', 'ASSISI'],
};
