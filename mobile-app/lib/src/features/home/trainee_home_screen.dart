import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/animated_background.dart';
import '../../core/widgets/staggered_reveal.dart';
import '../landing/landing_screen.dart';

class TraineeHomeScreen extends StatelessWidget {
  const TraineeHomeScreen({super.key});

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
                      child: Icon(Icons.person_rounded),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Trainee Dashboard',
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
                child: _MembershipCard(),
              ),
              const SizedBox(height: 12),
              const StaggeredReveal(
                delay: Duration(milliseconds: 180),
                child: _ProgressCard(),
              ),
              const SizedBox(height: 18),
              StaggeredReveal(
                delay: const Duration(milliseconds: 260),
                child: Text(
                  'Today\'s Flow',
                  style: textTheme.titleMedium?.copyWith(color: AppColors.mint),
                ),
              ),
              const SizedBox(height: 10),
              const StaggeredReveal(
                delay: Duration(milliseconds: 320),
                child: _SimpleActionTile(
                  icon: Icons.fitness_center_rounded,
                  title: 'Upper Body Session',
                  subtitle: '5 exercises • 45 mins',
                ),
              ),
              const SizedBox(height: 10),
              const StaggeredReveal(
                delay: Duration(milliseconds: 380),
                child: _SimpleActionTile(
                  icon: Icons.restaurant_menu_rounded,
                  title: 'Nutrition Target',
                  subtitle: '1,950 kcal • 120g protein',
                ),
              ),
              const SizedBox(height: 10),
              const StaggeredReveal(
                delay: Duration(milliseconds: 440),
                child: _SimpleActionTile(
                  icon: Icons.chat_bubble_outline_rounded,
                  title: 'Coach Message',
                  subtitle: '“Focus on tempo in your rows today.”',
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

class _MembershipCard extends StatelessWidget {
  const _MembershipCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          colors: [
            AppColors.forest.withValues(alpha: 0.7),
            AppColors.fern.withValues(alpha: 0.58),
          ],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Membership Active',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: AppColors.mint,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Premium Plan · Renews in 18 days',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              color: AppColors.mint.withValues(alpha: 0.9),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProgressCard extends StatelessWidget {
  const _ProgressCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: AppColors.forest.withValues(alpha: 0.35),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Weekly Progress',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: AppColors.mint,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              minHeight: 10,
              value: 0.72,
              color: AppColors.mint,
              backgroundColor: AppColors.deep.withValues(alpha: 0.32),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '72% of weekly goal completed',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.mint.withValues(alpha: 0.82),
            ),
          ),
        ],
      ),
    );
  }
}

class _SimpleActionTile extends StatelessWidget {
  const _SimpleActionTile({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        color: AppColors.forest.withValues(alpha: 0.32),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
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
                    color: AppColors.mint.withValues(alpha: 0.82),
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
