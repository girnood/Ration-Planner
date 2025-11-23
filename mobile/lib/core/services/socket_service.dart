import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

final socketServiceProvider = Provider<SocketService>((ref) {
  return SocketService();
});

class SocketService {
  late IO.Socket _socket;

  // Use 10.0.2.2 for Android emulator, localhost for iOS simulator
  static const String _serverUrl = 'http://10.0.2.2:3000';

  void init() {
    _socket = IO.io(_serverUrl, IO.OptionBuilder()
      .setTransports(['websocket'])
      .disableAutoConnect() // We connect manually
      .build()
    );

    _socket.onConnect((_) {
      print('Socket connected: ${_socket.id}');
    });

    _socket.onDisconnect((_) {
      print('Socket disconnected');
    });
    
    _socket.on('driverLocation', (data) {
       print('Driver Location Update: $data');
       // TODO: Broadcast this via a StreamProvider or similar mechanism
    });
  }

  void connect() {
    if (!_socket.connected) {
      _socket.connect();
    }
  }

  void disconnect() {
    if (_socket.connected) {
      _socket.disconnect();
    }
  }

  void emit(String event, dynamic data) {
    _socket.emit(event, data);
  }

  // Example method to update driver location
  void updateLocation(String driverId, double lat, double lng) {
    _socket.emit('updateLocation', {
      'driverId': driverId,
      'lat': lat,
      'lng': lng,
    });
  }

  // Example method to request a tow (though usually done via HTTP API for reliability, 
  // sometimes sockets are used for instant dispatch)
  void requestTow(String customerId, double lat, double lng) {
    _socket.emit('requestTow', {
      'customerId': customerId,
      'lat': lat,
      'lng': lng,
    });
  }
}
