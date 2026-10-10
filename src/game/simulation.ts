import type { GameConfig } from "../config";
export interface Vec { x: number; y: number }
export interface Body extends Vec { id: string; angle: number; health: number; maxHealth: number; radius: number; alive: boolean; type: "player" | "chaser" | "shooter"; cooldown: number; }
export interface Shot extends Vec { id: string; angle: number; owner: "player" | "enemy"; damage: number; life: number; }
export interface Island { x: number; y: number; width: number; height: number }
export interface Snapshot { player: Body; enemies: Body[]; shots: Shot[]; score: number; elapsed: number; ended: boolean; reason?: "time" | "destroyed"; }
export interface Input { forward: boolean; left: boolean; right: boolean; fire: boolean; broadsideLeft: boolean; broadsideRight: boolean }
export const ARENA = { width: 1000, height: 620 };
export const ISLANDS: Island[] = [{ x: 430, y: 205, width: 140, height: 180 }, { x: 150, y: 460, width: 190, height: 55 }, { x: 720, y: 80, width: 160, height: 60 }];
const distance = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);
const hitIsland = (x: number, y: number, radius: number) => ISLANDS.some((i) => x > i.x - radius && x < i.x + i.width + radius && y > i.y - radius && y < i.y + i.height + radius);
const forward = (angle: number): Vec => ({ x: Math.cos(angle), y: Math.sin(angle) });
const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export class GameSimulation {
  readonly config: GameConfig; readonly player: Body; readonly enemies: Body[] = []; readonly shots: Shot[] = [];
  score = 0; elapsed = 0; ended = false; reason?: "time" | "destroyed"; private spawnTimer = 0; private fireTimer = 0; private broadsideTimer = 0;
  constructor(config: GameConfig) {
    this.config = { ...config }; this.player = { id: "player", x: 500, y: 500, angle: -Math.PI / 2, health: config.playerHealth, maxHealth: config.playerHealth, radius: 24, alive: true, type: "player", cooldown: 0 };
  }
  update(dt: number, input: Input): void {
    if (this.ended) return;
    this.elapsed = Math.min(this.config.sessionSeconds, this.elapsed + dt);
    this.player.cooldown = Math.max(0, this.player.cooldown - dt);
    const turn = (input.left ? -1 : 0) + (input.right ? 1 : 0);
    this.player.angle += turn * this.config.rotationSpeed * dt;
    if (input.forward) {
      const f = forward(this.player.angle); this.move(this.player, f.x * this.config.playerSpeed * dt, f.y * this.config.playerSpeed * dt);
    }
    this.fireTimer = Math.max(0, this.fireTimer - dt); this.broadsideTimer = Math.max(0, this.broadsideTimer - dt);
    if (input.fire && this.fireTimer === 0) { this.fireTimer = this.config.frontalCooldown; this.addShot(this.player, this.player.angle); }
    if ((input.broadsideLeft || input.broadsideRight) && this.broadsideTimer === 0) {
      this.broadsideTimer = this.config.broadsideCooldown;
      const side = input.broadsideLeft ? -1 : 1; const base = this.player.angle + side * Math.PI / 2;
      [-0.16, 0, 0.16].forEach((offset) => this.addShot(this.player, base + offset));
    }
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.config.spawnSeconds) { this.spawnTimer -= this.config.spawnSeconds; this.spawnEnemy(); }
    this.updateEnemies(dt); this.updateShots(dt);
    if (this.player.health <= 0) this.finish("destroyed");
    else if (this.elapsed >= this.config.sessionSeconds) this.finish("time");
  }
  private move(body: Body, dx: number, dy: number): void {
    const nx = Math.max(body.radius, Math.min(ARENA.width - body.radius, body.x + dx));
    const ny = Math.max(body.radius, Math.min(ARENA.height - body.radius, body.y + dy));
    if (!hitIsland(nx, body.y, body.radius)) body.x = nx;
    if (!hitIsland(body.x, ny, body.radius)) body.y = ny;
  }
  private spawnEnemy(): void {
    const candidates = [{ x: 70, y: 70 }, { x: 930, y: 520 }, { x: 900, y: 300 }, { x: 100, y: 300 }];
    const point = candidates.find((p) => distance(p, this.player) > 280 && !hitIsland(p.x, p.y, 28));
    if (!point) return;
    const type = this.enemies.filter((e) => e.alive).length % 2 === 0 ? "chaser" : "shooter";
    this.enemies.push({ ...point, id: makeId(), angle: 0, health: this.config.enemyHealth, maxHealth: this.config.enemyHealth, radius: 22, alive: true, type, cooldown: this.config.enemyCooldown });
  }
  private updateEnemies(dt: number): void {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const dx = this.player.x - enemy.x; const dy = this.player.y - enemy.y; const targetAngle = Math.atan2(dy, dx);
      const diff = Math.atan2(Math.sin(targetAngle - enemy.angle), Math.cos(targetAngle - enemy.angle));
      enemy.angle += Math.sign(diff) * Math.min(Math.abs(diff), this.config.rotationSpeed * dt);
      const d = Math.hypot(dx, dy);
      if (enemy.type === "chaser" || d > this.config.shooterRange) { const f = forward(enemy.angle); this.move(enemy, f.x * (enemy.type === "chaser" ? this.config.chaserSpeed : this.config.shooterSpeed) * dt, f.y * (enemy.type === "chaser" ? this.config.chaserSpeed : this.config.shooterSpeed) * dt); }
      enemy.cooldown = Math.max(0, enemy.cooldown - dt);
      if (enemy.type === "shooter" && d <= this.config.shooterRange && enemy.cooldown === 0) { enemy.cooldown = this.config.enemyCooldown; this.addShot(enemy, enemy.angle); }
      if (enemy.type === "chaser" && d < enemy.radius + this.player.radius) { this.player.health = Math.max(0, this.player.health - 25); enemy.alive = false; }
    }
  }
  private addShot(owner: Body, angle: number): void { const f = forward(angle); this.shots.push({ id: makeId(), x: owner.x + f.x * 28, y: owner.y + f.y * 28, angle, owner: owner.type === "player" ? "player" : "enemy", damage: this.config.projectileDamage, life: this.config.projectileLifetime }); }
  private updateShots(dt: number): void {
    for (const shot of this.shots) {
      const f = forward(shot.angle); shot.x += f.x * this.config.projectileSpeed * dt; shot.y += f.y * this.config.projectileSpeed * dt; shot.life -= dt;
      if (shot.life <= 0 || shot.x < 0 || shot.x > ARENA.width || shot.y < 0 || shot.y > ARENA.height || hitIsland(shot.x, shot.y, 3)) { shot.life = 0; continue; }
      const targets = shot.owner === "player" ? this.enemies : [this.player];
      const target = targets.find((body) => body.alive && distance(shot, body) < body.radius + 5);
      if (target) { target.health -= shot.damage; shot.life = 0; if (target.health <= 0) { target.alive = false; if (target.type !== "player") this.score += 1; } }
    }
    this.shots.splice(0, this.shots.length, ...this.shots.filter((shot) => shot.life > 0));
  }
  private finish(reason: "time" | "destroyed"): void { this.ended = true; this.reason = reason; this.player.alive = reason !== "destroyed"; }
  snapshot(): Snapshot { return { player: { ...this.player }, enemies: this.enemies.map((e) => ({ ...e })), shots: this.shots.map((s) => ({ ...s })), score: this.score, elapsed: this.elapsed, ended: this.ended, reason: this.reason }; }
}
