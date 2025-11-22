import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../core/providers/app_providers.dart';
import '../data/location_repository_impl.dart';
import '../domain/location_repository.dart';

final locationRepositoryProvider = Provider<LocationRepository>(
  (ref) => LocationRepositoryImpl(client: ref.watch(apiClientProvider)),
);

final mapControllerProvider = StateNotifierProvider<MapController, MapState>(
  (ref) => MapController(ref.watch(locationRepositoryProvider)),
);

class MapState {
  const MapState({
    this.pickup,
    this.dropoff,
    this.isDetecting = false,
    this.isSubmitting = false,
    this.statusCode,
    this.errorMessage,
  });

  final LatLng? pickup;
  final LatLng? dropoff;
  final bool isDetecting;
  final bool isSubmitting;
  final String? statusCode;
  final String? errorMessage;

  bool get canRequest => pickup != null && dropoff != null && !isSubmitting;

  MapState copyWith({
    LatLng? pickup,
    LatLng? dropoff,
    bool? isDetecting,
    bool? isSubmitting,
    String? statusCode,
    bool clearStatus = false,
    String? errorMessage,
    bool clearError = false,
  }) {
    return MapState(
      pickup: pickup ?? this.pickup,
      dropoff: dropoff ?? this.dropoff,
      isDetecting: isDetecting ?? this.isDetecting,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      statusCode: clearStatus ? null : (statusCode ?? this.statusCode),
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

class MapController extends StateNotifier<MapState> {
  MapController(this._repository) : super(const MapState());

  final LocationRepository _repository;

  Future<void> detectCurrentLocation() async {
    state = state.copyWith(isDetecting: true, clearError: true);
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        state = state.copyWith(
          isDetecting: false,
          statusCode: 'error_permission_denied',
          clearError: true,
        );
        return;
      }

      final position = await Geolocator.getCurrentPosition();
      final current = LatLng(position.latitude, position.longitude);
      state = state.copyWith(
        pickup: current,
        isDetecting: false,
        statusCode: 'status_pickup_updated',
        clearError: true,
      );
      await _repository.updateLocation(currentLocation: current);
    } catch (error) {
      state = state.copyWith(
        isDetecting: false,
        errorMessage: error.toString(),
        clearStatus: true,
      );
    }
  }

  void setDropoff(LatLng value) {
    state = state.copyWith(
      dropoff: value,
      statusCode: 'status_dropoff_updated',
      clearError: true,
    );
  }

  void setPickup(LatLng value) {
    state = state.copyWith(
      pickup: value,
      statusCode: 'status_pickup_updated',
      clearError: true,
    );
  }

  Future<void> requestTow() async {
    final pickup = state.pickup;
    final dropoff = state.dropoff;
    if (pickup == null || dropoff == null) return;

    state = state.copyWith(isSubmitting: true, clearStatus: true, clearError: true);
    try {
      await _repository.requestTow(pickup: pickup, dropoff: dropoff);
      state = state.copyWith(
        isSubmitting: false,
        statusCode: 'status_order_submitted',
      );
    } catch (error) {
      state = state.copyWith(
        isSubmitting: false,
        errorMessage: error.toString(),
        clearStatus: true,
      );
    }
  }
}
