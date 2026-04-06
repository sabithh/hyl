import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/login_screen.dart';
import 'features/home/trainer_home_screen.dart';
import 'services/auth_service.dart';

class TrainerPulseApp extends StatefulWidget {
  const TrainerPulseApp({super.key});

  @override
  State<TrainerPulseApp> createState() => _TrainerPulseAppState();
}

class _TrainerPulseAppState extends State<TrainerPulseApp> {
  final AuthService _authService = AuthService();

  AuthSession? _session;
  bool _restoring = true;

  @override
  void initState() {
    super.initState();
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    try {
      final restored = await _authService.restoreSession();
      if (!mounted) {
        return;
      }

      setState(() {
        _session = restored;
        _restoring = false;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }

      setState(() {
        _session = null;
        _restoring = false;
      });
    }
  }

  Future<void> _handleSignOut() async {
    await _authService.logout();
    if (!mounted) {
      return;
    }
    setState(() {
      _session = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    Widget home;

    if (_restoring) {
      home = const _BootScreen();
    } else if (_session == null) {
      home = TrainerLoginScreen(
        onSignedIn: (session) {
          setState(() {
            _session = session;
          });
        },
      );
    } else {
      home = TrainerHomeScreen(
        session: _session!,
        onSignOut: _handleSignOut,
      );
    }

    return MaterialApp(
      title: 'HYL Trainer',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.theme,
      home: home,
    );
  }
}

class _BootScreen extends StatelessWidget {
  const _BootScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: CircularProgressIndicator()),
    );
  }
}
