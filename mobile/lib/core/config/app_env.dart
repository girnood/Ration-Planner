import 'dart:ui';

class AppEnv {
  AppEnv._();

  static const backendBaseUrl = String.fromEnvironment(
    'BACKEND_BASE_URL',
    defaultValue: 'http://localhost:3000/api',
  );
  static const dispatcherBaseUrl = String.fromEnvironment(
    'DISPATCHER_URL',
    defaultValue: 'http://localhost:3000',
  );
  static const googleMapsApiKey = String.fromEnvironment(
    'GOOGLE_MAPS_API_KEY',
    defaultValue: '',
  );
  static const defaultLocale = Locale('en');
}
