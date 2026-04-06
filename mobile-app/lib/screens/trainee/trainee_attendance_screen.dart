import 'package:flutter/material.dart';
import 'package:mobile_app/src/core/theme/app_colors.dart';
import 'package:mobile_app/src/core/widgets/animated_background.dart';
import '../../widgets/app_panel.dart';

class TraineeAttendanceScreen extends StatelessWidget {
  const TraineeAttendanceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AnimatedBackground(
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          children: [
            Text(
              'Attendance',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: AppColors.mint),
            ),
            const SizedBox(height: 8),
            const AppPanel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('This Month', style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.mint)),
                  SizedBox(height: 8),
                  _AttendanceRow(label: 'Present', value: '18 days'),
                  SizedBox(height: 6),
                  _AttendanceRow(label: 'Missed', value: '3 days'),
                  SizedBox(height: 6),
                  _AttendanceRow(label: 'Streak', value: '7 days'),
                ],
              ),
            ),
            const SizedBox(height: 12),
            AppPanel(
              child: Column(
                children: [
                  const Text('Gym QR Check-In', style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.mint)),
                  const SizedBox(height: 12),
                  Container(
                    width: 180,
                    height: 180,
                    decoration: BoxDecoration(
                      color: AppColors.mint.withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: const Icon(Icons.qr_code_2_rounded, size: 100, color: AppColors.mint),
                  ),
                  const SizedBox(height: 12),
                  FilledButton.icon(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Check-in simulated successfully.')),
                      );
                    },
                    icon: const Icon(Icons.verified_rounded),
                    label: const Text('Use This QR'),
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

class _AttendanceRow extends StatelessWidget {
  const _AttendanceRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label),
        Text(value, style: const TextStyle(color: AppColors.mint, fontWeight: FontWeight.w700)),
      ],
    );
  }
}
