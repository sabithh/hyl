import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/animated_background.dart';
import '../../core/widgets/staggered_reveal.dart';
import '../../services/auth_service.dart';
import '../../services/trainer_dashboard_service.dart';

class TrainerHomeScreen extends StatefulWidget {
  const TrainerHomeScreen({
    super.key,
    required this.session,
    required this.onSignOut,
  });

  final AuthSession session;
  final Future<void> Function() onSignOut;

  @override
  State<TrainerHomeScreen> createState() => _TrainerHomeScreenState();
}

class _TrainerHomeScreenState extends State<TrainerHomeScreen> {
  final TrainerDashboardService _dashboardService = TrainerDashboardService();
  late Future<TrainerDashboardData> _dashboardFuture;

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
          child: FutureBuilder<TrainerDashboardData>(
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
                  message: 'Unable to load dashboard data.',
                  onRetry: _reload,
                  onSignOut: _signOut,
                );
              }

              return ListView(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                children: [
                  StaggeredReveal(
                    child: Row(
                      children: [
                        const CircleAvatar(
                          backgroundColor: AppColors.mint,
                          foregroundColor: AppColors.deep,
                          child: Icon(Icons.sports_gymnastics_rounded),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            dashboard.trainerName,
                            style: Theme.of(context).textTheme.titleLarge
                                ?.copyWith(color: AppColors.mint),
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
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.mint.withValues(alpha: 0.82),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  StaggeredReveal(
                    delay: const Duration(milliseconds: 120),
                    child: _StatsRow(dashboard: dashboard),
                  ),
                  const SizedBox(height: 18),
                  StaggeredReveal(
                    delay: const Duration(milliseconds: 180),
                    child: Text(
                      'Upcoming Sessions',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppColors.mint,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  if (dashboard.upcomingSessions.isEmpty)
                    const StaggeredReveal(
                      delay: Duration(milliseconds: 220),
                      child: _InfoCard(
                        title: 'No upcoming sessions',
                        subtitle: 'New bookings will appear here in real time.',
                        icon: Icons.event_busy_rounded,
                      ),
                    )
                  else
                    ...dashboard.upcomingSessions
                        .take(3)
                        .map(
                          (line) => Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: StaggeredReveal(
                              delay: const Duration(milliseconds: 220),
                              child: _InfoCard(
                                title: line,
                                subtitle: 'Synced from /api/sessions',
                                icon: Icons.event_available_rounded,
                              ),
                            ),
                          ),
                        ),
                  const SizedBox(height: 8),
                  StaggeredReveal(
                    delay: const Duration(milliseconds: 280),
                    child: Text(
                      'Assigned Trainees',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppColors.mint,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  if (dashboard.topTrainees.isEmpty)
                    const StaggeredReveal(
                      delay: Duration(milliseconds: 320),
                      child: _InfoCard(
                        title: 'No assigned trainees yet',
                        subtitle:
                            'Assignments from owner panel will appear here.',
                        icon: Icons.people_alt_outlined,
                      ),
                    )
                  else
                    ...dashboard.topTrainees.map(
                      (line) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: StaggeredReveal(
                          delay: const Duration(milliseconds: 320),
                          child: _InfoCard(
                            title: line,
                            subtitle: 'Synced from /api/members',
                            icon: Icons.person_outline_rounded,
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

  final TrainerDashboardData dashboard;

  @override
  Widget build(BuildContext context) {
    final stats = [
      ('${dashboard.activeTrainees}', 'Active Trainees'),
      ('${dashboard.sessionsToday}', 'Sessions Today'),
      ('${dashboard.completionRate}%', 'Completion'),
      ('${dashboard.unreadNotifications}', 'Unread Alerts'),
    ];

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: stats
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
                  color: AppColors.forest.withValues(alpha: 0.4),
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

class _InfoCard extends StatelessWidget {
  const _InfoCard({
    required this.title,
    required this.subtitle,
    required this.icon,
  });

  final String title;
  final String subtitle;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        color: AppColors.forest.withValues(alpha: 0.36),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
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
                    color: AppColors.mint.withValues(alpha: 0.8),
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
