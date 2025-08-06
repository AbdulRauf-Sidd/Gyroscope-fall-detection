declare global {
  interface Window {
    Accelerometer: typeof Accelerometer;
    Gyroscope: typeof Gyroscope;
  }
}

interface SensorOptions {
  frequency?: number;
  referenceFrame?: 'device' | 'screen';
}

interface SensorReading {
  x: number | null;
  y: number | null;
  z: number | null;
  timestamp: number | null;
}

declare class Sensor extends EventTarget {
  constructor(options?: SensorOptions);
  start(): void;
  stop(): void;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

declare class Accelerometer extends Sensor {
  x: number | null;
  y: number | null;
  z: number | null;
  timestamp: number | null;
}

declare class Gyroscope extends Sensor {
  x: number | null;
  y: number | null;
  z: number | null;
  timestamp: number | null;
}

export {}; 