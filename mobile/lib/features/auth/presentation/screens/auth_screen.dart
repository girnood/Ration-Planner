import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:munkith_mobile/core/localization/locale_provider.dart';
import 'package:munkith_mobile/features/auth/presentation/controllers/phone_auth_controller.dart';
import 'package:munkith_mobile/l10n/app_localizations.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _phoneController;
  ProviderSubscription<PhoneAuthState>? _authSubscription;

  @override
  void initState() {
    super.initState();
    _phoneController = TextEditingController(text: '+968');
    _authSubscription = ref.listenManual<PhoneAuthState>(
      phoneAuthControllerProvider,
      (previous, next) {
        if (previous?.hasSucceeded == false && next.hasSucceeded) {
          if (mounted) {
            context.go('/map');
            ref.read(phoneAuthControllerProvider.notifier).reset();
          }
        }

        if (next.errorMessage != null && next.errorMessage!.isNotEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(next.errorMessage!)),
          );
        }
      },
    );
  }

  @override
  void dispose() {
    _authSubscription?.close();
    _phoneController.dispose();
    super.dispose();
  }

  bool _isValidPhone(String value) {
    final sanitized = value.replaceAll(RegExp(r'[^0-9+]'), '');
    final regex = RegExp(r'^(?:\+968)?[1-9][0-9]{7}$');
    return regex.hasMatch(sanitized);
  }

  Future<void> _handleSubmit(AppLocalizations l10n) async {
    final form = _formKey.currentState;
    if (form == null || !form.validate()) {
      return;
    }

    await ref
        .read(phoneAuthControllerProvider.notifier)
        .submitPhone(_phoneController.text.trim());
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final authState = ref.watch(phoneAuthControllerProvider);
    final locale = ref.watch(localeProvider);
    final isArabic = locale?.languageCode == 'ar';
    final textDirection =
        isArabic ? TextDirection.rtl : TextDirection.ltr;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Align(
                alignment: Alignment.centerRight,
                child: ToggleButtons(
                  isSelected: [!isArabic, isArabic],
                  onPressed: (index) {
                    final localeCode = index == 0 ? 'en' : 'ar';
                    ref.read(localeProvider.notifier).state =
                        Locale(localeCode);
                  },
                  children: const [
                    Padding(
                      padding: EdgeInsets.symmetric(horizontal: 12),
                      child: Text('EN'),
                    ),
                    Padding(
                      padding: EdgeInsets.symmetric(horizontal: 12),
                      child: Text('ع'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 48),
              Text(
                l10n.authTitle,
                style: Theme.of(context).textTheme.headlineSmall,
                textAlign: TextAlign.start,
                textDirection: textDirection,
              ),
              const SizedBox(height: 16),
              Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Directionality(
                      textDirection: textDirection,
                      child: TextFormField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        decoration: InputDecoration(
                          labelText: l10n.phoneHint,
                          prefixText: isArabic ? '' : '+968 ',
                        ),
                        validator: (value) {
                          if (value == null || !_isValidPhone(value)) {
                            return l10n.invalidPhone;
                          }
                          return null;
                        },
                      ),
                    ),
                    const SizedBox(height: 24),
                    FilledButton.icon(
                      icon: authState.isSubmitting
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                              ),
                            )
                          : const Icon(Icons.arrow_forward_ios, size: 16),
                      label: Text(
                        authState.isSubmitting
                            ? l10n.requesting
                            : l10n.continueLabel,
                      ),
                      onPressed:
                          authState.isSubmitting ? null : () => _handleSubmit(l10n),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              TextButton(
                onPressed: () => context.go('/map'),
                child: Text(l10n.mapTitle),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
