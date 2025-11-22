import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:munkith_mobile/features/map/data/dispatcher_repository.dart';
import 'package:munkith_mobile/features/map/domain/entities/driver_location.dart';

final driverLocationsProvider =
    StreamProvider.autoDispose<List<DriverLocation>>((ref) {
  final repository = ref.watch(dispatcherRepositoryProvider);
  repository.connect();

  return repository.driverStream;
});
