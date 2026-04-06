import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../core/models/app_user_role.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/animated_background.dart';
import '../home/trainer_home_screen.dart';
import '../home/trainee_home_screen.dart';

class LoadingScreen extends StatefulWidget {
  const LoadingScreen({super.key, required this.role});

  final AppUserRole role;

  @override
  State<LoadingScreen> createState() => _LoadingScreenState();
}

class _LoadingScreenState extends State<LoadingScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();

    Future.delayed(const Duration(milliseconds: 1800), () {
      if (!mounted) {
        return;
      }

      final destination = widget.role == AppUserRole.trainer
          ? const TrainerHomeScreen()
          : const TraineeHomeScreen();

      Navigator.of(context).pushReplacement(
        PageRouteBuilder<void>(
          pageBuilder: (context, animation, secondaryAnimation) => destination,
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            final curve = CurvedAnimation(
              parent: animation,
              curve: Curves.easeOutCubic,
            );
            return FadeTransition(
              opacity: curve,
              child: SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(0, 0.03),
                  end: Offset.zero,
                ).animate(curve),
                child: child,
              ),
            );
          },
          transitionDuration: const Duration(milliseconds: 420),
        ),
      );
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedBackground(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 120,
                  height: 48,
                  child: AnimatedBuilder(
                    animation: _controller,
                    builder: (context, child) {
                      final phase = _controller.value * math.pi * 2;
                      return Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: List.generate(4, (index) {
                          final wave = math.sin(phase + index * 0.8).abs();
                          final height = 14 + wave * 24;

                          return Container(
                            width: 18,
                            height: height,
                            decoration: BoxDecoration(
                              color: Color.lerp(
                                AppColors.fern,
                                AppColors.mint,
                                wave,
                              ),
                              borderRadius: BorderRadius.circular(999),
                            ),
                          );
                        }),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Loading your ${widget.role.label.toLowerCase()} dashboard...',
                  style: Theme.of(
                    context,
                  ).textTheme.bodyLarge?.copyWith(color: AppColors.mint),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
