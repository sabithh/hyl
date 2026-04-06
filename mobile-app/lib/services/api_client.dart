import 'package:dio/dio.dart';
import '../config/app_config.dart';
import 'token_storage_service.dart';

class ApiClient {
  ApiClient._internal();

  static final ApiClient _instance = ApiClient._internal();
  static ApiClient get instance => _instance;

  final TokenStorageService _storage = TokenStorageService();
  final Dio _dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      sendTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ),
  );

  bool _isConfigured = false;

  Dio get client {
    if (!_isConfigured) {
      _configureInterceptors();
    }

    return _dio;
  }

  void _configureInterceptors() {
    _isConfigured = true;

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.getAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          final shouldRefresh = error.response?.statusCode == 401 &&
              error.requestOptions.path != '/api/auth/login' &&
              error.requestOptions.path != '/api/auth/refresh';

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
            final token = await _storage.getAccessToken();
            final request = error.requestOptions;
            if (token != null) {
              request.headers['Authorization'] = 'Bearer $token';
            }

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
    final refreshToken = await _storage.getRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) {
      return false;
    }

    try {
      final response = await Dio(
        BaseOptions(
          baseUrl: AppConfig.apiBaseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
          sendTimeout: const Duration(seconds: 10),
          headers: {'Content-Type': 'application/json'},
        ),
      ).post<Map<String, dynamic>>(
        '/api/auth/refresh',
        data: {'refreshToken': refreshToken},
      );

      final data = response.data;
      final payload = data?['data'] as Map<String, dynamic>? ?? data;
      final newAccessToken = payload?['accessToken'] as String?;

      if (newAccessToken == null || newAccessToken.isEmpty) {
        return false;
      }

      final role = await _storage.getRole();
      final userName = await _storage.getUserName();
      final userEmail = await _storage.getUserEmail();

      if (role == null || userName == null || userEmail == null) {
        return false;
      }

      await _storage.saveSession(
        accessToken: newAccessToken,
        refreshToken: refreshToken,
        role: role,
        userName: userName,
        userEmail: userEmail,
      );

      return true;
    } catch (_) {
      return false;
    }
  }
}
