import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/animated_background.dart';
import '../../core/widgets/staggered_reveal.dart';
import '../../services/auth_service.dart';
import '../../services/trainee_dashboard_service.dart';

class TraineeHomeScreen extends StatefulWidget {
  const TraineeHomeScreen({
    super.key,
    required this.session,
    required this.onSignOut,
  });

  final AuthSession session;
  final Future<void> Function() onSignOut;

  @override
  State<TraineeHomeScreen> createState() => _TraineeHomeScreenState();
}

class _TraineeHomeScreenState extends State<TraineeHomeScreen> {
  final TraineeDashboardService _dashboardService = TraineeDashboardService();
  late Future<TraineeDashboardData> _dashboardFuture;

  @override
  void initState() {
    super.initState();
    _dashboardFuture = _dashboardService.load();
  }

  void _reload() {
    setState(() {
      _dashboardFuture = _dashboardService.load();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedBackground(
        child: SafeArea(
          child: FutureBuilder<TraineeDashboardData>(
            future: _dashboardFuture,
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return const Center(child: CircularProgressIndicator());
              }

              if (snapshot.hasError) {
                return _ErrorState(
                  message: snapshot.error.toString().replaceFirst(
                    'Exception: ',
                    '',
                  ),
                  onRetry: _reload,
                  onSignOut: _signOut,
                );
              }

              final dashboard = snapshot.data;
              if (dashboard == null) {
                return _ErrorState(
                  message: 'Unable to load trainee dashboard data.',
                  onRetry: _reload,
                  onSignOut: _signOut,
                );
              }

              final textTheme = Theme.of(context).textTheme;

              return ListView(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                children: [
                  StaggeredReveal(
                    child: Row(
                      children: [
                        const CircleAvatar(
                          backgroundColor: AppColors.mint,
                          foregroundColor: AppColors.deep,
                          child: Icon(Icons.person_rounded),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            dashboard.traineeName,
                            style: textTheme.titleLarge?.copyWith(
                              color: AppColors.mint,
                            ),
                          ),
                        ),
                        IconButton(
                          onPressed: _signOut,
                          icon: const Icon(Icons.logout_rounded),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 6),
                  StaggeredReveal(
                    delay: const Duration(milliseconds: 70),
                    child: Text(
                      widget.session.userEmail,
                      style: textTheme.bodyMedium?.copyWith(
                        color: AppColors.mint.withValues(alpha: 0.82),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  StaggeredReveal(
                    delay: const Duration(milliseconds: 110),
                    child: _StatsRow(dashboard: dashboard),
                  ),
                  const SizedBox(height: 14),
                  StaggeredReveal(
                    delay: const Duration(milliseconds: 160),
                    child: _MembershipCard(dashboard: dashboard),
                  ),
                  const SizedBox(height: 16),
                  StaggeredReveal(
                    delay: const Duration(milliseconds: 220),
                    child: Text(
                      'Upcoming Sessions',
                      style: textTheme.titleMedium?.copyWith(
                        color: AppColors.mint,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  if (dashboard.upcomingSessions.isEmpty)
                    const StaggeredReveal(
                      delay: Duration(milliseconds: 260),
                      child: _SimpleActionTile(
                        icon: Icons.event_busy_rounded,
                        title: 'No upcoming sessions',
                        subtitle:
                            'Book your next training session from the app.',
                      ),
                    )
                  else
                    ...dashboard.upcomingSessions.map(
                      (line) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: StaggeredReveal(
                          delay: const Duration(milliseconds: 260),
                          child: _SimpleActionTile(
                            icon: Icons.event_available_rounded,
                            title: line,
                            subtitle: 'Synced from /api/sessions',
                          ),
                        ),
                      ),
                    ),
                  const SizedBox(height: 8),
                  StaggeredReveal(
                    delay: const Duration(milliseconds: 320),
                    child: Text(
                      'Today\'s Flow',
                      style: textTheme.titleMedium?.copyWith(
                        color: AppColors.mint,
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  if (dashboard.todayFlow.isEmpty)
                    const StaggeredReveal(
                      delay: Duration(milliseconds: 360),
                      child: _SimpleActionTile(
                        icon: Icons.track_changes_rounded,
                        title: 'No tasks for today',
                        subtitle:
                            'Your plan items will appear here automatically.',
                      ),
                    )
                  else
                    ...dashboard.todayFlow.map(
                      (line) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: StaggeredReveal(
                          delay: const Duration(milliseconds: 360),
                          child: _SimpleActionTile(
                            icon: Icons.bolt_rounded,
                            title: line,
                            subtitle: 'Live plan insight',
                          ),
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _reload,
        backgroundColor: AppColors.fern,
        foregroundColor: AppColors.deep,
        child: const Icon(Icons.refresh_rounded),
      ),
    );
  }

  Future<void> _signOut() async {
    await widget.onSignOut();
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow({required this.dashboard});

  final TraineeDashboardData dashboard;

  @override
  Widget build(BuildContext context) {
    final metrics = [
      ('${dashboard.weeklySessionCompletion}%', 'Weekly Completion'),
      ('${dashboard.unreadNotifications}', 'Unread Alerts'),
      (
        dashboard.latestWeightKg <= 0
            ? '--'
            : '${dashboard.latestWeightKg.toStringAsFixed(1)} kg',
        'Latest Weight',
      ),
      (
        dashboard.dailyCalories <= 0 ? '--' : '${dashboard.dailyCalories}',
        'Avg Daily kcal',
      ),
    ];

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: metrics
          .map(
            (item) => SizedBox(
              width: (MediaQuery.sizeOf(context).width - 56) / 2,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  vertical: 14,
                  horizontal: 12,
                ),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  color: AppColors.forest.withValues(alpha: 0.36),
                  border: Border.all(
                    color: AppColors.mint.withValues(alpha: 0.24),
                  ),
                ),
                child: Column(
                  children: [
                    Text(
                      item.$1,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: AppColors.mint,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.$2,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.mint.withValues(alpha: 0.82),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          )
          .toList(),
    );
  }
}

class _MembershipCard extends StatelessWidget {
  const _MembershipCard({required this.dashboard});

  final TraineeDashboardData dashboard;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          colors: [
            AppColors.forest.withValues(alpha: 0.7),
            AppColors.fern.withValues(alpha: 0.58),
          ],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            dashboard.currentPlan,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: AppColors.mint,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            dashboard.planRenewalLabel,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              color: AppColors.mint.withValues(alpha: 0.9),
            ),
          ),
        ],
      ),
    );
  }
}

class _SimpleActionTile extends StatelessWidget {
  const _SimpleActionTile({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        color: AppColors.forest.withValues(alpha: 0.32),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.mint.withValues(alpha: 0.18),
            ),
            child: Icon(icon, color: AppColors.mint),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppColors.mint,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.mint.withValues(alpha: 0.82),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({
    required this.message,
    required this.onRetry,
    required this.onSignOut,
  });

  final String message;
  final VoidCallback onRetry;
  final Future<void> Function() onSignOut;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.error_outline_rounded,
            size: 48,
            color: Colors.orangeAccent,
          ),
          const SizedBox(height: 12),
          Text(
            message,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyLarge,
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Retry'),
          ),
          const SizedBox(height: 8),
          TextButton.icon(
            onPressed: onSignOut,
            icon: const Icon(Icons.logout_rounded),
            label: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }
}
