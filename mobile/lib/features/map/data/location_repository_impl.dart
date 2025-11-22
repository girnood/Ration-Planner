import 'dart:math';

import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_repository.dart';
import '../domain/location_repository.dart';

class LocationRepositoryImpl extends ApiRepository implements LocationRepository {
  LocationRepositoryImpl({required ApiClient client}) : super(client);

  @override
  Future<void> requestTow({required LatLng pickup, required LatLng dropoff}) async {
    await client.post(
      '/orders',
      data: {
        'pickupLat': pickup.latitude,
        'pickupLng': pickup.longitude,
        'dropoffLat': dropoff.latitude,
        'dropoffLng': dropoff.longitude,
        'estimatedDistanceKm': pickup.distanceTo(dropoff) / 1000,
      },
    );
  }

  @override
  Future<void> updateLocation({required LatLng currentLocation}) async {
    await client.post(
      '/providers/location',
      data: {
        'lat': currentLocation.latitude,
        'lng': currentLocation.longitude,
      },
    );
  }
}

extension _LatLngDistance on LatLng {
  double distanceTo(LatLng other) {
    const earthRadius = 6371000; // meters
    final dLat = _degreesToRadians(other.latitude - latitude);
    final dLng = _degreesToRadians(other.longitude - longitude);
    final a = (sin(dLat / 2) * sin(dLat / 2)) +
        cos(_degreesToRadians(latitude)) *
            cos(_degreesToRadians(other.latitude)) *
            (sin(dLng / 2) * sin(dLng / 2));
    final c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return earthRadius * c;
  }
}

double _degreesToRadians(double degrees) => degrees * (pi / 180);
