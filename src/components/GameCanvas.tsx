import { useRef, useEffect, useState } from 'react';
import { createInitialState, update, startRound, startNewMatch, GameState } from '@/game/engine';
import { renderGame } from '@/game/renderer';
import CS2Menu from './CS2Menu';
import { GameMode } from '@/game/types';

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [showMenu, setShowMenu] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);

  const handleStartGame = (mode: GameMode, map: string, team: 'ct' | 't') => {
    const state = stateRef.current;
    state.gamePhase = 'playing';
    state.playerTeam = team;
    state.player.money = 99999; // Infinite money
    
    // Find map index
    const mapIndex = ['DUST II', 'MIRAGE'].indexOf(map);
    if (mapIndex >= 0) {
      state.selectedMapIndex = mapIndex;
    }
    
    // Configure based on game mode
    if (mode.type === 'deathmatch') {
      state.maxRounds = 1;
      state.player.alive = true;
      // Deathmatch specific settings
    } else {
      state.maxRounds = mode.maxRounds || 15;
    }
    
    startNewMatch(state);
    setShowMenu(false);
    setGameStarted(true);
  };

  useEffect(() => {
    if (!gameStarted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const state = stateRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      state.keys.add(key);

      if (key === 'escape') {
        setShowMenu(true);
        state.gamePhase = 'menu';
      }

      // Grenade selection
      if (key === '4') {
        if (state.player.equipment.grenades.he > 0) {
          state.player.selectedGrenade = 'he';
          state.player.activeSlot = 'grenade';
        }
      }
      if (key === '5') {
        if (state.player.equipment.grenades.flash > 0) {
          state.player.selectedGrenade = 'flash';
          state.player.activeSlot = 'grenade';
        }
      }
      if (key === '6') {
        if (state.player.equipment.grenades.smoke > 0) {
          state.player.selectedGrenade = 'smoke';
          state.player.activeSlot = 'grenade';
        }
      }

      // Throw grenade (mouse hold)
      if (key === 'g' && state.player.activeSlot === 'grenade') {
        state.player.isThrowing = true;
        state.player.throwTimer = 0;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      state.keys.delete(key);
      
      if (key === 'g' && state.player.isThrowing) {
        state.player.isThrowing = false;
        // Throw grenade with current power
        throwGrenade(state);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) state.mouseDown = true;
      if (e.button === 2) state.mouseRightDown = true;
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) state.mouseDown = false;
      if (e.button === 2) state.mouseRightDown = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      state.mousePos = {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
      };
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    const gameLoop = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      update(state, dt);
      renderGame(ctx, canvas, state, state.currentMap, state.mousePos);

      rafRef.current = requestAnimationFrame(gameLoop);
    };

    rafRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gameStarted]);

  // Helper function to throw grenades
  const throwGrenade = (state: GameState) => {
    const power = Math.min(1, state.player.throwTimer / 1.5);
    const angle = state.player.angle;
    const force = 500 * power;
    
    // Add grenade to world
    // This would be implemented in engine.ts
  };

  if (showMenu) {
    return (
      <CS2Menu
        onStartGame={handleStartGame}
        onOpenInventory={() => console.log('Inventory')}
        onOpenLoadout={() => console.log('Loadout')}
        onOpenSettings={() => console.log('Settings')}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', cursor: 'none' }}
    />
  );
};

export default GameCanvas;
