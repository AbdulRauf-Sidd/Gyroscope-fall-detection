'use client';

import { useState, useEffect, useRef } from 'react';
import { startSensorDetection } from '../hooks/useFallDetection';
import type { SensorData } from '../types/sensors';

export default function HomePage() {
  useEffect(() => {
    const handleImpact = (data: SensorData) => {
      console.log('⚠️ Impact callback called!', data);
      // 👉 You can call any custom function here
      alert('Impact detected!');
    };

    startSensorDetection(handleImpact);
  }, []);

  return null; // 🧼 No UI needed
}