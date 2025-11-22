import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:munkith_mobile/features/auth/data/auth_repository.dart';

class PhoneAuthState {
  const PhoneAuthState({
    this.isSubmitting = false,
    this.hasSucceeded = false,
    this.errorMessage,
  });

  final bool isSubmitting;
  final bool hasSucceeded;
  final String? errorMessage;

  PhoneAuthState copyWith({
    bool? isSubmitting,
    bool? hasSucceeded,
    String? errorMessage,
  }) {
    return PhoneAuthState(
      isSubmitting: isSubmitting ?? this.isSubmitting,
      hasSucceeded: hasSucceeded ?? this.hasSucceeded,
      errorMessage: errorMessage,
    );
  }
}

class PhoneAuthController extends StateNotifier<PhoneAuthState> {
  PhoneAuthController(this._repository) : super(const PhoneAuthState());

  final AuthRepository _repository;

  Future<void> submitPhone(String phone) async {
    state = state.copyWith(
      isSubmitting: true,
      hasSucceeded: false,
      errorMessage: null,
    );

    try {
      await _repository.requestOtp(phone);
      state = state.copyWith(
        isSubmitting: false,
        hasSucceeded: true,
      );
    } catch (error) {
      state = state.copyWith(
        isSubmitting: false,
        hasSucceeded: false,
        errorMessage: error.toString(),
      );
    }
  }

  void reset() {
    state = const PhoneAuthState();
  }
}

final phoneAuthControllerProvider =
    StateNotifierProvider<PhoneAuthController, PhoneAuthState>((ref) {
  return PhoneAuthController(ref.watch(authRepositoryProvider));
});
