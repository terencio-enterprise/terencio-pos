export const config = {
  // API Configuration
  apiBaseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://api.terencio.com'  // Production URL
    : 'http://localhost:8080',    // Development URL
  
  apiTimeout: 30000, // 30 seconds
  
  // App Configuration
  appVersion: '1.0.0',
  appName: 'Terencio POS',
};
