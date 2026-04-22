import 'package:flutter/material.dart';
import 'package:mobile_app/src/core/theme/app_colors.dart';
import 'package:mobile_app/src/core/widgets/animated_background.dart';
import '../../utils/mock_data.dart';
import '../../widgets/app_panel.dart';

class TraineeDetailScreen extends StatelessWidget {
  const TraineeDetailScreen({
    super.key,
    required this.traineeId,
  });

  final String traineeId;

  @override
  Widget build(BuildContext context) {
    final matches = MockData.trainees.where((item) => item.id == traineeId);
    final trainee = matches.isNotEmpty ? matches.first : null;

    if (trainee == null) {
      return Scaffold(
        body: AnimatedBackground(
          child: SafeArea(
            child: Column(
              children: [
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.arrow_back_rounded, color: AppColors.mint),
                ),
                const Expanded(
                  child: Center(
                    child: Text(
                      'Trainee not found',
                      style: TextStyle(color: AppColors.mint),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      body: AnimatedBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
            children: [
              Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.arrow_back_rounded),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    trainee.name,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(color: AppColors.mint),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              AppPanel(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Goal: ${trainee.goal}', style: Theme.of(context).textTheme.bodyLarge),
                    const SizedBox(height: 6),
                    Text('Membership: ${trainee.membershipStatus}'),
                    const SizedBox(height: 6),
                    Text('Last check-in: ${trainee.lastCheckIn}'),
                    const SizedBox(height: 6),
                    Text('Email: ${trainee.email}'),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              AppPanel(
                child: Column(
                  children: [
                    _quickAction(context, Icons.bolt_rounded, 'Create Workout Plan'),
                    const SizedBox(height: 8),
                    _quickAction(context, Icons.restaurant_menu_rounded, 'Create Diet Plan'),
                    const SizedBox(height: 8),
                    _quickAction(context, Icons.chat_rounded, 'Open Chat'),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _quickAction(BuildContext context, IconData icon, String label) {
    return InkWell(
      onTap: () {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('$label opened for $traineeId')),
        );
      },
      borderRadius: BorderRadius.circular(14),
      child: Ink(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          color: AppColors.forest.withValues(alpha: 0.3),
        ),
        child: Row(
          children: [
            Icon(icon, color: AppColors.mint),
            const SizedBox(width: 10),
            Expanded(child: Text(label)),
            const Icon(Icons.chevron_right_rounded, color: AppColors.mint),
          ],
        ),
      ),
    );
  }
}
