abstract class AuthRepository {
  Future<void> requestOtp(String phone);

  Future<bool> verifyOtp({
    required String phone,
    required String code,
  });
}
