import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/animated_background.dart';
import '../../core/widgets/staggered_reveal.dart';
import '../landing/landing_screen.dart';

class TrainerHomeScreen extends StatelessWidget {
  const TrainerHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      body: AnimatedBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
            children: [
              StaggeredReveal(
                child: Row(
                  children: [
                    const CircleAvatar(
                      backgroundColor: AppColors.mint,
                      foregroundColor: AppColors.deep,
                      child: Icon(Icons.sports_gymnastics_rounded),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Trainer Dashboard',
                        style: textTheme.titleLarge?.copyWith(
                          color: AppColors.mint,
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: () => _logout(context),
                      icon: const Icon(Icons.logout_rounded),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              const StaggeredReveal(
                delay: Duration(milliseconds: 100),
                child: _StatsRow(),
              ),
              const SizedBox(height: 20),
              StaggeredReveal(
                delay: const Duration(milliseconds: 180),
                child: Text(
                  'Today',
                  style: textTheme.titleMedium?.copyWith(color: AppColors.mint),
                ),
              ),
              const SizedBox(height: 10),
              const StaggeredReveal(
                delay: Duration(milliseconds: 240),
                child: _ActionCard(
                  title: '09:00 AM - Strength Block',
                  subtitle: '8 trainees in session',
                  icon: Icons.fitness_center_rounded,
                ),
              ),
              const SizedBox(height: 10),
              const StaggeredReveal(
                delay: Duration(milliseconds: 300),
                child: _ActionCard(
                  title: '11:30 AM - Form Review',
                  subtitle: '4 progress check-ins pending',
                  icon: Icons.play_lesson_rounded,
                ),
              ),
              const SizedBox(height: 10),
              const StaggeredReveal(
                delay: Duration(milliseconds: 360),
                child: _ActionCard(
                  title: 'Workout Updates',
                  subtitle: '12 plans need next-week refresh',
                  icon: Icons.bolt_rounded,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _logout(BuildContext context) {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(builder: (context) => const LandingScreen()),
      (route) => false,
    );
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow();

  @override
  Widget build(BuildContext context) {
    const stats = [
      ('24', 'Active Trainees'),
      ('6', 'Sessions Today'),
      ('92%', 'Attendance'),
    ];

    return Row(
      children: stats
          .map(
            (item) => Expanded(
              child: Container(
                margin: const EdgeInsets.only(right: 8),
                padding: const EdgeInsets.symmetric(
                  vertical: 14,
                  horizontal: 12,
                ),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  color: AppColors.forest.withValues(alpha: 0.4),
                  border: Border.all(
                    color: AppColors.mint.withValues(alpha: 0.24),
                  ),
                ),
                child: Column(
                  children: [
                    Text(
                      item.$1,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: AppColors.mint,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.$2,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.mint.withValues(alpha: 0.82),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          )
          .toList(),
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({
    required this.title,
    required this.subtitle,
    required this.icon,
  });

  final String title;
  final String subtitle;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        color: AppColors.forest.withValues(alpha: 0.36),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.mint.withValues(alpha: 0.18),
            ),
            child: Icon(icon, color: AppColors.mint),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppColors.mint,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.mint.withValues(alpha: 0.8),
                  ),
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: AppColors.mint),
        ],
      ),
    );
  }
}
