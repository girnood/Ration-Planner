import 'package:flutter/widgets.dart';

class AppLocalizations {
  AppLocalizations(this.locale);

  final Locale locale;

  static const supportedLocales = [
    Locale('en'),
    Locale('ar'),
  ];

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const Map<String, Map<String, String>> _localizedValues = {
    'en': {
      'auth_title': 'Welcome to Munkith',
      'auth_subtitle': 'Enter your phone number to get help on the road.',
      'phone_label': 'Phone Number',
      'action_continue': 'Continue',
      'map_title': 'Tow Request',
      'map_subtitle': 'Share your breakdown location and track the driver in real time.',
      'action_request_tow': 'Request Tow Truck',
      'action_detect_location': 'Use My Location',
      'action_switch_language': 'العربية',
      'status_pickup_updated': 'Pickup pinned on the map.',
      'status_dropoff_updated': 'Drop-off pinned on the map.',
      'status_order_submitted': 'Tow request sent. Sit tight!',
      'error_permission_denied': 'Location permission denied. Enable it in Settings.',
    },
    'ar': {
      'auth_title': 'مرحباً في منقذ',
      'auth_subtitle': 'أدخل رقم هاتفك للحصول على المساعدة على الطريق.',
      'phone_label': 'رقم الهاتف',
      'action_continue': 'استمرار',
      'map_title': 'طلب سحب',
      'map_subtitle': 'شارك موقع العطل وتابع السائق في الزمن الفعلي.',
      'action_request_tow': 'اطلب شاحنة سحب',
      'action_detect_location': 'استخدم موقعي',
      'action_switch_language': 'English',
      'status_pickup_updated': 'تم تثبيت موقع الانطلاق على الخريطة.',
      'status_dropoff_updated': 'تم تثبيت وجهة الوصول على الخريطة.',
      'status_order_submitted': 'تم إرسال طلب السحب، يرجى الانتظار.',
      'error_permission_denied': 'تم رفض إذن الموقع. فعّله من الإعدادات.',
    },
  };

  String translate(String key) {
    final languageCode = locale.languageCode;
    return _localizedValues[languageCode]?[key] ??
        _localizedValues['en']?[key] ??
        key;
  }
}

class AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) =>
      AppLocalizations.supportedLocales.map((e) => e.languageCode).contains(locale.languageCode);

  @override
  Future<AppLocalizations> load(Locale locale) async {
    return AppLocalizations(locale);
  }

  @override
  bool shouldReload(covariant LocalizationsDelegate<AppLocalizations> old) => false;
}
