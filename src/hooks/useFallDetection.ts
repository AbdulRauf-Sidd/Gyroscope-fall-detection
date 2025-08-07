// core/fallDetection.ts
import { SensorData, FallPattern } from '../types/sensors';

// Detection parameters
const accelerationThreshold = 7;
const angularVelocityThreshold = 4.3;
const lowActivityThreshold = 5;
const patternDuration = 1500;
const dataWindowSize = 100;

const recentAccelData: SensorData[] = [];
const recentGyroData: SensorData[] = [];

const fallPattern: FallPattern = {
  accelerationSpike: false,
  highAngularVelocity: false,
  lowActivityAfter: false,
  patternStartTime: null,
  impactDetected: false,
};

export function startSensorDetection(onImpact: (data: SensorData) => void) {
  if (!('DeviceMotionEvent' in window)) {
    console.error('DeviceMotionEvent not supported.');
    return;
  }

  const handleDeviceMotion = (event: DeviceMotionEvent) => {
    const timestamp = Date.now();

    // Acceleration
    if (event.accelerationIncludingGravity) {
      const accelData: SensorData = {
        x: event.accelerationIncludingGravity.x || 0,
        y: event.accelerationIncludingGravity.y || 0,
        z: event.accelerationIncludingGravity.z || 0,
        timestamp,
      };

      recentAccelData.push(accelData);
      if (recentAccelData.length > dataWindowSize) recentAccelData.shift();

      const magnitude = Math.sqrt(accelData.x ** 2 + accelData.y ** 2 + accelData.z ** 2);
      if (magnitude > accelerationThreshold && !fallPattern.impactDetected) {
        fallPattern.impactDetected = true;
        fallPattern.accelerationSpike = true;
        fallPattern.patternStartTime = timestamp;
        console.log('%cImpact detected: ' + magnitude.toFixed(2) + ' m/s²', 'color:red;font-weight:bold;');
        onImpact(accelData);
      }

      // Low activity check
      if (fallPattern.impactDetected && fallPattern.patternStartTime) {
        const timeSinceImpact = timestamp - fallPattern.patternStartTime;
        if (timeSinceImpact > 200 && timeSinceImpact < patternDuration) {
          const recent = recentAccelData.slice(-10);
          const avg = recent.reduce((sum, d) => sum + Math.sqrt(d.x ** 2 + d.y ** 2 + d.z ** 2), 0) / recent.length;
          if (avg < lowActivityThreshold) {
            fallPattern.lowActivityAfter = true;
          }
        }
      }
    }

    // Gyroscope
    if (event.rotationRate && fallPattern.impactDetected && fallPattern.patternStartTime) {
      const gyroData: SensorData = {
        x: event.rotationRate.alpha || 0,
        y: event.rotationRate.beta || 0,
        z: event.rotationRate.gamma || 0,
        timestamp,
      };

      recentGyroData.push(gyroData);
      if (recentGyroData.length > dataWindowSize) recentGyroData.shift();

      const magnitude = Math.sqrt(gyroData.x ** 2 + gyroData.y ** 2 + gyroData.z ** 2);
      const timeSinceImpact = timestamp - fallPattern.patternStartTime;
      if (magnitude > angularVelocityThreshold && timeSinceImpact < 1000) {
        fallPattern.highAngularVelocity = true;
      }
    }
  };

  window.addEventListener('devicemotion', handleDeviceMotion, { passive: true });
}
