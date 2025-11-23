import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/socket_service.dart';
import '../data/order_repository.dart';

class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen> {
  GoogleMapController? _mapController;
  
  // Muscat, Oman coordinates
  static const CameraPosition _kOman = CameraPosition(
    target: LatLng(23.5880, 58.3829),
    zoom: 12,
  );

  final Set<Marker> _markers = {};
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    // Initialize Socket Connection
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(socketServiceProvider).init();
      ref.read(socketServiceProvider).connect();
    });
  }

  @override
  void dispose() {
    ref.read(socketServiceProvider).disconnect();
    super.dispose();
  }

  Future<void> _requestTow() async {
    setState(() => _isSearching = true);

    try {
      // 1. Call API to create order
      final repo = ref.read(orderRepositoryProvider);
      // Mock Customer ID for MVP (In real app, get from Auth State)
      final customerId = "mock-customer-123"; 
      
      // Mock coordinates (center of map)
      final center = await _mapController?.getVisibleRegion();
      final lat = center?.northeast.latitude ?? 23.5880;
      final lng = center?.northeast.longitude ?? 58.3829;

      await repo.createOrder(
        customerId: customerId,
        pickupLat: lat,
        pickupLng: lng,
        dropoffLat: lat + 0.01, // Mock dropoff nearby
        dropoffLng: lng + 0.01,
      );

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Request sent! Searching for drivers...')),
      );
      
      // The SocketService listener (if set up) would handle the "driverFound" event
      
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
      setState(() => _isSearching = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Request Service'),
      ),
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: _kOman,
            onMapCreated: (GoogleMapController controller) {
              _mapController = controller;
            },
            markers: _markers,
            myLocationEnabled: true,
            myLocationButtonEnabled: true,
          ),
          Positioned(
            bottom: 32,
            left: 16,
            right: 16,
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Where do you need help?',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 16),
                    if (_isSearching)
                      const Column(
                        children: [
                          CircularProgressIndicator(),
                          SizedBox(height: 8),
                          Text("Connecting to nearest driver..."),
                        ],
                      )
                    else
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _requestTow,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.black,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                          child: const Text('REQUEST TOW NOW'),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
