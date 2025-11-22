import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:munkith_mobile/features/map/data/dispatcher_repository.dart';
import 'package:munkith_mobile/features/map/presentation/providers/driver_locations_provider.dart';
import 'package:munkith_mobile/l10n/app_localizations.dart';

class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen> {
  static const _muscatPosition = LatLng(23.5880, 58.3829);
  final Completer<GoogleMapController> _mapController = Completer();

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final driversAsync = ref.watch(driverLocationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.mapTitle),
      ),
      body: driversAsync.when(
        data: (drivers) {
          final markers = drivers
              .map(
                (driver) => Marker(
                  markerId: MarkerId(driver.driverId),
                  position: driver.position,
                  infoWindow: InfoWindow(
                    title: driver.driverId,
                    snippet:
                        '${driver.isOnline ? "Online" : "Offline"} · ${driver.updatedAt}',
                  ),
                ),
              )
              .toSet();

          return GoogleMap(
            initialCameraPosition: const CameraPosition(
              target: _muscatPosition,
              zoom: 11,
            ),
            markers: markers,
            myLocationButtonEnabled: false,
            trafficEnabled: true,
            onMapCreated: (controller) {
              if (!_mapController.isCompleted) {
                _mapController.complete(controller);
              }
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => Center(
          child: Text(error.toString()),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () =>
            ref.read(dispatcherRepositoryProvider).simulateDriverPing(),
        label: Text(l10n.mockDispatch),
        icon: const Icon(Icons.bolt),
      ),
    );
  }
}
