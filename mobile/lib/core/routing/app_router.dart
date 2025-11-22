import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/screens/auth_screen.dart';
import '../../features/map/presentation/screens/map_screen.dart';

enum AppRoute {
  auth('/auth'),
  map('/map');

  const AppRoute(this.path);
  final String path;
}

final _routerKey = GlobalKey<NavigatorState>();

final appRouterProvider = Provider<GoRouter>(
  (ref) => GoRouter(
    navigatorKey: _routerKey,
    initialLocation: AppRoute.auth.path,
    routes: [
      GoRoute(
        path: AppRoute.auth.path,
        name: AppRoute.auth.name,
        builder: (context, state) => const AuthScreen(),
      ),
      GoRoute(
        path: AppRoute.map.path,
        name: AppRoute.map.name,
        builder: (context, state) => const MapScreen(),
      ),
    ],
  ),
);
