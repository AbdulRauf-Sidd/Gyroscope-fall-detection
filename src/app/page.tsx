'use client';

import { useState, useEffect, useRef } from 'react';
import { SensorData, FallDetectionState, FallPattern } from '../types/sensors';
import { processAccelerationData, processGyroscopeData } from '@/utils/fallDetection';

// interface SensorData {
//   x: number;
//   y: number;
//   z: number;
//   timestamp: number;
// }

// interface FallDetectionState {
//   isDetecting: boolean;
//   fallDetected: boolean;
//   sensorData: SensorData[];
//   lastFallTime: number | null;
//   fallCount: number;
// }

// interface FallPattern {
//   accelerationSpike: boolean;
//   highAngularVelocity: boolean;
//   lowActivityAfter: boolean;
//   patternStartTime: number | null;
//   impactDetected: boolean;
// }

export default function FallDetectionApp() {
  const [state, setState] = useState<FallDetectionState>({
    isDetecting: true,
    fallDetected: false,
    sensorData: [],
    lastFallTime: null,
    fallCount: 0,
  });

  const [currentAcceleration, setCurrentAcceleration] = useState<SensorData | null>(null);
  const [currentRotation, setCurrentRotation] = useState<SensorData | null>(null);
  const [error, setError] = useState<string>('');

  // Fall detection parameters
  // const accelerationThreshold = 7; // m/s² - threshold for impact detection
  // const angularVelocityThreshold = 4.3; // rad/s - threshold for high rotation
  // const lowActivityThreshold = 5; // m/s² - threshold for low activity
  // const patternDuration = 1500; // ms - maximum time for fall pattern

  // const dataWindowSize = 100; // Number of data points to keep for analysis
  
  // Fall pattern tracking
  const fallPatternRef = useRef<FallPattern>({
    accelerationSpike: false,
    highAngularVelocity: false,
    lowActivityAfter: false,
    patternStartTime: null,
    impactDetected: false,
  });

  // Store recent sensor data for pattern analysis
  const recentAccelData = useRef<SensorData[]>([]);
  const recentGyroData = useRef<SensorData[]>([]);

  // Store cleanup function reference
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    checkSensorSupport();
  }, []);

  const checkSensorSupport = () => {
    if ('DeviceMotionEvent' in window && 'DeviceOrientationEvent' in window) {
      setError('');
    } else {
      setError('Motion and orientation sensors not supported on this device. Please use a mobile device.');
    }
  };

  const requestPermission = async () => {
    try {
      // Request permission for device motion (iOS requirement)
      if ('DeviceMotionEvent' in window) {
        // iOS requires user gesture to request permission
        const permission = await (DeviceMotionEvent as { requestPermission?: () => Promise<'granted' | 'denied'> }).requestPermission?.();
        if (permission === 'granted' || permission === 'denied') {
          startDetection();
        } else {
          // For other browsers, just start detection
          startDetection();
        }
      } else {
        startDetection();
      }
    } catch (err) {
      console.error('Permission request failed:', err);
      setError('Failed to request motion permissions. Please ensure you\'re on a mobile device.');
    }
  };

  const startDetection = () => {
    try {
      if (!('DeviceMotionEvent' in window)) {
        setError('Device motion not available');
        return;
      }

      // Set up device motion listener (accelerometer + gyroscope)
      const handleDeviceMotion = (event: DeviceMotionEvent) => {
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
            recentAccelData,          // ref for recent acceleration data
            fallPatternRef,           // ref for fall pattern state
            state,
            setState
          );
        }

        // Process rotation rate data (gyroscope)
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
            recentAccelData,          // ref for recent acceleration data
            fallPatternRef,           // ref for fall pattern state
            state,
            setState
          );
        }
      };

      // Set up device orientation listener (for additional rotation data)
      const handleDeviceOrientation = () => {
        // This provides additional orientation data if needed
        // We can use this for more sophisticated fall detection
      };

      // Add event listeners
      window.addEventListener('devicemotion', handleDeviceMotion, { passive: true });
      window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });

      // Store cleanup function
      const cleanup = () => {
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
  };

  // const stopDetection = () => {
  //   // Remove event listeners using stored cleanup function
  //   if (cleanupRef.current) {
  //     cleanupRef.current();
  //     cleanupRef.current = null;
  //   }
    
  //   setState(prev => ({ ...prev, isDetecting: false }));
  // };

  

  // const resetFallDetection = () => {
  //   setState(prev => ({
  //     ...prev,
  //     fallDetected: false,
  //     fallCount: 0,
  //     lastFallTime: null
  //   }));
  //   resetFallPattern();
  // };

  const getMagnitude = (data: SensorData | null) => {
    if (!data) return 0;
    return Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
  };

  const getStatusColor = () => {
    if (state.fallDetected) return 'bg-red-500';
    if (state.isDetecting) return 'bg-green-500';
    return 'bg-gray-500';
  };

  const getPatternStatus = () => {
    const pattern = fallPatternRef.current;
    if (!pattern.impactDetected) return 'Waiting for impact...';
    
    const status = [];
    if (pattern.accelerationSpike) status.push('✓ Impact');
    if (pattern.highAngularVelocity) status.push('✓ Rotation');
    if (pattern.lowActivityAfter) status.push('✓ Low Activity');
    
    return status.length > 0 ? status.join(' | ') : 'Impact detected...';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Fall Detection</h1>
          <p className="text-gray-600">Advanced pattern-based fall detection</p>
        </div>

        {/* Status Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className={`w-4 h-4 rounded-full ${getStatusColor()} mr-3`}></div>
            <span className="text-lg font-semibold">
              {state.fallDetected ? 'FALL DETECTED!' : 
               state.isDetecting ? 'Monitoring...' : 'Not Active'}
            </span>
          </div>
          
          {state.fallDetected && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4">
              <div className="flex items-center">
                <span className="text-2xl mr-2">⚠️</span>
                <div>
                  <p className="font-semibold">Fall Detected!</p>
                  <p className="text-sm">Complete fall pattern detected at {new Date(state.lastFallTime!).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Pattern Status */}
          {state.isDetecting && !state.fallDetected && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4">
              <p className="text-sm font-semibold">Pattern Status:</p>
              <p className="text-xs">{getPatternStatus()}</p>
            </div>
          )}
        </div>

        {/* Sensor Data Display */}
        {currentAcceleration && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3">Sensor Data</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Acceleration</p>
                <p className="font-mono text-lg">
                  X: {currentAcceleration.x.toFixed(2)} m/s²
                </p>
                <p className="font-mono text-lg">
                  Y: {currentAcceleration.y.toFixed(2)} m/s²
                </p>
                <p className="font-mono text-lg">
                  Z: {currentAcceleration.z.toFixed(2)} m/s²
                </p>
                <p className="font-mono text-lg font-bold">
                  Magnitude: {getMagnitude(currentAcceleration).toFixed(2)} m/s²
                </p>
              </div>
              {currentRotation && (
                <div>
                  <p className="text-sm text-gray-600">Rotation</p>
                  <p className="font-mono text-lg">
                    X: {currentRotation.x.toFixed(2)} rad/s
                  </p>
                  <p className="font-mono text-lg">
                    Y: {currentRotation.y.toFixed(2)} rad/s
                  </p>
                  <p className="font-mono text-lg">
                    Z: {currentRotation.z.toFixed(2)} rad/s
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fall Counter */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">Falls Detected</p>
            <p className="text-3xl font-bold text-blue-600">{state.fallCount}</p>
          </div>
        </div>

        {/* Controls */}
        {/* <div className="space-y-3">
          {!state.isDetecting ? (
            <button
              onClick={requestPermission}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Start Detection
            </button>
          ) : (
            <button
              onClick={stopDetection}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Stop Detection
            </button>
          )}
          
          {state.fallDetected && (
            <button
              onClick={resetFallDetection}
              className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Reset Fall Alert
            </button>
          )}
        </div> */}

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 text-sm text-gray-600">
          <h4 className="font-semibold mb-2">Fall Pattern Detection:</h4>
          <ul className="space-y-1">
            <li>• Sudden acceleration spike (&gt;5 m/s²)</li>
            <li>• High angular velocity (&gt;1 rad/s)</li>
            <li>• Followed by low activity (&lt;2 m/s²)</li>
            <li>• All within 2 seconds</li>
            <li>• Works on iOS and Android</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
