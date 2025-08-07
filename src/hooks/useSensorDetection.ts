import { useState, useEffect, useRef, useCallback } from 'react';
import type { SensorData, FallDetectionState, FallPattern } from '../types/sensors';
import { processAccelerationData, processGyroscopeData, resetFallPattern } from '../utils/fallDetection';

interface UseSensorDetectionReturn {
  state: FallDetectionState;
  currentAcceleration: SensorData | null;
  currentRotation: SensorData | null;
  fallPattern: FallPattern;
  error: string;
  startDetection: () => void;
  stopDetection: () => void;
  resetFallDetection: () => void;
}

export const useSensorDetection = (): UseSensorDetectionReturn => {
  const [state, setState] = useState<FallDetectionState>({
    isDetecting: false,
    fallDetected: false,
    sensorData: [],
    lastFallTime: null,
    fallCount: 0,
  });

  const [currentAcceleration, setCurrentAcceleration] = useState<SensorData | null>(null);
  const [currentRotation, setCurrentRotation] = useState<SensorData | null>(null);
  const [error, setError] = useState<string>('');

  // Refs for data management
  const recentAccelData = useRef<SensorData[]>([]);
  const recentGyroData = useRef<SensorData[]>([]);
  const fallPatternRef = useRef<FallPattern>({
    accelerationSpike: false,
    highAngularVelocity: false,
    lowActivityAfter: false,
    patternStartTime: null,
    impactDetected: false,
  });
  const cleanupRef = useRef<(() => void) | null>(null);

  // Check sensor support on mount
  useEffect(() => {
    if ('DeviceMotionEvent' in window && 'DeviceOrientationEvent' in window) {
      setError('');
    } else {
      setError('Motion and orientation sensors not supported on this device. Please use a mobile device.');
    }
  }, []);

  // Request permission and start detection
  const requestPermission = useCallback(async (): Promise<void> => {
    try {
      if ('DeviceMotionEvent' in window) {
        const permission = await (DeviceMotionEvent as { requestPermission?: () => Promise<'granted' | 'denied'> }).requestPermission?.();
        if (permission === 'granted' || permission === 'denied') {
          startDetection();
        } else {
          startDetection();
        }
      } else {
        startDetection();
      }
    } catch (err) {
      console.error('Permission request failed:', err);
      setError('Failed to request motion permissions. Please ensure you\'re on a mobile device.');
    }
  }, []);

  const startDetection = useCallback((): void => {
    try {
      if (!('DeviceMotionEvent' in window)) {
        setError('Device motion not available');
        return;
      }

      // Set up device motion listener
      const handleDeviceMotion = (event: DeviceMotionEvent): void => {
        const timestamp = Date.now();
        
        // Process acceleration data
        if (event.accelerationIncludingGravity) {
          const accelData: SensorData = {
            x: event.accelerationIncludingGravity.x || 0,
            y: event.accelerationIncludingGravity.y || 0,
            z: event.accelerationIncludingGravity.z || 0,
            timestamp
          };
          
          setCurrentAcceleration(accelData);
          processAccelerationData(
            accelData,
            recentAccelData,
            fallPatternRef,
            state,
            setState
          );
        }

        // Process rotation rate data
        if (event.rotationRate) {
          const gyroData: SensorData = {
            x: event.rotationRate.alpha || 0,
            y: event.rotationRate.beta || 0,
            z: event.rotationRate.gamma || 0,
            timestamp
          };
          
          setCurrentRotation(gyroData);
          processGyroscopeData(
            gyroData,
            recentGyroData,
            fallPatternRef,
            state,
            setState
          );
        }
      };

      // Set up device orientation listener
      const handleDeviceOrientation = (): void => {
        // Additional orientation data processing if needed
      };

      // Add event listeners
      window.addEventListener('devicemotion', handleDeviceMotion, { passive: true });
      window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });

      // Store cleanup function
      const cleanup = (): void => {
        window.removeEventListener('devicemotion', handleDeviceMotion);
        window.removeEventListener('deviceorientation', handleDeviceOrientation);
      };

      cleanupRef.current = cleanup;
      setState(prev => ({ ...prev, isDetecting: true }));
      setError('');
    } catch (err) {
      console.error('Failed to start motion detection:', err);
      setError('Failed to start motion detection. Please ensure you\'re on a mobile device and grant necessary permissions.');
    }
  }, [state]);

  const stopDetection = useCallback((): void => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    
    setState(prev => ({ ...prev, isDetecting: false }));
  }, []);

  const resetFallDetection = useCallback((): void => {
    setState(prev => ({
      ...prev,
      fallDetected: false,
      fallCount: 0,
      lastFallTime: null
    }));
    resetFallPattern(fallPatternRef);
  }, []);

  // Auto-start detection on mount
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  return {
    state,
    currentAcceleration,
    currentRotation,
    fallPattern: fallPatternRef.current,
    error,
    startDetection,
    stopDetection,
    resetFallDetection,
  };
}; 