import 'package:flutter/material.dart';
import 'package:mobile_app/src/core/theme/app_colors.dart';
import 'package:mobile_app/src/core/widgets/animated_background.dart';
import '../../utils/mock_data.dart';
import '../../widgets/app_panel.dart';

class WorkoutDetailScreen extends StatelessWidget {
  const WorkoutDetailScreen({
    super.key,
    required this.workoutId,
  });

  final String workoutId;

  @override
  Widget build(BuildContext context) {
    final plan = MockData.traineePlans.firstWhere(
      (item) => item.id == workoutId,
      orElse: () => MockData.traineePlans.first,
    );

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
                  Expanded(
                    child: Text(
                      plan.title,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(color: AppColors.mint),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              AppPanel(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Focus: ${plan.focus}'),
                    const SizedBox(height: 6),
                    Text('Duration: ${plan.duration}'),
                    const SizedBox(height: 6),
                    Text('Frequency: ${plan.days} days/week'),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              AppPanel(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    _ExerciseItem(name: 'Warm-up Mobility', reps: '8 mins dynamic prep'),
                    SizedBox(height: 8),
                    _ExerciseItem(name: 'Barbell Squat', reps: '4 sets × 8 reps'),
                    SizedBox(height: 8),
                    _ExerciseItem(name: 'Romanian Deadlift', reps: '3 sets × 10 reps'),
                    SizedBox(height: 8),
                    _ExerciseItem(name: 'Core Finisher', reps: '3 rounds × 45 sec plank'),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Progress marked for today.')),
                  );
                },
                icon: const Icon(Icons.check_circle_outline_rounded),
                label: const Text('Mark as Completed'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ExerciseItem extends StatelessWidget {
  const _ExerciseItem({required this.name, required this.reps});

  final String name;
  final String reps;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Icon(Icons.fitness_center_rounded, color: AppColors.mint, size: 18),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            name,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              color: AppColors.mint,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        Text(reps, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}
