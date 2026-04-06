import 'package:flutter/material.dart';
import 'package:mobile_app/src/core/theme/app_colors.dart';
import 'package:mobile_app/src/core/widgets/animated_background.dart';
import '../../widgets/app_panel.dart';

class TraineeDietScreen extends StatelessWidget {
  const TraineeDietScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AnimatedBackground(
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          children: [
            Text(
              'Diet Plan',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: AppColors.mint),
            ),
            const SizedBox(height: 8),
            AppPanel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Today\'s Nutrition', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  const _MacroBar(label: 'Protein', value: 0.72, text: '108g / 150g'),
                  const SizedBox(height: 8),
                  const _MacroBar(label: 'Carbs', value: 0.58, text: '175g / 300g'),
                  const SizedBox(height: 8),
                  const _MacroBar(label: 'Fats', value: 0.64, text: '51g / 80g'),
                ],
              ),
            ),
            const SizedBox(height: 12),
            const AppPanel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Meal Plan', style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.mint)),
                  SizedBox(height: 10),
                  _MealItem(time: '7:30 AM', meal: 'Oats, banana, whey'),
                  SizedBox(height: 6),
                  _MealItem(time: '1:00 PM', meal: 'Chicken rice bowl, salad'),
                  SizedBox(height: 6),
                  _MealItem(time: '5:00 PM', meal: 'Greek yogurt, almonds'),
                  SizedBox(height: 6),
                  _MealItem(time: '8:30 PM', meal: 'Grilled fish, veggies'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MacroBar extends StatelessWidget {
  const _MacroBar({required this.label, required this.value, required this.text});

  final String label;
  final double value;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label),
            Text(text),
          ],
        ),
        const SizedBox(height: 4),
        LinearProgressIndicator(value: value),
      ],
    );
  }
}

class _MealItem extends StatelessWidget {
  const _MealItem({required this.time, required this.meal});

  final String time;
  final String meal;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(width: 70, child: Text(time, style: Theme.of(context).textTheme.bodySmall)),
        const SizedBox(width: 8),
        Expanded(child: Text(meal)),
      ],
    );
  }
}
