// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Arabic (`ar`).
class AppLocalizationsAr extends AppLocalizations {
  AppLocalizationsAr([String locale = 'ar']) : super(locale);

  @override
  String get appTitle => 'منقذ - المساعدة على الطريق';

  @override
  String get authTitle => 'تسجيل الدخول برقم الهاتف';

  @override
  String get phoneHint => 'أدخل رقم الهاتف العماني';

  @override
  String get continueLabel => 'متابعة';

  @override
  String get mapTitle => 'طلبات السحب';

  @override
  String get mockDispatch => 'محاكاة تحديث السائق';

  @override
  String get invalidPhone => 'يرجى إدخال رقم صحيح';

  @override
  String get requesting => 'جاري الإرسال...';
}
