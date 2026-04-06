import 'package:flutter/material.dart';
import 'package:mobile_app/src/core/theme/app_colors.dart';
import 'package:mobile_app/src/core/widgets/animated_background.dart';
import 'package:mobile_app/src/core/widgets/staggered_reveal.dart';
import '../../utils/mock_data.dart';
import '../../widgets/app_panel.dart';
import '../../widgets/feature_tile.dart';

class TrainerHomeScreen extends StatelessWidget {
  const TrainerHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AnimatedBackground(
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          children: [
            StaggeredReveal(
              child: Text(
                'Trainer Command',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: AppColors.mint,
                ),
              ),
            ),
            const SizedBox(height: 8),
            StaggeredReveal(
              delay: const Duration(milliseconds: 80),
              child: Text(
                'Manage members, assign workouts, and monitor attendance from one flow.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppColors.mint.withValues(alpha: 0.82),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const StaggeredReveal(
              delay: Duration(milliseconds: 120),
              child: _KpiBand(),
            ),
            const SizedBox(height: 16),
            StaggeredReveal(
              delay: const Duration(milliseconds: 180),
              child: AppPanel(
                child: Column(
                  children: const [
                    FeatureTile(
                      icon: Icons.task_alt_rounded,
                      title: 'Today\'s Assignments',
                      subtitle: '4 plans and 2 diet updates pending',
                    ),
                    SizedBox(height: 8),
                    FeatureTile(
                      icon: Icons.message_rounded,
                      title: 'Unread Member Messages',
                      subtitle: '7 unread chats need response',
                    ),
                    SizedBox(height: 8),
                    FeatureTile(
                      icon: Icons.notifications_active_rounded,
                      title: 'Priority Alerts',
                      subtitle: '3 members missed workouts for 3 days',
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            StaggeredReveal(
              delay: const Duration(milliseconds: 260),
              child: AppPanel(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Live Member Snapshot',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppColors.mint,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 10),
                    ...MockData.trainees.take(3).map(
                      (trainee) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          children: [
                            const Icon(Icons.circle, size: 10, color: AppColors.mint),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                '${trainee.name} · ${trainee.membershipStatus}',
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: AppColors.mint.withValues(alpha: 0.9),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _KpiBand extends StatelessWidget {
  const _KpiBand();

  @override
  Widget build(BuildContext context) {
    const kpis = [
      ('24', 'Assigned'),
      ('6', 'Sessions'),
      ('92%', 'Attendance'),
    ];

    return Row(
      children: kpis
          .map(
            (kpi) => Expanded(
              child: Padding(
                padding: const EdgeInsets.only(right: 8),
                child: AppPanel(
                  padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
                  child: Column(
                    children: [
                      Text(
                        kpi.$1,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: AppColors.mint,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(kpi.$2, style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                ),
              ),
            ),
          )
          .toList(),
    );
  }
}
