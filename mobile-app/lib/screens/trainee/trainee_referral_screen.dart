import 'package:flutter/material.dart';
import 'package:mobile_app/src/core/theme/app_colors.dart';
import '../../widgets/app_panel.dart';

class TraineeReferralScreen extends StatelessWidget {
  const TraineeReferralScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Referrals')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const AppPanel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Your Referral Code', style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.mint)),
                SizedBox(height: 8),
                SelectableText('GYMFLOW-AVA-73'),
                SizedBox(height: 8),
                Text('Invite 1 friend and unlock one free nutrition consultation.'),
              ],
            ),
          ),
          const SizedBox(height: 12),
          const AppPanel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Referral Progress', style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.mint)),
                SizedBox(height: 8),
                Text('2 successful referrals'),
                SizedBox(height: 4),
                Text('1 more to unlock your next reward'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
