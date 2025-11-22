import 'package:dio/dio.dart';

typedef TokenProvider = Future<String?> Function();

class AuthInterceptor extends Interceptor {
  AuthInterceptor({TokenProvider? tokenProvider}) : _tokenProvider = tokenProvider;

  final TokenProvider? _tokenProvider;

  @override
  Future<void> onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    if (_tokenProvider != null) {
      final token = await _tokenProvider!.call();
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }
    return handler.next(options);
  }
}
