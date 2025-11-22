import 'dart:async';
import 'dart:math';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:munkith_mobile/core/config/app_env.dart';
import 'package:munkith_mobile/features/map/domain/entities/driver_location.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

final dispatcherRepositoryProvider = Provider<DispatcherRepository>((ref) {
  final repo = DispatcherRepository(
    baseUrl: '${AppEnv.dispatcherBaseUrl}/dispatcher',
  );
  ref.onDispose(repo.dispose);
  return repo;
});

class DispatcherRepository {
  DispatcherRepository({required this.baseUrl});

  final String baseUrl;
  final _controller = StreamController<List<DriverLocation>>.broadcast();
  final _locations = <String, DriverLocation>{};
  final _random = Random();
  io.Socket? _socket;
  bool _isConnecting = false;

  Stream<List<DriverLocation>> get driverStream => _controller.stream;

  void connect() {
    if (_socket != null || _isConnecting) {
      return;
    }

    _isConnecting = true;
    _socket = io.io(
      baseUrl,
      io.OptionBuilder().setTransports(['websocket']).build(),
    );
    _socket!.onConnect((_) {
      _isConnecting = false;
    });
    _socket!.onDisconnect((_) {
      _socket = null;
      _isConnecting = false;
    });
    _socket!.on('driverLocationUpdated', _handleDriverLocation);
  }

  void _handleDriverLocation(dynamic payload) {
    if (payload is! Map) return;
    final map = Map<String, dynamic>.from(payload as Map);
    final id = map['driverId'] as String? ?? '';
    final lat = (map['lat'] as num?)?.toDouble();
    final lng = (map['lng'] as num?)?.toDouble();
    final isOnline = map['isOnline'] as bool? ?? true;

    if (id.isEmpty || lat == null || lng == null) {
      return;
    }

    _locations[id] = DriverLocation(
      driverId: id,
      position: LatLng(lat, lng),
      isOnline: isOnline,
      updatedAt: DateTime.now(),
    );
    _controller.add(_locations.values.toList(growable: false));
  }

  void simulateDriverPing() {
    final driverId = 'driver-${_random.nextInt(9999)}';
    final lat = 23.588 + (_random.nextDouble() - 0.5) * 0.3;
    final lng = 58.382 + (_random.nextDouble() - 0.5) * 0.3;

    _handleDriverLocation({
      'driverId': driverId,
      'lat': lat,
      'lng': lng,
      'isOnline': true,
    });
  }

  void dispose() {
    _socket?.dispose();
    _controller.close();
  }
}
