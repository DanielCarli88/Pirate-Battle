export interface GameConfig {
  sessionSeconds: number;
  spawnSeconds: number;
  playerHealth: number;
  playerSpeed: number;
  rotationSpeed: number;
  projectileSpeed: number;
  projectileLifetime: number;
  projectileDamage: number;
  frontalCooldown: number;
  broadsideCooldown: number;
  enemyHealth: number;
  chaserSpeed: number;
  shooterSpeed: number;
  shooterRange: number;
  enemyCooldown: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  sessionSeconds: 90, spawnSeconds: 4, playerHealth: 100, playerSpeed: 190,
  rotationSpeed: 2.8, projectileSpeed: 460, projectileLifetime: 1.8,
  projectileDamage: 25, frontalCooldown: 0.35, broadsideCooldown: 1.1,
  enemyHealth: 50, chaserSpeed: 75, shooterSpeed: 45, shooterRange: 360,
  enemyCooldown: 1.7
};

export const CONFIG_LIMITS = { sessionSeconds: [60, 180], spawnSeconds: [1, 20] } as const;
const KEY = "pirate-battle-options";

export function readConfig(): Pick<GameConfig, "sessionSeconds" | "spawnSeconds"> {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<GameConfig>;
    return {
      sessionSeconds: clamp(saved.sessionSeconds ?? DEFAULT_CONFIG.sessionSeconds, ...CONFIG_LIMITS.sessionSeconds),
      spawnSeconds: clamp(saved.spawnSeconds ?? DEFAULT_CONFIG.spawnSeconds, ...CONFIG_LIMITS.spawnSeconds)
    };
  } catch {
    return { sessionSeconds: DEFAULT_CONFIG.sessionSeconds, spawnSeconds: DEFAULT_CONFIG.spawnSeconds };
  }
}

export function saveConfig(values: Pick<GameConfig, "sessionSeconds" | "spawnSeconds">): void {
  localStorage.setItem(KEY, JSON.stringify(values));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}
