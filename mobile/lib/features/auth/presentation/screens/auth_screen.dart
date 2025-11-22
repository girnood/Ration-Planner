import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/localization/l10n.dart';
import '../../../../core/localization/locale_notifier.dart';
import '../../../../core/routing/app_router.dart';
import '../../../shared/presentation/widgets/primary_button.dart';
import '../../application/auth_controller.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _otpController = TextEditingController();

  bool _showOtpField = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _handleContinue() async {
    final controller = ref.read(authControllerProvider.notifier);
    if (!_showOtpField) {
      await controller.requestOtp(_phoneController.text);
      setState(() => _showOtpField = true);
      return;
    }

    final verified = await controller.verifyOtp(_otpController.text);
    if (verified && mounted) {
      context.go(AppRoute.map.path);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(authControllerProvider);
    final localeNotifier = ref.read(localeProvider.notifier);
    final canSubmit = _showOtpField ? _otpController.text.isNotEmpty : _phoneController.text.isNotEmpty;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.translate('auth_title')),
        actions: [
          TextButton(
            onPressed: localeNotifier.toggleLocale,
            child: Text(l10n.translate('action_switch_language')),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.translate('auth_subtitle'),
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              onChanged: (_) => setState(() {}),
              decoration: InputDecoration(
                labelText: l10n.translate('phone_label'),
                prefixText: '+968 ',
              ),
            ),
            if (_showOtpField) ...[
              const SizedBox(height: 16),
              TextField(
                controller: _otpController,
                keyboardType: TextInputType.number,
                onChanged: (_) => setState(() {}),
                decoration: const InputDecoration(
                  labelText: 'OTP',
                ),
              ),
            ],
            const SizedBox(height: 24),
            PrimaryButton(
              label: l10n.translate('action_continue'),
              isLoading: state.isLoading,
              onPressed: canSubmit ? _handleContinue : null,
            ),
            if (state.error != null) ...[
              const SizedBox(height: 16),
              Text(
                state.error ?? '',
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
