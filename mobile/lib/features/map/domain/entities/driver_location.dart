import 'package:google_maps_flutter/google_maps_flutter.dart';

class DriverLocation {
  const DriverLocation({
    required this.driverId,
    required this.position,
    required this.isOnline,
    required this.updatedAt,
  });

  final String driverId;
  final LatLng position;
  final bool isOnline;
  final DateTime updatedAt;
}
