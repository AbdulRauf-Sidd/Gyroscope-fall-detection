export interface SensorData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export interface FallDetectionState {
  isDetecting: boolean;
  fallDetected: boolean;
  sensorData: SensorData[];
  lastFallTime: number | null;
  fallCount: number;
}

export interface FallPattern {
  accelerationSpike: boolean;
  highAngularVelocity: boolean;
  lowActivityAfter: boolean;
  patternStartTime: number | null;
  impactDetected: boolean;
}