import 'package:flutter/material.dart';
import 'package:mobile_app/src/core/theme/app_colors.dart';
import 'package:mobile_app/src/core/widgets/animated_background.dart';
import '../../utils/mock_data.dart';
import '../../widgets/app_panel.dart';
import '../../widgets/feature_tile.dart';

class TraineeHomeScreen extends StatelessWidget {
  const TraineeHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AnimatedBackground(
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          children: [
            Text(
              'Trainee Dashboard',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: AppColors.mint),
            ),
            const SizedBox(height: 8),
            Text(
              'Your plan, nutrition, attendance and progress in one place.',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: AppColors.mint.withValues(alpha: 0.82),
              ),
            ),
            const SizedBox(height: 16),
            const AppPanel(
              child: Row(
                children: [
                  Expanded(child: _KpiTile(value: '82%', label: 'Plan Done')),
                  SizedBox(width: 8),
                  Expanded(child: _KpiTile(value: '14', label: 'Streak Days')),
                  SizedBox(width: 8),
                  Expanded(child: _KpiTile(value: '3', label: 'This Week')), 
                ],
              ),
            ),
            const SizedBox(height: 16),
            AppPanel(
              child: Column(
                children: [
                  FeatureTile(
                    icon: Icons.bolt_rounded,
                    title: MockData.traineePlans.first.title,
                    subtitle: '${MockData.traineePlans.first.duration} · ${MockData.traineePlans.first.focus}',
                  ),
                  const SizedBox(height: 8),
                  const FeatureTile(
                    icon: Icons.local_fire_department_rounded,
                    title: 'Today\'s Calories',
                    subtitle: '1,580 / 2,100 kcal consumed',
                  ),
                  const SizedBox(height: 8),
                  const FeatureTile(
                    icon: Icons.verified_user_rounded,
                    title: 'Membership',
                    subtitle: 'Active and valid for 18 more days',
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _KpiTile extends StatelessWidget {
  const _KpiTile({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            color: AppColors.mint,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 2),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}
