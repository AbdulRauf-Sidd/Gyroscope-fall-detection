// import type { SensorData, FallPatternRef } from './types';
import type { SensorData } from '../types/sensors';
import { useState, useEffect, useRef } from 'react';
import { FallPattern, FallDetectionState } from '../types/sensors';

// export const fallPatternRef = useRef<FallPattern>({
//   accelerationSpike: false,
//   highAngularVelocity: false,
//   lowActivityAfter: false,
//   patternStartTime: null,
//   impactDetected: false,
// });

  const accelerationThreshold = 7; // m/s² - threshold for impact detection
  const angularVelocityThreshold = 4.3; // rad/s - threshold for high rotation
  const lowActivityThreshold = 5; // m/s² - threshold for low activity
  const patternDuration = 1500; // ms - maximum time for fall pattern

  const dataWindowSize = 100; // Number of data points to keep for analysis

export const processAccelerationData = (
  data: SensorData,
  recentAccelDataRef: React.MutableRefObject<SensorData[]>,
  fallPatternRef: React.MutableRefObject<FallPattern>,
  state: FallDetectionState,
  setState: React.Dispatch<React.SetStateAction<FallDetectionState>>,
) => {
  // Add to recent data
  recentAccelDataRef.current.push(data);
  if (recentAccelDataRef.current.length > dataWindowSize) {
    recentAccelDataRef.current.shift();
  }

  const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);

  // Check for acceleration spike (impact)
  if (magnitude > accelerationThreshold) {
    if (!fallPatternRef.current.impactDetected) {
      fallPatternRef.current.impactDetected = true;
      fallPatternRef.current.accelerationSpike = true;
      fallPatternRef.current.patternStartTime = data.timestamp;
      console.log('Impact detected:', magnitude.toFixed(2), 'm/s²');
    }
  }

  // Check for low activity after impact
  if (
    fallPatternRef.current.impactDetected &&
    fallPatternRef.current.patternStartTime
  ) {
    const timeSinceImpact = data.timestamp - fallPatternRef.current.patternStartTime;

    if (timeSinceImpact > 200 && timeSinceImpact < patternDuration) {
      const recentData = recentAccelDataRef.current.slice(-10);
      const avgMagnitude =
        recentData.reduce(
          (sum, d) => sum + Math.sqrt(d.x ** 2 + d.y ** 2 + d.z ** 2),
          0
        ) / recentData.length;

      if (avgMagnitude < lowActivityThreshold) {
        fallPatternRef.current.lowActivityAfter = true;
      }
    }
  }

  // Check if pattern is complete
  checkFallPattern(fallPatternRef, state, setState);
};

// fallDetectionUtils.ts


export const processGyroscopeData = (
  data: SensorData,
  recentGyroDataRef: React.MutableRefObject<SensorData[]>,
  fallPatternRef: React.MutableRefObject<FallPattern>,
  state: FallDetectionState,
  setState: React.Dispatch<React.SetStateAction<FallDetectionState>>,
) => {
  // Add to recent data
  recentGyroDataRef.current.push(data);
  if (recentGyroDataRef.current.length > dataWindowSize) {
    recentGyroDataRef.current.shift();
  }

  const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);

  // Check for high angular velocity (twist or tilt)
  if (magnitude > angularVelocityThreshold) {
    if (
      fallPatternRef.current.impactDetected &&
      fallPatternRef.current.patternStartTime
    ) {
      const timeSinceImpact = data.timestamp - fallPatternRef.current.patternStartTime;

      // High angular velocity should occur within 1 second of impact
      if (timeSinceImpact > 0 && timeSinceImpact < 1000) {
        fallPatternRef.current.highAngularVelocity = true;
        console.log('High angular velocity detected:', magnitude.toFixed(2), 'rad/s');
      }
    }
  }

  // Check if pattern is complete
  checkFallPattern(fallPatternRef, state, setState);
};

const checkFallPattern = (
  fallPatternRef: React.MutableRefObject<FallPattern>,
  state: FallDetectionState,
  setState: React.Dispatch<React.SetStateAction<FallDetectionState>>,
  
) => {
  const pattern = fallPatternRef.current;
  
  if (!pattern.impactDetected || !pattern.patternStartTime) return;

  const now = Date.now();
  const timeSinceStart = now - pattern.patternStartTime;

  // Check if we have a complete fall pattern
  if (pattern.accelerationSpike && 
      pattern.highAngularVelocity && 
      pattern.lowActivityAfter &&
      timeSinceStart <= patternDuration) {
    
    // Check if enough time has passed since last fall detection
    const timeSinceLastFall = state.lastFallTime ? now - state.lastFallTime : Infinity;
    
    if (timeSinceLastFall > 3000) { // 3 second cooldown
      console.log('Fall pattern detected!');
      setState(prev => ({
        ...prev,
        fallDetected: true,
        lastFallTime: now,
        fallCount: prev.fallCount + 1,
      }));
    }
    
    // Reset pattern
    resetFallPattern(fallPatternRef);
  }
  
  // Reset pattern if too much time has passed
  if (timeSinceStart > patternDuration) {
    resetFallPattern(fallPatternRef);
  }
};

const resetFallPattern = (
  fallPatternRef: React.MutableRefObject<FallPattern>,
) => {
  fallPatternRef.current = {
    accelerationSpike: false,
    highAngularVelocity: false,
    lowActivityAfter: false,
    patternStartTime: null,
    impactDetected: false,
  };
};