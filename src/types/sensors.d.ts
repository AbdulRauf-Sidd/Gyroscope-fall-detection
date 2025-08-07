// TypeScript declarations for device motion and orientation events
// These are standard Web APIs with good cross-platform support

declare global {
  interface Window {
    DeviceMotionEvent: typeof DeviceMotionEvent;
    DeviceOrientationEvent: typeof DeviceOrientationEvent;
  }
}

// DeviceMotionEvent provides acceleration and rotation rate data
interface DeviceMotionEvent extends Event {
  acceleration: DeviceMotionEventAcceleration | null;
  accelerationIncludingGravity: DeviceMotionEventAcceleration | null;
  rotationRate: DeviceMotionEventRotationRate | null;
  interval: number | null;
}

interface DeviceMotionEventAcceleration {
  x: number | null;
  y: number | null;
  z: number | null;
}

interface DeviceMotionEventRotationRate {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
}

// DeviceOrientationEvent provides orientation data
interface DeviceOrientationEvent extends Event {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
  absolute: boolean;
}

// types/sensors.ts

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


// iOS-specific permission request
interface DeviceMotionEventConstructor {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

declare const DeviceMotionEvent: DeviceMotionEventConstructor & {
  new (type: string, eventInitDict?: EventInit): DeviceMotionEvent;
};

declare const DeviceOrientationEvent: {
  new (type: string, eventInitDict?: EventInit): DeviceOrientationEvent;
};

export {}; 