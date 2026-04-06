import 'package:dio/dio.dart';
import 'backend_health_service.dart';
import 'session_service.dart';

class ApiClient {
  ApiClient._internal();

  static final ApiClient instance = ApiClient._internal();

  final SessionService _session = SessionService();
  final Dio _dio = Dio(
    BaseOptions(
      baseUrl: BackendHealthService.apiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      sendTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ),
  );

  bool _isConfigured = false;

  Dio get client {
    if (!_isConfigured) {
      _configure();
    }
    return _dio;
  }

  void _configure() {
    _isConfigured = true;

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _session.getAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          final request = error.requestOptions;
          final alreadyRetried = request.extra['retried'] == true;
          final shouldRefresh = !alreadyRetried &&
              error.response?.statusCode == 401 &&
              request.path != '/api/auth/login' &&
              request.path != '/api/auth/refresh';

          if (!shouldRefresh) {
            handler.next(error);
            return;
          }

          final refreshed = await _refreshToken();
          if (!refreshed) {
            handler.next(error);
            return;
          }

          try {
            final token = await _session.getAccessToken();
            if (token != null && token.isNotEmpty) {
              request.headers['Authorization'] = 'Bearer $token';
            }
            request.extra['retried'] = true;
            final response = await _dio.fetch<dynamic>(request);
            handler.resolve(response);
          } catch (_) {
            handler.next(error);
          }
        },
      ),
    );
  }

  Future<bool> _refreshToken() async {
    final refreshToken = await _session.getRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) {
      return false;
    }

    try {
      final response = await Dio(
        BaseOptions(
          baseUrl: BackendHealthService.apiBaseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
          sendTimeout: const Duration(seconds: 10),
          headers: {'Content-Type': 'application/json'},
        ),
      ).post<Map<String, dynamic>>(
        '/api/auth/refresh',
        data: {'refreshToken': refreshToken},
      );

      final data = unwrapData(response.data);
      final accessToken = data['accessToken'] as String?;
      if (accessToken == null || accessToken.isEmpty) {
        return false;
      }

      await _session.setAccessToken(accessToken);
      return true;
    } catch (_) {
      return false;
    }
  }

  static Map<String, dynamic> unwrapData(dynamic payload) {
    if (payload is Map<String, dynamic>) {
      final inner = payload['data'];
      if (inner is Map<String, dynamic>) {
        return inner;
      }
      return payload;
    }

    return <String, dynamic>{};
  }

  static List<dynamic> unwrapList(dynamic payload) {
    if (payload is Map<String, dynamic>) {
      final inner = payload['data'];
      if (inner is List<dynamic>) {
        return inner;
      }
    }
    if (payload is List<dynamic>) {
      return payload;
    }
    return <dynamic>[];
  }
}
