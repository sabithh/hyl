import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/src/core/theme/app_colors.dart';
import 'package:mobile_app/src/core/widgets/animated_background.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/app_panel.dart';
import '../../widgets/feature_tile.dart';

class TrainerProfileScreen extends ConsumerWidget {
  const TrainerProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);

    return AnimatedBackground(
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          children: [
            Text(
              'Trainer Profile',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: AppColors.mint),
            ),
            const SizedBox(height: 12),
            AppPanel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(auth.userName ?? 'Trainer', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 4),
                  Text(auth.userEmail ?? 'trainer@gymflow.app'),
                  const SizedBox(height: 4),
                  Text('Role: ${auth.role?.name ?? 'trainer'}'),
                ],
              ),
            ),
            const SizedBox(height: 12),
            const AppPanel(
              child: Column(
                children: [
                  FeatureTile(
                    icon: Icons.notifications_rounded,
                    title: 'Notifications',
                    subtitle: '9 new member updates and class reminders',
                  ),
                  SizedBox(height: 8),
                  FeatureTile(
                    icon: Icons.history_rounded,
                    title: 'Recent Activity',
                    subtitle: 'Assigned plans to 6 members this week',
                  ),
                  SizedBox(height: 8),
                  FeatureTile(
                    icon: Icons.security_rounded,
                    title: 'Security',
                    subtitle: 'Two-factor authentication enabled',
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
