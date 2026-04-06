import 'package:flutter/material.dart';
import 'package:mobile_app/src/core/theme/app_colors.dart';
import 'package:mobile_app/src/core/widgets/animated_background.dart';
import '../../utils/mock_data.dart';
import '../../widgets/app_panel.dart';

class TrainerExerciseLibraryScreen extends StatefulWidget {
  const TrainerExerciseLibraryScreen({super.key});

  @override
  State<TrainerExerciseLibraryScreen> createState() => _TrainerExerciseLibraryScreenState();
}

class _TrainerExerciseLibraryScreenState extends State<TrainerExerciseLibraryScreen> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final exercises = MockData.exerciseLibrary
        .where(
          (exercise) =>
              exercise.name.toLowerCase().contains(_query.toLowerCase()) ||
              exercise.category.toLowerCase().contains(_query.toLowerCase()),
        )
        .toList();

    return AnimatedBackground(
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          children: [
            Text(
              'Exercise Library',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: AppColors.mint),
            ),
            const SizedBox(height: 10),
            AppPanel(
              child: TextField(
                onChanged: (value) => setState(() => _query = value),
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.search_rounded),
                  hintText: 'Search by exercise or category',
                  border: InputBorder.none,
                ),
              ),
            ),
            const SizedBox(height: 12),
            ...exercises.map(
              (exercise) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: AppPanel(
                  child: Row(
                    children: [
                      Container(
                        height: 42,
                        width: 42,
                        decoration: BoxDecoration(
                          color: AppColors.mint.withValues(alpha: 0.16),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.fitness_center_rounded, color: AppColors.mint),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              exercise.name,
                              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                color: AppColors.mint,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            Text(
                              '${exercise.category} · ${exercise.level}',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('${exercise.name} added to builder')),
                          );
                        },
                        icon: const Icon(Icons.add_circle_outline_rounded),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 10),
            OutlinedButton.icon(
              onPressed: _showAddDialog,
              icon: const Icon(Icons.add_rounded),
              label: const Text('Add Custom Exercise'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showAddDialog() async {
    final controller = TextEditingController();
    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.forest,
        title: const Text('Add exercise'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(hintText: 'Exercise name'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.of(context).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Saved ${controller.text}')),
              );
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}
