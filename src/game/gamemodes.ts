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
