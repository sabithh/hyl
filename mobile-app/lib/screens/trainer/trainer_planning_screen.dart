import 'package:flutter/material.dart';
import 'package:mobile_app/src/core/theme/app_colors.dart';
import 'package:mobile_app/src/core/widgets/animated_background.dart';
import '../../utils/mock_data.dart';
import '../../widgets/app_panel.dart';

class TrainerPlanningScreen extends StatefulWidget {
  const TrainerPlanningScreen({super.key});

  @override
  State<TrainerPlanningScreen> createState() => _TrainerPlanningScreenState();
}

class _TrainerPlanningScreenState extends State<TrainerPlanningScreen> {
  String _selectedTraineeId = MockData.trainees.first.id;
  final TextEditingController _workoutTitleController = TextEditingController();
  final TextEditingController _dietTitleController = TextEditingController();

  @override
  void dispose() {
    _workoutTitleController.dispose();
    _dietTitleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: AnimatedBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
            children: [
              Text(
                'Plan Builder',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: AppColors.mint),
              ),
              const SizedBox(height: 8),
              Text(
                'Create workout and diet plans for assigned trainees.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppColors.mint.withValues(alpha: 0.82),
                ),
              ),
              const SizedBox(height: 16),
              AppPanel(
                child: DropdownButtonFormField<String>(
                  initialValue: _selectedTraineeId,
                  dropdownColor: AppColors.forest,
                  decoration: const InputDecoration(labelText: 'Select Trainee'),
                  items: MockData.trainees
                      .map(
                        (trainee) => DropdownMenuItem<String>(
                          value: trainee.id,
                          child: Text(trainee.name),
                        ),
                      )
                      .toList(),
                  onChanged: (value) {
                    if (value == null) {
                      return;
                    }
                    setState(() => _selectedTraineeId = value);
                  },
                ),
              ),
              const SizedBox(height: 14),
              Container(
                decoration: BoxDecoration(
                  color: AppColors.forest.withValues(alpha: 0.28),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const TabBar(
                  tabs: [
                    Tab(text: 'Workout Plan'),
                    Tab(text: 'Diet Plan'),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              SizedBox(
                height: 340,
                child: TabBarView(
                  children: [
                    _buildWorkoutForm(context),
                    _buildDietForm(context),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWorkoutForm(BuildContext context) {
    return AppPanel(
      child: Column(
        children: [
          TextField(
            controller: _workoutTitleController,
            decoration: const InputDecoration(labelText: 'Workout title'),
          ),
          const SizedBox(height: 10),
          const TextField(
            decoration: InputDecoration(labelText: 'Duration (e.g. 45 mins)'),
          ),
          const SizedBox(height: 10),
          const TextField(
            maxLines: 3,
            decoration: InputDecoration(labelText: 'Focus & notes'),
          ),
          const Spacer(),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: () => _save(context, 'Workout Plan'),
              icon: const Icon(Icons.bolt_rounded),
              label: const Text('Create Workout Plan'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDietForm(BuildContext context) {
    return AppPanel(
      child: Column(
        children: [
          TextField(
            controller: _dietTitleController,
            decoration: const InputDecoration(labelText: 'Diet title'),
          ),
          const SizedBox(height: 10),
          const TextField(
            decoration: InputDecoration(labelText: 'Daily calories target'),
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 10),
          const TextField(
            maxLines: 3,
            decoration: InputDecoration(labelText: 'Meal split and notes'),
          ),
          const Spacer(),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: () => _save(context, 'Diet Plan'),
              icon: const Icon(Icons.restaurant_menu_rounded),
              label: const Text('Create Diet Plan'),
            ),
          ),
        ],
      ),
    );
  }

  void _save(BuildContext context, String type) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$type created for trainee $_selectedTraineeId')),
    );
  }
}
