import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../../core/localization/l10n.dart';
import '../../../shared/presentation/widgets/primary_button.dart';
import '../../application/map_controller.dart';

class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen> {
  final Completer<GoogleMapController> _mapController = Completer();
  static const _omanCenter = CameraPosition(
    target: LatLng(23.5880, 58.3829),
    zoom: 7,
  );

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(mapControllerProvider);
    final controller = ref.read(mapControllerProvider.notifier);
    final statusText = _statusLabel(l10n, state.statusCode);
    final isErrorStatus = (state.statusCode ?? '').startsWith('error_');

    final markers = <Marker>{};
    if (state.pickup != null) {
      markers.add(
        Marker(
          markerId: const MarkerId('pickup'),
          position: state.pickup!,
          infoWindow: const InfoWindow(title: 'Pickup'),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
        ),
      );
    }
    if (state.dropoff != null) {
      markers.add(
        Marker(
          markerId: const MarkerId('dropoff'),
          position: state.dropoff!,
          infoWindow: const InfoWindow(title: 'Drop-off'),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.translate('map_title')),
      ),
      body: Column(
        children: [
          Expanded(
            child: GoogleMap(
              initialCameraPosition: _omanCenter,
              myLocationButtonEnabled: false,
              myLocationEnabled: true,
              markers: markers,
              onMapCreated: (controllerInstance) {
                if (!_mapController.isCompleted) {
                  _mapController.complete(controllerInstance);
                }
              },
              onTap: controller.setDropoff,
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.translate('map_subtitle'),
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: state.isDetecting
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.my_location),
                        label: Text(l10n.translate('action_detect_location')),
                        onPressed: state.isDetecting ? null : controller.detectCurrentLocation,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: state.pickup == null
                            ? null
                            : () async {
                                final map = await _mapController.future;
                                await map.animateCamera(
                                  CameraUpdate.newLatLngZoom(state.pickup!, 14),
                                );
                              },
                        child: const Text('Center Pickup'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                PrimaryButton(
                  label: l10n.translate('action_request_tow'),
                  isLoading: state.isSubmitting,
                  onPressed: state.canRequest ? controller.requestTow : null,
                ),
                if (statusText != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    statusText,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: isErrorStatus ? Theme.of(context).colorScheme.error : null,
                        ),
                  ),
                ],
                if (state.errorMessage != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    state.errorMessage!,
                    style: TextStyle(color: Theme.of(context).colorScheme.error),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  String? _statusLabel(AppLocalizations l10n, String? code) {
    switch (code) {
      case 'status_pickup_updated':
        return l10n.translate('status_pickup_updated');
      case 'status_dropoff_updated':
        return l10n.translate('status_dropoff_updated');
      case 'status_order_submitted':
        return l10n.translate('status_order_submitted');
      case 'error_permission_denied':
        return l10n.translate('error_permission_denied');
      default:
        return null;
    }
  }
}
