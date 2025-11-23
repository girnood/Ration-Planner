import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';

final orderRepositoryProvider = Provider((ref) => OrderRepository());

class OrderRepository {
  final ApiClient _apiClient = ApiClient();

  Future<Map<String, dynamic>> createOrder({
    required String customerId,
    required double pickupLat,
    required double pickupLng,
    required double dropoffLat,
    required double dropoffLng,
  }) async {
    return await _apiClient.post('/orders', {
      'customerId': customerId,
      'pickupLat': pickupLat,
      'pickupLng': pickupLng,
      'dropoffLat': dropoffLat,
      'dropoffLng': dropoffLng,
    });
  }
}
