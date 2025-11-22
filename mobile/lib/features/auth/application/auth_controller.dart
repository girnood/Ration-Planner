import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/app_providers.dart';
import '../data/auth_repository_impl.dart';
import '../domain/auth_repository.dart';

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepositoryImpl(client: ref.watch(apiClientProvider)),
);

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>(
  (ref) => AuthController(ref.watch(authRepositoryProvider)),
);

class AuthState {
  const AuthState({
    this.phone = '',
    this.isLoading = false,
    this.isVerified = false,
    this.error,
  });

  final String phone;
  final bool isLoading;
  final bool isVerified;
  final String? error;

  AuthState copyWith({
    String? phone,
    bool? isLoading,
    bool? isVerified,
    String? error,
  }) {
    return AuthState(
      phone: phone ?? this.phone,
      isLoading: isLoading ?? this.isLoading,
      isVerified: isVerified ?? this.isVerified,
      error: error,
    );
  }
}

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._repository) : super(const AuthState());

  final AuthRepository _repository;

  Future<void> requestOtp(String phone) async {
    state = state.copyWith(isLoading: true, phone: phone, error: null);
    try {
      await _repository.requestOtp(phone);
      state = state.copyWith(isLoading: false);
    } catch (error) {
      state = state.copyWith(isLoading: false, error: error.toString());
    }
  }

  Future<bool> verifyOtp(String code) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final success = await _repository.verifyOtp(phone: state.phone, code: code);
      state = state.copyWith(isLoading: false, isVerified: success);
      return success;
    } catch (error) {
      state = state.copyWith(isLoading: false, error: error.toString());
      return false;
    }
  }
}
