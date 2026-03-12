import { useRef, useEffect, useCallback } from 'react';
import { createInitialState, update, startRound, buyWeapon, GameState } from '@/game/engine';
import { renderGame, renderMenu } from '@/game/renderer';
import { gameMap } from '@/game/map';
import { BUY_CATEGORIES, WEAPONS } from '@/game/weapons';

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const getMenuButtonBounds = useCallback((canvas: HTMLCanvasElement) => {
    const w = canvas.width;
    const h = canvas.height;
    const btnW = 240;
    const btnH = 48;
    return { x: w / 2 - btnW / 2, y: h / 2 + 30, w: btnW, h: btnH };
  }, []);

  const getTeamButtonBounds = useCallback((canvas: HTMLCanvasElement, team: 'ct' | 't') => {
    const w = canvas.width;
    const h = canvas.height;
    const btnW = 160;
    const btnH = 40;
    if (team === 't') {
      return { x: w / 2 - btnW - 20, y: h / 2 - 35, w: btnW, h: btnH };
    }
    return { x: w / 2 + 20, y: h / 2 - 35, w: btnW, h: btnH };
  }, []);

  useEffect(() => {
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

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      state.keys.add(key);

      if (state.gamePhase === 'playing') {
        // Buy menu toggle
        if (key === 'b') {
          if (state.roundStatus === 'freezetime' || state.buyMenuOpen) {
            state.buyMenuOpen = !state.buyMenuOpen;
          }
        }
        if (key === 'escape' && state.buyMenuOpen) {
          state.buyMenuOpen = false;
        }

        // Buy menu navigation
        if (state.buyMenuOpen) {
          if (key >= '1' && key <= '5') {
            state.buyMenuCategory = parseInt(key) - 1;
            state.buyMenuSelection = 0;
          }
          if (key === 'arrowup') {
            state.buyMenuSelection = Math.max(0, state.buyMenuSelection - 1);
          }
          if (key === 'arrowdown') {
            const cat = BUY_CATEGORIES[state.buyMenuCategory];
            if (cat) state.buyMenuSelection = Math.min(cat.weapons.length - 1, state.buyMenuSelection + 1);
          }
          if (key === 'enter') {
            const cat = BUY_CATEGORIES[state.buyMenuCategory];
            if (cat) {
              const wpId = cat.weapons[state.buyMenuSelection];
              buyWeapon(state, wpId);
            }
          }
          return;
        }

        // Weapon switch: 1=primary, 2=secondary, 3=knife
        if (key === '1' && state.player.weapon.id === 'knife') {
          // Switch back to primary/secondary
          if (state.player.secondaryWeapon) {
            // Store knife state, use secondary as temp
          }
        }
        if (key === '3') {
          state.player.weapon = { ...state.player.knife };
        }

        // Inspect
        if (key === 'f') {
          state.player.inspecting = true;
          state.player.inspectTimer = 3;
        }

        // Restart
        if (key === 'r' && state.roundStatus !== 'playing' && state.roundStatus !== 'freezetime') {
          startRound(state);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      state.keys.delete(e.key.toLowerCase());
    };

    const onMouseMove = (e: MouseEvent) => {
      state.mousePos = { x: e.clientX, y: e.clientY };

      if (state.gamePhase === 'menu') {
        const btn = getMenuButtonBounds(canvas);
        state.hoveredButton =
          e.clientX >= btn.x && e.clientX <= btn.x + btn.w &&
          e.clientY >= btn.y && e.clientY <= btn.y + btn.h
            ? 'start' : null;
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;

      if (state.gamePhase === 'menu') {
        // Check team buttons
        const tBtn = getTeamButtonBounds(canvas, 't');
        const ctBtn = getTeamButtonBounds(canvas, 'ct');

        if (e.clientX >= tBtn.x && e.clientX <= tBtn.x + tBtn.w &&
            e.clientY >= tBtn.y && e.clientY <= tBtn.y + tBtn.h) {
          state.playerTeam = 't';
          return;
        }
        if (e.clientX >= ctBtn.x && e.clientX <= ctBtn.x + ctBtn.w &&
            e.clientY >= ctBtn.y && e.clientY <= ctBtn.y + ctBtn.h) {
          state.playerTeam = 'ct';
          return;
        }

        const btn = getMenuButtonBounds(canvas);
        if (e.clientX >= btn.x && e.clientX <= btn.x + btn.w &&
            e.clientY >= btn.y && e.clientY <= btn.y + btn.h) {
          state.gamePhase = 'playing';
          startRound(state);
        }
        return;
      }

      if (state.buyMenuOpen) return;
      state.mouseDown = true;
    };

    const onMouseUp = () => { state.mouseDown = false; };
    const onContextMenu = (e: Event) => e.preventDefault();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('contextmenu', onContextMenu);

    const loop = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      if (state.gamePhase === 'menu') {
        renderMenu(ctx, canvas, state.hoveredButton, state.playerTeam);
      } else {
        update(state, dt);
        renderGame(
          ctx, canvas,
          state.player, state.enemies, state.bullets, state.particles,
          state.bloodDecals, state.killFeed, gameMap, state.mousePos,
          state.roundTime, state.roundStatus, state.score, state.camera,
          state
        );
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('contextmenu', onContextMenu);
    };
  }, [getMenuButtonBounds, getTeamButtonBounds]);

  return (
    <canvas
      ref={canvasRef}
      className="block cursor-none"
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh' }}
    />
  );
};

export default GameCanvas;
