import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.edumanage.school',
  appName: 'EduManage Cloud',
  webDir: 'dist/school-management-ui/browser',
  server: {
    androidScheme: 'https'
  }
};

export default config;
