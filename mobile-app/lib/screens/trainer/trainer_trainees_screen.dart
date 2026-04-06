import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_app/src/core/theme/app_colors.dart';
import 'package:mobile_app/src/core/widgets/animated_background.dart';
import '../../utils/mock_data.dart';
import '../../widgets/app_panel.dart';

class TrainerTraineesScreen extends StatelessWidget {
  const TrainerTraineesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AnimatedBackground(
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          children: [
            Text(
              'My Trainees',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: AppColors.mint),
            ),
            const SizedBox(height: 8),
            Text(
              'Assigned members with quick profile and planning access.',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: AppColors.mint.withValues(alpha: 0.82),
              ),
            ),
            const SizedBox(height: 14),
            ...MockData.trainees.map(
              (trainee) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: InkWell(
                  onTap: () => context.push('/trainer/trainee/${trainee.id}'),
                  borderRadius: BorderRadius.circular(16),
                  child: AppPanel(
                    child: Row(
                      children: [
                        CircleAvatar(
                          backgroundColor: AppColors.mint.withValues(alpha: 0.2),
                          child: Text(
                            trainee.name.isNotEmpty ? trainee.name[0] : '?',
                            style: const TextStyle(color: AppColors.mint),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                trainee.name,
                                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                  color: AppColors.mint,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              Text(
                                '${trainee.membershipStatus} · ${trainee.lastCheckIn}',
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
