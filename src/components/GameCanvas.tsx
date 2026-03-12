import { useRef, useEffect, useCallback } from 'react';
import { createInitialState, update, startRound, GameState } from '@/game/engine';
import { render, renderMenu } from '@/game/renderer';
import { gameMap } from '@/game/map';

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
    return { x: w / 2 - btnW / 2, y: h / 2 - 10, w: btnW, h: btnH };
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

    // Input handlers
    const onKeyDown = (e: KeyboardEvent) => {
      state.keys.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === 'r' && state.roundStatus !== 'playing' && state.gamePhase === 'playing') {
        startRound(state);
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
        const btn = getMenuButtonBounds(canvas);
        if (
          e.clientX >= btn.x && e.clientX <= btn.x + btn.w &&
          e.clientY >= btn.y && e.clientY <= btn.y + btn.h
        ) {
          state.gamePhase = 'playing';
          startRound(state);
        }
        return;
      }
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

    // Game loop
    const loop = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      if (state.gamePhase === 'menu') {
        renderMenu(ctx, canvas, state.hoveredButton);
      } else {
        update(state, dt);
        render(
          ctx, canvas,
          state.player, state.enemies, state.bullets, state.particles,
          state.bloodDecals, state.killFeed, gameMap, state.mousePos,
          state.roundTime, state.roundStatus, state.score, state.camera
        );

        // Restart hint
        if (state.roundStatus !== 'playing') {
          ctx.fillStyle = 'hsl(210, 10%, 55%)';
          ctx.font = '12px "Roboto Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText('PRESS R TO RESTART', canvas.width / 2, canvas.height / 2 + 30);
        }
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
  }, [getMenuButtonBounds]);

  return (
    <canvas
      ref={canvasRef}
      className="block cursor-none"
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh' }}
    />
  );
};

export default GameCanvas;
