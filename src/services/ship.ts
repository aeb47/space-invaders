import { CONFIG, ShipType } from '../config';

const STORAGE_KEY = 'space-invaders-ships';

interface ShipData {
  unlocked: ShipType[];
  selected: ShipType;
}

const DEFAULT_DATA: ShipData = {
  unlocked: ['classic'],
  selected: 'classic',
};

export class ShipService {
  private static instance: ShipService;

  static getInstance(): ShipService {
    if (!ShipService.instance) {
      ShipService.instance = new ShipService();
    }
    return ShipService.instance;
  }

  static resetInstance(): void {
    ShipService.instance = undefined as unknown as ShipService;
  }

  private constructor() {}

  private load(): ShipData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_DATA, unlocked: [...DEFAULT_DATA.unlocked] };
      const parsed = JSON.parse(raw);
      return {
        unlocked: Array.isArray(parsed.unlocked) ? [...parsed.unlocked] : [...DEFAULT_DATA.unlocked],
        selected: parsed.selected && this.isValidShipType(parsed.selected) ? parsed.selected : 'classic',
      };
    } catch {
      return { ...DEFAULT_DATA, unlocked: [...DEFAULT_DATA.unlocked] };
    }
  }

  private save(data: ShipData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage may be unavailable; silently ignore
    }
  }

  private isValidShipType(type: string): type is ShipType {
    return type in CONFIG.ships;
  }

  getAvailableShips(): ShipType[] {
    return Object.keys(CONFIG.ships) as ShipType[];
  }

  getShipConfig(type: ShipType): typeof CONFIG.ships[ShipType] {
    return CONFIG.ships[type];
  }

  isUnlocked(type: ShipType): boolean {
    const data = this.load();
    return data.unlocked.includes(type);
  }

  unlockShip(type: ShipType): void {
    const data = this.load();
    if (!data.unlocked.includes(type)) {
      data.unlocked.push(type);
    }
    this.save(data);
  }

  getSelectedShip(): ShipType {
    const data = this.load();
    return data.selected;
  }

  setSelectedShip(type: ShipType): boolean {
    const data = this.load();
    if (!data.unlocked.includes(type)) {
      return false;
    }
    data.selected = type;
    this.save(data);
    return true;
  }
}
