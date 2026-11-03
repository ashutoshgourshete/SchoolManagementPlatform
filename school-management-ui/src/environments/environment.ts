export const environment = {
  production: false,
  apiUrl: `${typeof window !== 'undefined' ? window.location.protocol : 'http:'}//${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:5000/api/v1`,
  appName: 'EduManage Cloud'
};
