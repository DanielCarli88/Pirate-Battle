import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Application, Assets, Container, Graphics, Sprite, Text, TextStyle, TilingSprite, Texture } from "pixi.js";
import { ARENA, ISLANDS, GameSimulation, type Input } from "./simulation";
import type { GameConfig } from "../config";

interface Props { config: GameConfig; onEnd: (score: number, duration: number, reason: "time" | "destroyed") => void; onStatus: (health: number, score: number, time: number) => void; }
const emptyInput = (): Input => ({ forward: false, left: false, right: false, fire: false, broadsideLeft: false, broadsideRight: false });

export function GameCanvas({ config, onEnd, onStatus }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const pausedRef = useRef(false);
  useEffect(() => {
    let disposed = false; let initialized = false; const input = emptyInput(); const simulation = new GameSimulation(config);
    const app = new Application(); const keys = new Set<string>();
    const keyMap: Record<string, keyof Input> = { w: "forward", ArrowUp: "forward", a: "left", ArrowLeft: "left", d: "right", ArrowRight: "right", " ": "fire", j: "broadsideLeft", k: "broadsideRight" };
    const onKey = (event: KeyboardEvent, down: boolean) => { const command = keyMap[event.key]; if (command) { event.preventDefault(); if (down) keys.add(event.key); else keys.delete(event.key); input[command] = down || [...keys].some((key) => keyMap[key] === command); } };
    const start = async () => {
      if (!host.current) return;
      await app.init({ width: ARENA.width, height: ARENA.height, background: 0x0b5570, antialias: true, resolution: Math.min(2, window.devicePixelRatio), autoDensity: true });
      initialized = true;
      if (disposed || !host.current) { app.destroy(true); return; }
      host.current.appendChild(app.canvas);
      const world = new Container(); const actors = new Container(); app.stage.addChild(world, actors);
      const fallbackTexture = Texture.WHITE;
      let textures: Record<string, Texture> = {};
      try {
        setLoadingProgress(10);
        const loaded = await Assets.load([
          "/assets/png/default/ships/ship_1.png",
          "/assets/png/default/ships/ship_2.png",
          "/assets/png/default/ships/ship_3.png",
          "/assets/png/default/ship_parts/cannon_ball.png",
          "/assets/png/default/effects/fire_1.png",
          "/assets/png/default/effects/explosion_1.png",
          "/assets/png/default/tiles/tile_40.png"
        ]);
        textures = {
          player: loaded["/assets/png/default/ships/ship_1.png"],
          chaser: loaded["/assets/png/default/ships/ship_2.png"],
          shooter: loaded["/assets/png/default/ships/ship_3.png"],
          cannonBall: loaded["/assets/png/default/ship_parts/cannon_ball.png"],
          fire: loaded["/assets/png/default/effects/fire_1.png"],
          explosion: loaded["/assets/png/default/effects/explosion_1.png"],
          sand: loaded["/assets/png/default/tiles/tile_40.png"]
        };
        setLoadingProgress(100);
      } catch (error) {
        console.error("Pirate Battle assets failed to load; using fallback shapes.", error);
        setLoadingProgress(100);
      }
      setLoading(false);
      const water = new Graphics().rect(0, 0, ARENA.width, ARENA.height).fill(0x0d5c73);
      for (let y = 28; y < ARENA.height; y += 42) water.moveTo(0, y).lineTo(ARENA.width, y + 9).stroke({ color: 0x277b88, alpha: 0.24, width: 2 });
      world.addChild(water);
      for (const island of ISLANDS) {
        const islandBase = new Graphics().roundRect(island.x, island.y, island.width, island.height, 26).fill(0x8e653f).stroke({ color: 0xe9b76c, width: 5 });
        world.addChild(islandBase);
        const sand = new TilingSprite({ texture: textures.sand ?? fallbackTexture, width: island.width - 12, height: island.height - 12 });
        sand.position.set(island.x + 6, island.y + 6); sand.alpha = textures.sand ? 0.9 : 0;
        world.addChild(sand);
      }
      const playerSprite = textures.player ? new Sprite(textures.player) : new Sprite(fallbackTexture);
      playerSprite.anchor.set(0.5); playerSprite.width = 72; playerSprite.height = 72; if (!textures.player) playerSprite.tint = 0xe9d6a3; actors.addChild(playerSprite);
      const dynamic = new Container(); actors.addChild(dynamic);
      const last = { value: performance.now() };
      const draw = () => {
        if (disposed) return; const now = performance.now(); const dt = Math.min(0.05, (now - last.value) / 1000); last.value = now;
        if (!pausedRef.current) simulation.update(dt, input); const snap = simulation.snapshot();
        playerSprite.position.set(snap.player.x, snap.player.y); playerSprite.rotation = snap.player.angle + Math.PI / 2; playerSprite.alpha = 0.65 + 0.35 * Math.max(0, snap.player.health / snap.player.maxHealth);
        dynamic.removeChildren(); snap.enemies.filter((e) => e.alive).forEach((enemy) => {
          const graphic = textures[enemy.type] ? new Sprite(textures[enemy.type]) : new Sprite(fallbackTexture);
          graphic.anchor.set(0.5); graphic.position.set(enemy.x, enemy.y); graphic.rotation = enemy.angle + Math.PI / 2; graphic.width = 64; graphic.height = 64; graphic.alpha = 0.65 + 0.35 * Math.max(0, enemy.health / enemy.maxHealth);
          if (!textures[enemy.type]) graphic.tint = enemy.type === "chaser" ? 0xd85c4a : 0xf2c14e; dynamic.addChild(graphic);
          const health = new Graphics().roundRect(enemy.x - 28, enemy.y - 40, 56, 6, 3).fill(0x291a21); health.addChild(new Graphics().roundRect(enemy.x - 28, enemy.y - 40, 56 * Math.max(0, enemy.health / enemy.maxHealth), 6, 3).fill(enemy.type === "chaser" ? 0xe36a52 : 0xf2c14e)); dynamic.addChild(health);
          const label = new Text({ text: enemy.type === "chaser" ? "CHASER" : "SHOOTER", style: new TextStyle({ fill: 0xf8e9cf, fontSize: 10, fontFamily: "monospace" }) }); label.anchor.set(0.5); label.position.set(enemy.x, enemy.y + 38); dynamic.addChild(label);
        });
        snap.shots.forEach((shot) => {
          const shotSprite = textures.cannonBall ? new Sprite(textures.cannonBall) : new Sprite(fallbackTexture);
          shotSprite.anchor.set(0.5); shotSprite.position.set(shot.x, shot.y); shotSprite.rotation = shot.angle; shotSprite.width = 18; shotSprite.height = 18; if (!textures.cannonBall) shotSprite.tint = shot.owner === "player" ? 0xffdf7e : 0xff6b5c; dynamic.addChild(shotSprite);
          if (textures.fire) { const flame = new Sprite(textures.fire); flame.anchor.set(0.5); flame.position.set(shot.x, shot.y); flame.width = 24; flame.height = 24; flame.alpha = 0.65; dynamic.addChild(flame); }
        });
        const healthBack = new Graphics().roundRect(snap.player.x - 32, snap.player.y - 47, 64, 7, 3).fill(0x291a21); const healthBar = new Graphics().roundRect(snap.player.x - 32, snap.player.y - 47, 64 * Math.max(0, snap.player.health / snap.player.maxHealth), 7, 3).fill(snap.player.health < 35 ? 0xe36a52 : 0x65d68b); dynamic.addChild(healthBack, healthBar);
        const playerLabel = new Text({ text: "YOU", style: new TextStyle({ fill: 0xf8e9cf, fontSize: 11, fontFamily: "monospace", fontWeight: "bold" }) }); playerLabel.anchor.set(0.5); playerLabel.position.set(snap.player.x, snap.player.y + 45); dynamic.addChild(playerLabel);
        onStatus(snap.player.health, snap.score, Math.ceil(config.sessionSeconds - snap.elapsed));
        if (snap.ended) { onEnd(snap.score, snap.elapsed, snap.reason ?? "time"); app.ticker.stop(); }
      };
      app.ticker.add(draw);
      const keyDown = (event: KeyboardEvent) => onKey(event, true);
      const keyUp = (event: KeyboardEvent) => onKey(event, false);
      window.addEventListener("keydown", keyDown); window.addEventListener("keyup", keyUp);
      app.ticker.add(() => {
        if (disposed) {
          window.removeEventListener("keydown", keyDown);
          window.removeEventListener("keyup", keyUp);
        }
      });
    };
    const pauseAutomatically = () => { pausedRef.current = true; setPaused(true); };
    const onBlur = pauseAutomatically;
    const onVisibilityChange = () => { if (document.hidden) pauseAutomatically(); };
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);
    void start();
    return () => { disposed = true; window.removeEventListener("blur", onBlur); document.removeEventListener("visibilitychange", onVisibilityChange); if (initialized) app.destroy(true, { children: true, texture: false }); };
  }, [config, onEnd, onStatus]);
  const togglePause = () => { pausedRef.current = !pausedRef.current; setPaused(pausedRef.current); };
  const press = (command: keyof Input) => (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const element = event.currentTarget;
    const release = () => {
      element.releasePointerCapture?.(event.pointerId);
      const key = command === "forward" ? "w" : command === "left" ? "a" : command === "right" ? "d" : command === "fire" ? " " : command === "broadsideLeft" ? "j" : "k";
      window.dispatchEvent(new KeyboardEvent("keyup", { key }));
    };
    element.setPointerCapture?.(event.pointerId);
    const keyboardEvent = new KeyboardEvent("keydown", { key: command === "forward" ? "w" : command === "left" ? "a" : command === "right" ? "d" : command === "fire" ? " " : command === "broadsideLeft" ? "j" : "k" });
    window.dispatchEvent(keyboardEvent);
    element.addEventListener("pointerup", release, { once: true });
    element.addEventListener("pointercancel", release, { once: true });
  };
  return <div className="game-stage"><div className="game-canvas" ref={host} role="img" aria-label="Pirate battle arena" />{loading && <div className="asset-loading" role="status" aria-live="polite">Loading battle assets… {loadingProgress}%</div>}{paused && <div className="pause-overlay" role="dialog" aria-label="Game paused"><h2>PAUSED</h2><p></p><button onClick={togglePause}>Resume</button></div>}<button className="pause-button" onClick={togglePause}>{paused ? "Resume" : "Pause"}</button><div className="touch-controls" aria-label="Touch controls"><button aria-label="Move forward" onPointerDown={press("forward")}>▲</button><button aria-label="Turn left" onPointerDown={press("left")}>◀</button><button aria-label="Fire" onPointerDown={press("fire")}>Fire</button><button aria-label="Turn right" onPointerDown={press("right")}>▶</button><button aria-label="Broadside left" onPointerDown={press("broadsideLeft")}>J</button><button aria-label="Broadside right" onPointerDown={press("broadsideRight")}>K</button></div></div>;
}
