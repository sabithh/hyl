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

final appRouterProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authProvider);

  String roleRoot(AppUserRole role) => role == AppUserRole.trainer ? '/trainer' : '/trainee';

  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      final location = state.matchedLocation;

      if (auth.status == AuthStatus.checking) {
        return location == '/splash' ? null : '/splash';
      }

      if (auth.status == AuthStatus.unauthenticated) {
        if (location == '/signup') return null;
        return location == '/login' ? null : '/login';
      }

      final role = auth.role;
      if (role == null) {
        return '/login';
      }

      final home = roleRoot(role);

      if (location == '/login' || location == '/signup' || location == '/splash' || location == '/') {   
        return home;
      }

      if (role == AppUserRole.trainer && location.startsWith('/trainee')) {
        return '/trainer';
      }

      if (role == AppUserRole.trainee && location.startsWith('/trainer')) {
        return '/trainee';
      }

      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (context, state) => const SplashGateScreen()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/signup', builder: (context, state) => const SignupScreen()),
      GoRoute(path: '/trainer', builder: (context, state) => const TrainerShellScreen()),
      GoRoute(path: '/trainee', builder: (context, state) => const TraineeShellScreen()),
      GoRoute(
        path: '/trainer/trainee/:id',
        builder: (context, state) => TraineeDetailScreen(traineeId: state.pathParameters['id'] ?? ''),
      ),
      GoRoute(
        path: '/trainee/workout/:id',
        builder: (context, state) => WorkoutDetailScreen(workoutId: state.pathParameters['id'] ?? ''),
      ),
    ],
  );
});

