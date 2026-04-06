import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/app_router.dart';
import 'core/theme/app_theme.dart';

class GymPulseApp extends StatelessWidget {
  const GymPulseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const ProviderScope(child: _GymPulseRoot());
  }
}

class _GymPulseRoot extends ConsumerWidget {
  const _GymPulseRoot();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      title: 'Gym Pulse',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.theme,
      routerConfig: router,
    );
  }
}
