import 'api_client.dart';

class TrainerDashboardData {
  const TrainerDashboardData({
    required this.trainerName,
    required this.activeTrainees,
    required this.sessionsToday,
    required this.completionRate,
    required this.unreadNotifications,
    required this.topTrainees,
    required this.upcomingSessions,
  });

  final String trainerName;
  final int activeTrainees;
  final int sessionsToday;
  final int completionRate;
  final int unreadNotifications;
  final List<String> topTrainees;
  final List<String> upcomingSessions;
}

class TrainerDashboardService {
  Future<TrainerDashboardData> load() async {
    final client = ApiClient.instance.client;

    final meResponse = await client.get<Map<String, dynamic>>('/api/auth/me');
    final me = ApiClient.unwrapData(meResponse.data);

    final membersResponse = await client.get<Map<String, dynamic>>(
      '/api/members',
      queryParameters: {'role': 'trainee', 'limit': 100},
    );
    final memberPayload = ApiClient.unwrapData(membersResponse.data);
    final members = (memberPayload['members'] as List<dynamic>? ?? <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .toList();

    final sessionsResponse = await client.get<Map<String, dynamic>>(
      '/api/sessions',
      queryParameters: {'limit': 100},
    );
    final sessionPayload = ApiClient.unwrapData(sessionsResponse.data);
    final sessions = (sessionPayload['sessions'] as List<dynamic>? ?? <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .toList();

    final notificationsResponse = await client.get<Map<String, dynamic>>(
      '/api/notifications',
      queryParameters: {'isRead': 'false', 'limit': 50},
    );
    final notificationPayload = ApiClient.unwrapData(notificationsResponse.data);
    final notifications = (notificationPayload['notifications'] as List<dynamic>? ?? <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .toList();

    final now = DateTime.now();
    final dayStart = DateTime(now.year, now.month, now.day);
    final dayEnd = dayStart.add(const Duration(days: 1));

    final todaySessions = sessions.where((session) {
      final rawDate = session['date'];
      if (rawDate is! String) {
        return false;
      }
      final parsed = DateTime.tryParse(rawDate);
      if (parsed == null) {
        return false;
      }
      final local = parsed.toLocal();
      return !local.isBefore(dayStart) && local.isBefore(dayEnd);
    }).toList();

    final completedCount = sessions.where((session) => session['status'] == 'completed').length;
    final completionRate = sessions.isEmpty ? 0 : ((completedCount / sessions.length) * 100).round();

    final traineeLines = members
        .take(3)
        .map((member) {
          final name = (member['name'] as String?) ?? 'Member';
          final active = member['isActive'] == true ? 'Active' : 'Inactive';
          return '$name - $active';
        })
        .toList();

    final upcoming = sessions
        .where((session) {
          final rawDate = session['date'];
          if (rawDate is! String) {
            return false;
          }
          final parsed = DateTime.tryParse(rawDate);
          return parsed != null && !parsed.toLocal().isBefore(now);
        })
        .toList()
      ..sort((a, b) {
        final left = DateTime.tryParse((a['date'] as String?) ?? '');
        final right = DateTime.tryParse((b['date'] as String?) ?? '');
        if (left == null && right == null) {
          return 0;
        }
        if (left == null) {
          return 1;
        }
        if (right == null) {
          return -1;
        }
        return left.compareTo(right);
      });

    final sessionLines = upcoming.take(3).map((session) {
      final rawDate = session['date'] as String?;
      final parsed = rawDate == null ? null : DateTime.tryParse(rawDate)?.toLocal();
      final trainee = session['trainee'];
      final traineeName = trainee is Map<String, dynamic>
          ? (trainee['name'] as String? ?? 'Trainee')
          : 'Trainee';

      final label = parsed == null
          ? 'Upcoming session'
          : '${parsed.year}-${parsed.month.toString().padLeft(2, '0')}-${parsed.day.toString().padLeft(2, '0')} '
              '${parsed.hour.toString().padLeft(2, '0')}:${parsed.minute.toString().padLeft(2, '0')}';

      return '$label - $traineeName';
    }).toList();

    return TrainerDashboardData(
      trainerName: (me['name'] as String?) ?? 'Trainer',
      activeTrainees: members.where((member) => member['isActive'] == true).length,
      sessionsToday: todaySessions.length,
      completionRate: completionRate,
      unreadNotifications: notifications.length,
      topTrainees: traineeLines,
      upcomingSessions: sessionLines,
    );
  }
}
