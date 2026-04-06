import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/src/core/theme/app_colors.dart';
import 'package:mobile_app/src/core/widgets/animated_background.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/app_panel.dart';
import '../../widgets/feature_tile.dart';
import 'trainee_membership_screen.dart';
import 'trainee_notifications_screen.dart';
import 'trainee_referral_screen.dart';

class TraineeProfileScreen extends ConsumerWidget {
  const TraineeProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);

    return AnimatedBackground(
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          children: [
            Text(
              'My Profile',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: AppColors.mint),
            ),
            const SizedBox(height: 12),
            AppPanel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(auth.userName ?? 'Trainee', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 4),
                  Text(auth.userEmail ?? 'trainee@gymflow.app'),
                ],
              ),
            ),
            const SizedBox(height: 12),
            AppPanel(
              child: Column(
                children: [
                  FeatureTile(
                    icon: Icons.workspace_premium_rounded,
                    title: 'Membership',
                    subtitle: 'View plan, billing and renewal status',
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const TraineeMembershipScreen()),
                    ),
                  ),
                  const SizedBox(height: 8),
                  FeatureTile(
                    icon: Icons.notifications_rounded,
                    title: 'Notifications',
                    subtitle: 'Plan updates, reminders and alerts',
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const TraineeNotificationsScreen()),
                    ),
                  ),
                  const SizedBox(height: 8),
                  FeatureTile(
                    icon: Icons.card_giftcard_rounded,
                    title: 'Referral Program',
                    subtitle: 'Invite friends and unlock rewards',
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const TraineeReferralScreen()),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () => ref.read(authProvider.notifier).signOut(),
              icon: const Icon(Icons.logout_rounded),
              label: const Text('Sign Out'),
            ),
          ],
        ),
      ),
    );
  }
}
