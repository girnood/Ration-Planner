import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:munkith_mobile/core/network/api_client.dart';
import 'package:munkith_mobile/core/network/endpoints.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.watch(apiClientProvider));
});

class AuthRepository {
  AuthRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<void> requestOtp(String phone) async {
    await _apiClient.post(
      Endpoints.authPhone,
      data: {
        'phone': phone,
      },
    );
  }
}
