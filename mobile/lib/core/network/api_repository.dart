import 'api_client.dart';

abstract class ApiRepository {
  ApiRepository(this.client);

  final ApiClient client;
}
