import { Platform } from 'react-native';

const localApiUrl = Platform.OS === 'web'
  ? 'http://localhost:3000'
  : 'http://192.168.0.136:3000';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || localApiUrl;
