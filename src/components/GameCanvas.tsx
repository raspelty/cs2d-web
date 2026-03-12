import { useRef, useEffect, useCallback, useState } from 'react';
import { createInitialState, update, startRound, startNewMatch, buyWeapon, switchWeaponSlot, cycleSpectator, GameState } from '@/game/engine';
import { renderGame, renderMenu } from '@/game/renderer';
import { MAPS } from '@/game/map';
import { BUY_CATEGORIES, WEAPONS } from '@/game/weapons';

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const isDraggingSlider = useRef<'enemy' | 'ally' | null>(null);
  const [isMenu, setIsMenu] = useState(true);

  const getMenuButtonBounds = useCallback((canvas: HTMLCanvasElement) => {
    const w = canvas.width, h = canvas.height;
    return { x: w / 2 - 100, y: h / 2 + 160, w: 200, h: 50 };
  }, []);

  const getTeamButtonBounds = useCallback((canvas: HTMLCanvasElement, team: 'ct' | 't') => {
    const w = canvas.width, h = canvas.height;
    const btnW = 120, btnH = 40;
    if (team === 't') return { x: w / 2 - 140, y: h / 2 + 20, w: btnW, h: btnH };
    return { x: w / 2 + 20, y: h / 2 + 20, w: btnW, h: btnH };
  }, []);

  const getMapButtonBounds = useCallback((canvas: HTMLCanvasElement, index: number) => {
    const w = canvas.width, h = canvas.height;
    const mapBtnW = 120, mapBtnH = 40;
    const x = w / 2 - 150 + index * 200;
    const y = h / 2 - 60;
    return { x, y, w: mapBtnW, h: mapBtnH };
  }, []);

  const getSliderBounds = useCallback((canvas: HTMLCanvasElement, type: 'enemy' | 'ally') => {
    const w = canvas.width, h = canvas.height;
    const sliderW = 300;
    const sliderX = w / 2 - sliderW / 2;
    const sliderY = type === 'enemy' ? h / 2 + 90 : h / 2 + 130;
    return { x: sliderX, y: sliderY, w: sliderW, h: 10 };
  }, []);

  const getSliderValue = useCallback((canvas: HTMLCanvasElement, mouseX: number, type: 'enemy' | 'ally'): number => {
    const bounds = getSliderBounds(canvas, type);
    const clampedX = Math.max(bounds.x, Math.min(mouseX, bounds.x + bounds.w));
    const t = (clampedX - bounds.x) / bounds.w;
    
    if (type === 'enemy') return Math.round(t * 9) + 1; // 1-10
    return Math.round(t * 9); // 0-9
  }, [getSliderBounds]);

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
        if (key === 'b') {
          if (state.roundStatus === 'freezetime' || state.buyMenuOpen) {
            state.buyMenuOpen = !state.buyMenuOpen;
          }
        }
        if (key === 'escape' && state.buyMenuOpen) state.buyMenuOpen = false;

        if (state.buyMenuOpen) {
          if (key >= '1' && key <= '5') { 
            state.buyMenuCategory = parseInt(key) - 1; 
            state.buyMenuSelection = 0; 
          }
          if (key === 'arrowup') state.buyMenuSelection = Math.max(0, state.buyMenuSelection - 1);
          if (key === 'arrowdown') {
            const cat = BUY_CATEGORIES[state.buyMenuCategory];
            if (cat) state.buyMenuSelection = Math.min(cat.weapons.length - 1, state.buyMenuSelection + 1);
          }
          if (key === 'enter') {
            const cat = BUY_CATEGORIES[state.buyMenuCategory];
            if (cat) buyWeapon(state, cat.weapons[state.buyMenuSelection]);
          }
          return;
        }

        if (key === '1') switchWeaponSlot(state.player, 'primary');
        if (key === '2') switchWeaponSlot(state.player, 'secondary');
        if (key === '3') switchWeaponSlot(state.player, 'knife');

        if (key === ' ' && !state.player.isJumping && state.player.alive) {
          state.player.isJumping = true;
          state.player.jumpTimer = 0.4;
        }

        if (key === 'f') { 
          state.player.inspecting = true; 
          state.player.inspectTimer = 3; 
        }

        if (key === 'r' && (state.roundStatus === 'won' || state.roundStatus === 'lost' || state.matchOver)) {
          if (state.matchOver) {
            startNewMatch(state);
            setIsMenu(false);
          } else {
            startRound(state);
          }
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => { 
      state.keys.delete(e.key.toLowerCase()); 
    };

    const onMouseMove = (e: MouseEvent) => {
      // Get canvas-relative coordinates
      const rect = canvas.getBoundingClientRect();
      const canvasX = (e.clientX - rect.left) * (canvas.width / rect.width);
      const canvasY = (e.clientY - rect.top) * (canvas.height / rect.height);
      
      state.mousePos = { x: canvasX, y: canvasY };

      if (state.gamePhase === 'menu') {
        const btn = getMenuButtonBounds(canvas);
        state.hoveredButton = canvasX >= btn.x && canvasX <= btn.x + btn.w &&
          canvasY >= btn.y && canvasY <= btn.y + btn.h ? 'start' : null;

        if (isDraggingSlider.current === 'enemy') {
          state.enemyCount = getSliderValue(canvas, canvasX, 'enemy');
        } else if (isDraggingSlider.current === 'ally') {
          state.allyCount = getSliderValue(canvas, canvasX, 'ally');
        }
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      // Get canvas-relative coordinates
      const rect = canvas.getBoundingClientRect();
      const canvasX = (e.clientX - rect.left) * (canvas.width / rect.width);
      const canvasY = (e.clientY - rect.top) * (canvas.height / rect.height);

      if (state.gamePhase === 'menu') {
        if (e.button !== 0) return;

        // Map buttons
        for (let i = 0; i < MAPS.length; i++) {
          const mb = getMapButtonBounds(canvas, i);
          if (canvasX >= mb.x && canvasX <= mb.x + mb.w && 
              canvasY >= mb.y && canvasY <= mb.y + mb.h) {
            state.selectedMapIndex = i;
            return;
          }
        }

        const tBtn = getTeamButtonBounds(canvas, 't');
        const ctBtn = getTeamButtonBounds(canvas, 'ct');
        
        if (canvasX >= tBtn.x && canvasX <= tBtn.x + tBtn.w && 
            canvasY >= tBtn.y && canvasY <= tBtn.y + tBtn.h) {
          state.playerTeam = 't';
          return;
        }
        
        if (canvasX >= ctBtn.x && canvasX <= ctBtn.x + ctBtn.w && 
            canvasY >= ctBtn.y && canvasY <= ctBtn.y + ctBtn.h) {
          state.playerTeam = 'ct';
          return;
        }

        // Enemy slider
        const enemySlider = getSliderBounds(canvas, 'enemy');
        if (canvasY >= enemySlider.y - 10 && canvasY <= enemySlider.y + enemySlider.h + 10) {
          isDraggingSlider.current = 'enemy';
          state.enemyCount = getSliderValue(canvas, canvasX, 'enemy');
          return;
        }

        // Ally slider
        const allySlider = getSliderBounds(canvas, 'ally');
        if (canvasY >= allySlider.y - 10 && canvasY <= allySlider.y + allySlider.h + 10) {
          isDraggingSlider.current = 'ally';
          state.allyCount = getSliderValue(canvas, canvasX, 'ally');
          return;
        }

        const btn = getMenuButtonBounds(canvas);
        if (canvasX >= btn.x && canvasX <= btn.x + btn.w && 
            canvasY >= btn.y && canvasY <= btn.y + btn.h) {
          state.gamePhase = 'playing';
          setIsMenu(false);
          startNewMatch(state);
        }
        return;
      }

      // Right click = scope for snipers
      if (e.button === 2) {
        e.preventDefault();
        const weaponDef = WEAPONS[state.player.weapon.id];
        if (weaponDef && weaponDef.type === 'sniper' && state.player.alive) {
          state.player.isScoped = !state.player.isScoped;
        }
        return;
      }

      if (e.button !== 0) return;

      // Spectator click to cycle
      if (!state.player.alive && state.roundStatus === 'playing') {
        cycleSpectator(state, 1);
        return;
      }

      if (state.buyMenuOpen) return;
      state.mouseDown = true;
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) state.mouseDown = false;
      isDraggingSlider.current = null;
    };

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
        renderMenu(ctx, canvas, state.hoveredButton, state);
        if (!isMenu) setIsMenu(true);
      } else {
        update(state, dt);
        renderGame(ctx, canvas, state, state.currentMap);
        if (isMenu) setIsMenu(false);
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
  }, [getMenuButtonBounds, getTeamButtonBounds, getMapButtonBounds, getSliderBounds, getSliderValue]);

  return (
    <canvas
      ref={canvasRef}
      className={isMenu ? 'block cursor-default' : 'block cursor-none'}
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh' }}
    />
  );
};

export default GameCanvas;
