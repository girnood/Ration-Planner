import '../../../core/network/api_client.dart';
import '../../../core/network/api_repository.dart';
import '../domain/auth_repository.dart';

class AuthRepositoryImpl extends ApiRepository implements AuthRepository {
  AuthRepositoryImpl({required ApiClient client}) : super(client);

  @override
  Future<void> requestOtp(String phone) async {
    await client.post('/auth/request-otp', data: {'phone': phone});
  }

  @override
  Future<bool> verifyOtp({required String phone, required String code}) async {
    final response = await client.post<Map<String, dynamic>>(
      '/auth/verify-otp',
      data: {'phone': phone, 'code': code},
    );
    final body = response.data ?? {};
    // Assume backend returns { token: string }
    return (body['token'] as String?) != null;
  }
}
