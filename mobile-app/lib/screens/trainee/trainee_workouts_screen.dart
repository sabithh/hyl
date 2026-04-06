import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_app/src/core/theme/app_colors.dart';
import 'package:mobile_app/src/core/widgets/animated_background.dart';
import '../../utils/mock_data.dart';
import '../../widgets/app_panel.dart';

class TraineeWorkoutsScreen extends StatelessWidget {
  const TraineeWorkoutsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AnimatedBackground(
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          children: [
            Text(
              'Workout Plans',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: AppColors.mint),
            ),
            const SizedBox(height: 8),
            Text(
              'Assigned plans by your trainer. Tap any plan for full details.',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: AppColors.mint.withValues(alpha: 0.82),
              ),
            ),
            const SizedBox(height: 14),
            ...MockData.traineePlans.map(
              (plan) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: InkWell(
                  onTap: () => context.push('/trainee/workout/${plan.id}'),
                  borderRadius: BorderRadius.circular(16),
                  child: AppPanel(
                    child: Row(
                      children: [
                        const Icon(Icons.sports_gymnastics_rounded, color: AppColors.mint),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                plan.title,
                                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                  color: AppColors.mint,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              Text(
                                '${plan.duration} · ${plan.days} days/week',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                            ],
                          ),
                        ),
                        const Icon(Icons.chevron_right_rounded, color: AppColors.mint),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
