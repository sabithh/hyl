import 'package:flutter/material.dart';
import 'package:mobile_app/src/core/theme/app_colors.dart';
import '../../widgets/app_panel.dart';

class TraineeMembershipScreen extends StatelessWidget {
  const TraineeMembershipScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Membership')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const AppPanel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Pro Annual', style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.mint)),
                SizedBox(height: 8),
                Text('Status: Active'),
                SizedBox(height: 4),
                Text('Renews: 18 days from now'),
                SizedBox(height: 4),
                Text('Includes: Gym access + trainer guidance'),
              ],
            ),
          ),
          const SizedBox(height: 14),
          FilledButton.icon(
            onPressed: null,
            icon: Icon(Icons.credit_card_rounded),
            label: Text('Renew Plan'),
          ),
        ],
      ),
    );
  }
}
