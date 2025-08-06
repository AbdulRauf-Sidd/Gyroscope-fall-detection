# Fall Detection App

A Next.js application that detects when your phone is falling using device sensors (accelerometer and gyroscope).

## Features

- **Real-time Sensor Monitoring**: Uses device accelerometer and gyroscope sensors
- **Fall Detection**: Detects sudden acceleration changes that indicate a fall
- **Visual Feedback**: Clear status indicators and sensor data display
- **Fall Counter**: Tracks the number of falls detected
- **Mobile Optimized**: Designed specifically for mobile devices

## How It Works

The app uses the device's built-in sensors to monitor acceleration and rotation:

1. **Accelerometer**: Measures acceleration in X, Y, and Z axes
2. **Gyroscope**: Measures rotational velocity around each axis
3. **Fall Detection Algorithm**: Calculates acceleration magnitude and triggers when it exceeds the threshold (15 m/s²)

## Requirements

- Mobile device with accelerometer and gyroscope sensors
- Modern browser with sensor API support
- HTTPS connection (required for sensor access)

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open in mobile browser**:
   - Navigate to `http://localhost:3000` on your mobile device
   - Or use a tool like ngrok to expose your local server

4. **Grant permissions**:
   - Allow sensor access when prompted
   - The app will start monitoring automatically

## Usage

1. **Start Detection**: Click "Start Detection" to begin monitoring
2. **Monitor Status**: Watch the status indicator and sensor data
3. **Test Fall Detection**: Simulate a fall by dropping your phone (safely!)
4. **Reset Alerts**: Click "Reset Fall Alert" to clear detected falls

## Technical Details

- **Fall Threshold**: 15 m/s² acceleration magnitude
- **Sensor Frequency**: 60Hz sampling rate
- **Data Window**: Keeps last 50 sensor readings for analysis
- **Debounce**: 2-second cooldown between fall detections

## Browser Compatibility

- Chrome/Android: Full support
- Safari/iOS: Limited support (may require user gesture)
- Firefox: Limited support
- Desktop browsers: Sensors not available

## Development

The app is built with:
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS

## Safety Note

This app is for demonstration purposes. For actual fall detection in medical or safety applications, additional validation and testing would be required.
