import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Your PC's LAN IP — used for native dev (Expo Go). Update if your network changes.
const LAN_IP = '192.168.1.11';

// Production: set EXPO_PUBLIC_API_URL to the hosted backend, e.g.
//   https://your-app.onrender.com/api
// This is baked in at build/export time (APK build, `expo export` for Vercel).
// Dev fallback: web reuses the serving host; native uses LAN_IP.
const devHost =
  Platform.OS === 'web' && typeof window !== 'undefined'
    ? window.location.hostname
    : LAN_IP;

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${devHost}:5000/api`;

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
