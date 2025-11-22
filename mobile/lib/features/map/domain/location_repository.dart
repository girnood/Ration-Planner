import 'package:google_maps_flutter/google_maps_flutter.dart';

abstract class LocationRepository {
  Future<void> requestTow({
    required LatLng pickup,
    required LatLng dropoff,
  });

  Future<void> updateLocation({
    required LatLng currentLocation,
  });
}
