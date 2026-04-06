import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/src/core/models/app_user_role.dart';
import '../services/auth_service.dart';

enum AuthStatus { checking, authenticated, unauthenticated }

class AuthState {
  const AuthState({
    required this.status,
    this.role,
    this.userName,
    this.userEmail,
  });

  final AuthStatus status;
  final AppUserRole? role;
  final String? userName;
  final String? userEmail;

  factory AuthState.initial() => const AuthState(status: AuthStatus.checking);

  AuthState copyWith({
    AuthStatus? status,
    AppUserRole? role,
    String? userName,
    String? userEmail,
    bool clearIdentity = false,
  }) {
    return AuthState(
      status: status ?? this.status,
      role: clearIdentity ? null : (role ?? this.role),
      userName: clearIdentity ? null : (userName ?? this.userName),
      userEmail: clearIdentity ? null : (userEmail ?? this.userEmail),
    );
  }
}

final authServiceProvider = Provider<AuthService>((ref) => AuthService());

final authProvider = StateNotifierProvider<AuthController, AuthState>((ref) {
  final service = ref.watch(authServiceProvider);
  return AuthController(service);
});

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._service) : super(AuthState.initial()) {
    bootstrap();
  }

  final AuthService _service;

  Future<void> bootstrap() async {
    final session = await _service.restoreSession();
    if (session == null) {
      state = state.copyWith(status: AuthStatus.unauthenticated, clearIdentity: true);
      return;
    }

    state = state.copyWith(
      status: AuthStatus.authenticated,
      role: session.role,
      userName: session.userName,
      userEmail: session.userEmail,
    );
  }

  Future<String?> signIn({
    required String email,
    required String password,
    required AppUserRole role,
  }) async {
    state = state.copyWith(status: AuthStatus.checking);

    try {
      final session = await _service.login(
        email: email,
        password: password,
        fallbackRole: role,
      );

      state = state.copyWith(
        status: AuthStatus.authenticated,
        role: session.role,
        userName: session.userName,
        userEmail: session.userEmail,
      );
      return null;
    } catch (error) {
      state = state.copyWith(status: AuthStatus.unauthenticated, clearIdentity: true);
      return 'Unable to sign in. Please try again.';
    }
  }

  Future<void> signOut() async {
    await _service.logout();
    state = state.copyWith(status: AuthStatus.unauthenticated, clearIdentity: true);
  }
}
