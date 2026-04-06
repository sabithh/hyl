import 'package:flutter/material.dart';
import '../../core/models/app_user_role.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/animated_background.dart';
import '../../core/widgets/staggered_reveal.dart';
import '../auth/login_screen.dart';

class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      body: AnimatedBackground(
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 12),
                const StaggeredReveal(
                  delay: Duration(milliseconds: 60),
                  child: _BrandMark(),
                ),
                const SizedBox(height: 38),
                StaggeredReveal(
                  delay: const Duration(milliseconds: 180),
                  child: Text(
                    'Your gym,\nmade intelligent.',
                    style: textTheme.headlineLarge?.copyWith(
                      color: AppColors.mint,
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                StaggeredReveal(
                  delay: const Duration(milliseconds: 280),
                  child: Text(
                    'Simple day-to-day operations for members and trainers with smooth mobile-first workflows.',
                    style: textTheme.bodyLarge?.copyWith(
                      color: AppColors.mint.withValues(alpha: 0.8),
                    ),
                  ),
                ),
                const SizedBox(height: 28),
                const StaggeredReveal(
                  delay: Duration(milliseconds: 360),
                  child: _FeatureStrip(),
                ),
                const Spacer(),
                StaggeredReveal(
                  delay: const Duration(milliseconds: 480),
                  child: FilledButton.icon(
                    onPressed: () => _openLogin(context, AppUserRole.trainer),
                    icon: const Icon(Icons.sports_gymnastics_rounded),
                    label: const Text('Continue as Trainer'),
                  ),
                ),
                const SizedBox(height: 12),
                StaggeredReveal(
                  delay: const Duration(milliseconds: 560),
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.mint,
                      side: BorderSide(
                        color: AppColors.mint.withValues(alpha: 0.4),
                      ),
                      minimumSize: const Size(double.infinity, 50),
                    ),
                    onPressed: () => _openLogin(context, AppUserRole.trainee),
                    icon: const Icon(Icons.person_rounded),
                    label: const Text('Continue as Trainee'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _openLogin(BuildContext context, AppUserRole role) {
    Navigator.of(context).push(
      PageRouteBuilder<void>(
        pageBuilder: (context, animation, secondaryAnimation) =>
            LoginScreen(initialRole: role),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          final curve = CurvedAnimation(
            parent: animation,
            curve: Curves.easeOutCubic,
          );
          return SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(0, 0.12),
              end: Offset.zero,
            ).animate(curve),
            child: FadeTransition(opacity: curve, child: child),
          );
        },
        transitionDuration: const Duration(milliseconds: 450),
      ),
    );
  }
}

class _BrandMark extends StatelessWidget {
  const _BrandMark();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: AppColors.mint.withValues(alpha: 0.95),
          ),
          child: const Icon(
            Icons.fitness_center_rounded,
            color: AppColors.deep,
            size: 22,
          ),
        ),
        const SizedBox(width: 10),
        Text(
          'GYM PULSE',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            color: AppColors.mint,
            letterSpacing: 1.2,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class _FeatureStrip extends StatelessWidget {
  const _FeatureStrip();

  @override
  Widget build(BuildContext context) {
    final items = [
      ('Attendance', Icons.qr_code_scanner_rounded),
      ('Workouts', Icons.bolt_rounded),
      ('Analytics', Icons.show_chart_rounded),
    ];

    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: items
          .map(
            (item) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.forest.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(999),
                border: Border.all(
                  color: AppColors.mint.withValues(alpha: 0.25),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(item.$2, size: 16, color: AppColors.mint),
                  const SizedBox(width: 6),
                  Text(item.$1),
                ],
              ),
            ),
          )
          .toList(),
    );
  }
}
