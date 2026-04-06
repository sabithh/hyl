import 'package:dio/dio.dart';
import 'api_client.dart';
import 'session_service.dart';

class AuthSession {
  const AuthSession({
    required this.accessToken,
    required this.refreshToken,
    required this.userId,
    required this.userName,
    required this.userEmail,
    required this.role,
  });

  final String accessToken;
  final String refreshToken;
  final String userId;
  final String userName;
  final String userEmail;
  final String role;
}

class AuthService {
  AuthService({SessionService? sessionService})
      : _sessionService = sessionService ?? SessionService();

  final SessionService _sessionService;

  Future<AuthSession?> restoreSession() async {
    final accessToken = await _sessionService.getAccessToken();
    final refreshToken = await _sessionService.getRefreshToken();
    final userId = await _sessionService.getUserId();
    final userName = await _sessionService.getUserName();
    final userEmail = await _sessionService.getUserEmail();
    final role = await _sessionService.getRole();

    if (accessToken == null ||
        refreshToken == null ||
        userId == null ||
        userName == null ||
        userEmail == null ||
        role == null) {
      return null;
    }

    return AuthSession(
      accessToken: accessToken,
      refreshToken: refreshToken,
      userId: userId,
      userName: userName,
      userEmail: userEmail,
      role: role,
    );
  }

  Future<AuthSession> login({
    required String email,
    required String password,
    required String requiredRole,
  }) async {
    try {
      final response = await ApiClient.instance.client.post<Map<String, dynamic>>(
        '/api/auth/login',
        data: {
          'email': email,
          'password': password,
        },
      );

      final data = ApiClient.unwrapData(response.data);
      final session = _parseSession(
        data: data,
        fallbackEmail: email,
        requiredRole: requiredRole,
        defaultName: 'Trainer',
      );
      await _persistSession(session);
      return session;
    } on DioException catch (error) {
      final message = _extractApiMessage(error) ?? 'Unable to sign in right now.';
      throw Exception(message);
    }
  }

  Future<AuthSession> register({
    required String gymEmail,
    required String name,
    required String email,
    required String password,
    required String role,
    required String requiredRole,
    String? phone,
  }) async {
    try {
      final response = await ApiClient.instance.client.post<Map<String, dynamic>>(
        '/api/auth/register',
        data: {
          'gymEmail': gymEmail,
          'name': name,
          'email': email,
          if (phone != null && phone.trim().isNotEmpty) 'phone': phone,
          'password': password,
          'role': role,
        },
      );

      final data = ApiClient.unwrapData(response.data);
      final session = _parseSession(
        data: data,
        fallbackEmail: email,
        requiredRole: requiredRole,
        defaultName: 'Trainer',
      );
      await _persistSession(session);
      return session;
    } on DioException catch (error) {
      final message = _extractApiMessage(error) ?? 'Unable to create account right now.';
      throw Exception(message);
    }
  }

  Future<void> logout() async {
    await _sessionService.clearSession();
  }

  Future<void> _persistSession(AuthSession session) {
    return _sessionService.saveSession(
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      userId: session.userId,
      userName: session.userName,
      userEmail: session.userEmail,
      role: session.role,
    );
  }

  static AuthSession _parseSession({
    required Map<String, dynamic> data,
    required String fallbackEmail,
    required String requiredRole,
    required String defaultName,
  }) {
    final user = data['user'] as Map<String, dynamic>? ?? <String, dynamic>{};
    final accessToken = (data['accessToken'] as String?)?.trim() ?? '';
    final refreshToken = (data['refreshToken'] as String?)?.trim() ?? '';
    final role = (user['role'] as String?)?.trim() ?? '';
    final userId = (user['id'] as String?)?.trim() ?? '';
    final userName = (user['name'] as String?)?.trim() ?? '';
    final userEmail = (user['email'] as String?)?.trim() ?? fallbackEmail;

    if (accessToken.isEmpty || refreshToken.isEmpty || userId.isEmpty || role.isEmpty) {
      throw Exception('Auth response is missing token or user data.');
    }

    if (role != requiredRole) {
      throw Exception('This app only supports $requiredRole accounts.');
    }

    return AuthSession(
      accessToken: accessToken,
      refreshToken: refreshToken,
      userId: userId,
      userName: userName.isEmpty ? defaultName : userName,
      userEmail: userEmail,
      role: role,
    );
  }

  static String? _extractApiMessage(DioException error) {
    final body = error.response?.data;
    if (body is Map<String, dynamic>) {
      final message = body['message'];
      if (message is String && message.isNotEmpty) {
        return message;
      }
    }
    return null;
  }
}
