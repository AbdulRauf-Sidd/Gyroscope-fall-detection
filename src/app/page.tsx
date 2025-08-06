'use client';

import { useState, useEffect, useRef } from 'react';
import type { Sensor, Accelerometer, Gyroscope } from '../types/sensors';

interface SensorData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

interface FallDetectionState {
  isDetecting: boolean;
  fallDetected: boolean;
  sensorData: SensorData[];
  lastFallTime: number | null;
  fallCount: number;
}

export default function FallDetectionApp() {
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

  const fallThreshold = 15; // m/s² - threshold for fall detection
  const dataWindowSize = 50; // Number of data points to keep for analysis
  const sensorRef = useRef<Sensor | null>(null);

  useEffect(() => {
    checkSensorSupport();
  }, []);

  const checkSensorSupport = () => {
    if ('Accelerometer' in window && 'Gyroscope' in window) {
      setError('');
    } else {
      setError('Sensors not supported on this device. Please use a mobile device with accelerometer and gyroscope.');
    }
  };

  const requestPermission = async () => {
    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'accelerometer' as PermissionName });
        
        if (permission.state === 'granted') {
          startDetection();
        } else if (permission.state === 'prompt') {
          startDetection();
        }
      } else {
        startDetection();
      }
    } catch (err) {
      console.error('Permission request failed:', err);
      setError('Failed to request sensor permissions');
    }
  };

  const startDetection = () => {
    try {
      if (!('Accelerometer' in window)) {
        setError('Accelerometer not available');
        return;
      }

      const AccelerometerClass = (window as Window & { Accelerometer: typeof Accelerometer }).Accelerometer;
      const GyroscopeClass = (window as Window & { Gyroscope: typeof Gyroscope }).Gyroscope;

      const accelerometer = new AccelerometerClass({
        frequency: 60,
        referenceFrame: 'device'
      });

      const gyroscope = new GyroscopeClass({
        frequency: 60,
        referenceFrame: 'device'
      });

      accelerometer.addEventListener('reading', () => {
        const accelData: SensorData = {
          x: accelerometer.x || 0,
          y: accelerometer.y || 0,
          z: accelerometer.z || 0,
          timestamp: Date.now()
        };

        setCurrentAcceleration(accelData);
        processSensorData(accelData);
      });

      gyroscope.addEventListener('reading', () => {
        const gyroData: SensorData = {
          x: gyroscope.x || 0,
          y: gyroscope.y || 0,
          z: gyroscope.z || 0,
          timestamp: Date.now()
        };

        setCurrentRotation(gyroData);
      });

      accelerometer.start();
      gyroscope.start();
      sensorRef.current = accelerometer;

      setState(prev => ({ ...prev, isDetecting: true }));
      setError('');
    } catch (err) {
      console.error('Failed to start sensors:', err);
      setError('Failed to start sensor detection. Please ensure you\'re on a mobile device and grant necessary permissions.');
    }
  };

  const stopDetection = () => {
    if (sensorRef.current) {
      sensorRef.current.stop();
      sensorRef.current = null;
    }
    setState(prev => ({ ...prev, isDetecting: false }));
  };

  const processSensorData = (data: SensorData) => {
    setState(prev => {
      const newSensorData = [...prev.sensorData, data].slice(-dataWindowSize);
      
      // Calculate magnitude of acceleration
      const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
      
      // Check for sudden acceleration change (fall detection)
      if (magnitude > fallThreshold) {
        const now = Date.now();
        const timeSinceLastFall = prev.lastFallTime ? now - prev.lastFallTime : Infinity;
        
        // Only count as new fall if more than 2 seconds have passed
        if (timeSinceLastFall > 2000) {
          return {
            ...prev,
            fallDetected: true,
            lastFallTime: now,
            fallCount: prev.fallCount + 1,
            sensorData: newSensorData
          };
        }
      }
      
      return {
        ...prev,
        sensorData: newSensorData
      };
    });
  };

  const resetFallDetection = () => {
    setState(prev => ({
      ...prev,
      fallDetected: false,
      fallCount: 0,
      lastFallTime: null
    }));
  };

  const getMagnitude = (data: SensorData | null) => {
    if (!data) return 0;
    return Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
  };

  const getStatusColor = () => {
    if (state.fallDetected) return 'bg-red-500';
    if (state.isDetecting) return 'bg-green-500';
    return 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Fall Detection</h1>
          <p className="text-gray-600">Monitor your device for fall detection</p>
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
                  <p className="text-sm">Sudden acceleration detected at {new Date(state.lastFallTime!).toLocaleTimeString()}</p>
                </div>
              </div>
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
        <div className="space-y-3">
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
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 text-sm text-gray-600">
          <h4 className="font-semibold mb-2">How it works:</h4>
          <ul className="space-y-1">
            <li>• Uses device accelerometer and gyroscope</li>
            <li>• Detects sudden acceleration changes</li>
            <li>• Threshold: {fallThreshold} m/s²</li>
            <li>• Works best on mobile devices</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
