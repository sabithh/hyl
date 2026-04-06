import 'package:flutter/material.dart';
import 'package:mobile_app/src/core/theme/app_colors.dart';
import '../../utils/mock_data.dart';
import '../../widgets/app_panel.dart';

class TraineeNotificationsScreen extends StatelessWidget {
  const TraineeNotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: MockData.traineeNotifications
            .map(
              (notification) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: AppPanel(
                  child: Row(
                    children: [
                      const Icon(Icons.notifications_active_rounded, color: AppColors.mint),
                      const SizedBox(width: 10),
                      Expanded(child: Text(notification)),
                    ],
                  ),
                ),
              ),
            )
            .toList(),
      ),
    );
  }
}
