import 'dart:async';
import 'dart:convert';
import 'dart:io';

class BackendHealthService {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://hyl.onrender.com',
  );

  static Future<bool> ping() async {
    final client = HttpClient();

    try {
      final url = Uri.parse('$apiBaseUrl/api/health');
      final request = await client.getUrl(url).timeout(const Duration(seconds: 3));
      final response = await request.close().timeout(const Duration(seconds: 3));
      if (response.statusCode != 200) {
        return false;
      }

      final body = await utf8.decodeStream(response).timeout(const Duration(seconds: 3));
      return body.toLowerCase().contains('ok') || body.toLowerCase().contains('healthy');
    } on TimeoutException {
      return false;
    } catch (_) {
      return false;
    } finally {
      client.close(force: true);
    }
  }
}
