// utils/math.ts

import { SensorData } from '../types/sensors';

export function getMagnitude(data: SensorData | null): number {
  if (!data) return 0;
  return Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
}