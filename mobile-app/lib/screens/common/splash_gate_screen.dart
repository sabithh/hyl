import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/src/core/theme/app_colors.dart';
import 'package:mobile_app/src/core/widgets/animated_background.dart';
import 'package:mobile_app/src/core/widgets/staggered_reveal.dart';
import '../../providers/auth_provider.dart';

class SplashGateScreen extends ConsumerStatefulWidget {
  const SplashGateScreen({super.key});

  @override
  ConsumerState<SplashGateScreen> createState() => _SplashGateScreenState();
}

class _SplashGateScreenState extends ConsumerState<SplashGateScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);

    // Re-run bootstrap when splash mounts to keep auto-login behavior deterministic.
    Future.microtask(() => ref.read(authProvider.notifier).bootstrap());
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final status = ref.watch(authProvider).status;

    return Scaffold(
      body: AnimatedBackground(
        child: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  ScaleTransition(
                    scale: Tween<double>(begin: 0.92, end: 1.05).animate(
                      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
                    ),
                    child: Container(
                      width: 92,
                      height: 92,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          colors: [
                            AppColors.mint.withValues(alpha: 0.95),
                            AppColors.fern,
                          ],
                        ),
                      ),
                      child: const Icon(
                        Icons.fitness_center_rounded,
                        color: AppColors.deep,
                        size: 38,
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  const StaggeredReveal(
                    delay: Duration(milliseconds: 90),
                    child: Text('Gym Pulse', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700)),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    status == AuthStatus.checking
                        ? 'Restoring session...'
                        : 'Preparing your dashboard...',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppColors.mint.withValues(alpha: 0.86),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const SizedBox(width: 150, child: LinearProgressIndicator(minHeight: 4)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
