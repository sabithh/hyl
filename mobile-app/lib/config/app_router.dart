import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/signup_screen.dart';
import '../screens/common/splash_gate_screen.dart';
import '../screens/trainer/trainer_shell_screen.dart';
import '../screens/trainer/trainee_detail_screen.dart';
import '../screens/trainee/trainee_shell_screen.dart';
import '../screens/trainee/workout_detail_screen.dart';
import 'package:mobile_app/src/core/models/app_user_role.dart';

// Bridges Riverpod auth state into a ChangeNotifier so GoRouter can listen
// without the entire GoRouter being recreated on every state change.
class _AuthChangeNotifier extends ChangeNotifier {
  _AuthChangeNotifier(AuthState initial) : _state = initial;

  AuthState _state;
  AuthState get state => _state;

  void update(AuthState next) {
    _state = next;
    notifyListeners();
  }
}

final appRouterProvider = Provider<GoRouter>((ref) {
  final notifier = _AuthChangeNotifier(ref.read(authProvider));

  // Keep the notifier in sync with auth changes.
  ref.listen<AuthState>(authProvider, (_, next) => notifier.update(next));
  ref.onDispose(notifier.dispose);

  String roleRoot(AppUserRole role) =>
      role == AppUserRole.trainer ? '/trainer' : '/trainee';

  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: notifier,
    redirect: (context, state) {
      final auth = notifier.state;
      final location = state.matchedLocation;

      // While checking (initial bootstrap or active request), stay on splash.
      // Never redirect away from /login or /signup — the user is mid-flow.
      if (auth.status == AuthStatus.checking) {
        if (location == '/login' || location == '/signup' || location == '/splash') {
          return null;
        }
        return '/splash';
      }

      if (auth.status == AuthStatus.unauthenticated) {
        if (location == '/signup') return null;
        return location == '/login' ? null : '/login';
      }

      // Authenticated — route to the role home if on an auth/splash page.
      final role = auth.role;
      if (role == null) return '/login';

      final home = roleRoot(role);

      if (location == '/login' ||
          location == '/signup' ||
          location == '/splash' ||
          location == '/') {
        return home;
      }

      // Prevent cross-role access.
      if (role == AppUserRole.trainer && location.startsWith('/trainee')) {
        return '/trainer';
      }
      if (role == AppUserRole.trainee && location.startsWith('/trainer')) {
        return '/trainee';
      }

      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, _) => const SplashGateScreen()),
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      GoRoute(path: '/signup', builder: (_, _) => const SignupScreen()),
      GoRoute(path: '/trainer', builder: (_, _) => const TrainerShellScreen()),
      GoRoute(path: '/trainee', builder: (_, _) => const TraineeShellScreen()),
      GoRoute(
        path: '/trainer/trainee/:id',
        builder: (_, state) =>
            TraineeDetailScreen(traineeId: state.pathParameters['id'] ?? ''),
      ),
      GoRoute(
        path: '/trainee/workout/:id',
        builder: (_, state) =>
            WorkoutDetailScreen(workoutId: state.pathParameters['id'] ?? ''),
      ),
    ],
  );
});
