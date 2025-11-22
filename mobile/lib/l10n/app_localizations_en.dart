// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'Munkith Roadside';

  @override
  String get authTitle => 'Sign in with your phone';

  @override
  String get phoneHint => 'Enter Omani phone number';

  @override
  String get continueLabel => 'Continue';

  @override
  String get mapTitle => 'Tow Requests';

  @override
  String get mockDispatch => 'Simulate Driver Ping';

  @override
  String get invalidPhone => 'Enter a valid phone number';

  @override
  String get requesting => 'Requesting...';
}
