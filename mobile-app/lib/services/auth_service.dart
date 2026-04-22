import 'package:dio/dio.dart';
import 'package:mobile_app/src/core/models/app_user_role.dart';
import 'api_client.dart';
import 'token_storage_service.dart';

class AuthSession {
  const AuthSession({
    required this.accessToken,
    required this.refreshToken,
    required this.role,
    required this.userName,
    required this.userEmail,
  });

  final String accessToken;
  final String refreshToken;
  final AppUserRole role;
  final String userName;
  final String userEmail;
}

class AuthService {
  AuthService({TokenStorageService? storage})
    : _storage = storage ?? TokenStorageService();

  final TokenStorageService _storage;

  Future<AuthSession?> restoreSession() async {
    final token = await _storage.getAccessToken();
    final refreshToken = await _storage.getRefreshToken();
    final role = await _storage.getRole();
    final userName = await _storage.getUserName();
    final userEmail = await _storage.getUserEmail();

    if (token == null ||
        refreshToken == null ||
        role == null ||
        userName == null ||
        userEmail == null) {
      return null;
    }

    return AuthSession(
      accessToken: token,
      refreshToken: refreshToken,
      role: role,
      userName: userName,
      userEmail: userEmail,
    );
  }

  Future<AuthSession> login({
    required String email,
    required String password,
    required AppUserRole fallbackRole,
  }) async {
    try {
      final response = await ApiClient.instance.client
          .post<Map<String, dynamic>>(
            '/api/auth/login',
            data: {'email': email, 'password': password},
          );

      final body = response.data ?? <String, dynamic>{};
      final data = body['data'] as Map<String, dynamic>? ?? body;
      final user = data['user'] as Map<String, dynamic>? ?? <String, dynamic>{};

      final accessToken = (data['accessToken'] as String?)?.trim() ?? '';
      final refreshToken = (data['refreshToken'] as String?)?.trim() ?? '';
      final userRole = user['role'] as String?;

      if (accessToken.isEmpty ||
          refreshToken.isEmpty ||
          userRole == null ||
          userRole.isEmpty) {
        throw Exception(
          'Login response is missing required token or role fields.',
        );
      }

      AppUserRole? role;
      for (final item in AppUserRole.values) {
        if (item.name == userRole) {
          role = item;
          break;
        }
      }

      if (role == null) {
        throw Exception('Unsupported role received from server: $userRole');
      }

      if (role != fallbackRole) {
        throw Exception('This account cannot sign in to this app mode.');
      }

      final session = AuthSession(
        accessToken: accessToken,
        refreshToken: refreshToken,
        role: role,
        userName: (user['name'] as String?) ?? 'Gym User',
        userEmail: (user['email'] as String?) ?? email,
      );

      await _storage.saveSession(
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        role: session.role,
        userName: session.userName,
        userEmail: session.userEmail,
      );

      return session;
    } on DioException catch (error) {
      final data = error.response?.data;
      if (data is Map<String, dynamic>) {
        final message = data['message'];
        if (message is String && message.isNotEmpty) {
          throw Exception(message);
        }
      }

      throw Exception(
        'Unable to sign in right now. Please check your connection and try again.',
      );
    }
  }

  Future<AuthSession> signUp({
    required String name,
    required String email,
    required String password,
    required AppUserRole role,
    required String gymEmail,
  }) async {
    try {
      final response = await ApiClient.instance.client
          .post<Map<String, dynamic>>(
            '/api/auth/register',
            data: {
              'name': name,
              'email': email,
              'password': password,
              'role': role.name,
              'gymEmail': gymEmail,
            },
          );

      final body = response.data ?? <String, dynamic>{};
      final data = body['data'] as Map<String, dynamic>? ?? body;
      final user = data['user'] as Map<String, dynamic>? ?? <String, dynamic>{};

      final accessToken = (data['accessToken'] as String?)?.trim() ?? '';
      final refreshToken = (data['refreshToken'] as String?)?.trim() ?? '';
      final userRole = user['role'] as String?;

      if (accessToken.isEmpty ||
          refreshToken.isEmpty ||
          userRole == null ||
          userRole.isEmpty) {
        throw Exception(
          'Register response is missing required token or role fields.',
        );
      }

      AppUserRole? parsedRole;
      for (final item in AppUserRole.values) {
        if (item.name == userRole) {
          parsedRole = item;
          break;
        }
      }

      if (parsedRole == null) {
        throw Exception('Unsupported role received from server: $userRole');
      }

      if (parsedRole != role) {
        throw Exception('This account cannot sign in to this app mode.');
      }

      final session = AuthSession(
        accessToken: accessToken,
        refreshToken: refreshToken,
        role: parsedRole,
        userName: (user['name'] as String?) ?? name,
        userEmail: (user['email'] as String?) ?? email,
      );

      await _storage.saveSession(
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        role: session.role,
        userName: session.userName,
        userEmail: session.userEmail,
      );

      return session;
    } on DioException catch (error) {
      final data = error.response?.data;
      if (data is Map<String, dynamic>) {
        final message = data['message'];
        if (message is String && message.isNotEmpty) {
          throw Exception(message);
        }
      }

      throw Exception(
        'Unable to register right now. Please check your connection and try again.',
      );
    }
  }

  Future<void> logout() async {
    await _storage.clearSession();
  }
}
