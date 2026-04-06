import 'package:dio/dio.dart';
import 'api_client.dart';

class TraineeDashboardData {
  const TraineeDashboardData({
    required this.traineeName,
    required this.currentPlan,
    required this.planRenewalLabel,
    required this.weeklySessionCompletion,
    required this.unreadNotifications,
    required this.latestWeightKg,
    required this.dailyCalories,
    required this.upcomingSessions,
    required this.todayFlow,
  });

  final String traineeName;
  final String currentPlan;
  final String planRenewalLabel;
  final int weeklySessionCompletion;
  final int unreadNotifications;
  final double latestWeightKg;
  final int dailyCalories;
  final List<String> upcomingSessions;
  final List<String> todayFlow;
}

class TraineeDashboardService {
  Future<TraineeDashboardData> load() async {
    final client = ApiClient.instance.client;

    final meResponse = await client.get<Map<String, dynamic>>('/api/auth/me');
    final me = ApiClient.unwrapData(meResponse.data);

    final results = await Future.wait<Map<String, dynamic>>([
      _safeGetData(client, '/api/subscriptions', {'limit': 20}),
      _safeGetData(client, '/api/sessions', {'limit': 100}),
      _safeGetData(client, '/api/workouts', {'limit': 20}),
      _safeGetData(client, '/api/progress', {'limit': 20}),
      _safeGetData(client, '/api/nutrition/summary', {'days': 7}),
      _safeGetData(client, '/api/notifications', {
        'isRead': 'false',
        'limit': 50,
      }),
    ]);

    final subscriptionsPayload = results[0];
    final sessionsPayload = results[1];
    final workoutsPayload = results[2];
    final progressPayload = results[3];
    final nutritionPayload = results[4];
    final notificationsPayload = results[5];

    final subscriptions =
        (subscriptionsPayload['subscriptions'] as List<dynamic>? ?? <dynamic>[])
            .whereType<Map<String, dynamic>>()
            .toList();
    final sessions =
        (sessionsPayload['sessions'] as List<dynamic>? ?? <dynamic>[])
            .whereType<Map<String, dynamic>>()
            .toList();
    final workoutPlans =
        (workoutsPayload['plans'] as List<dynamic>? ?? <dynamic>[])
            .whereType<Map<String, dynamic>>()
            .toList();
    final progressLogs =
        (progressPayload['logs'] as List<dynamic>? ?? <dynamic>[])
            .whereType<Map<String, dynamic>>()
            .toList();
    final notifications =
        (notificationsPayload['notifications'] as List<dynamic>? ?? <dynamic>[])
            .whereType<Map<String, dynamic>>()
            .toList();

    final activeSubscription = subscriptions
        .cast<Map<String, dynamic>?>()
        .firstWhere(
          (item) => item?['status'] == 'active',
          orElse: () => subscriptions.isNotEmpty ? subscriptions.first : null,
        );

    final planName = (() {
      final plan = activeSubscription?['plan'];
      if (plan is Map<String, dynamic>) {
        return (plan['name'] as String?)?.trim();
      }
      return null;
    })();

    final renewalText = _buildRenewalLabel(
      activeSubscription?['endDate'] as String?,
    );

    final now = DateTime.now();
    final upcoming =
        sessions.where((item) {
          final date = _parseDate(item['date'] as String?);
          return date != null && !date.isBefore(now);
        }).toList()..sort((a, b) {
          final left = _parseDate(a['date'] as String?);
          final right = _parseDate(b['date'] as String?);
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

    final weekStart = now.subtract(Duration(days: now.weekday - 1));
    final weekEnd = weekStart.add(const Duration(days: 7));

    final weekSessions = sessions.where((session) {
      final parsed = _parseDate(session['date'] as String?);
      if (parsed == null) {
        return false;
      }
      return !parsed.isBefore(weekStart) && parsed.isBefore(weekEnd);
    }).toList();

    final completedThisWeek = weekSessions
        .where((session) => session['status'] == 'completed')
        .length;
    final weeklyCompletion = weekSessions.isEmpty
        ? 0
        : ((completedThisWeek / weekSessions.length) * 100).round();

    final latestWeight = progressLogs.isEmpty
        ? 0.0
        : ((progressLogs.first['weightKg'] as num?) ?? 0).toDouble();

    final averages = nutritionPayload['averages'];
    final dailyCalories = averages is Map<String, dynamic>
        ? ((averages['dailyCalories'] as num?) ?? 0).round()
        : 0;

    final upcomingLines = upcoming.take(3).map((item) {
      final scheduleDate = _parseDate(item['date'] as String?);
      final trainer = item['trainer'];
      final trainerName = trainer is Map<String, dynamic>
          ? (trainer['name'] as String? ?? 'Trainer')
          : 'Trainer';

      if (scheduleDate == null) {
        return 'Upcoming with $trainerName';
      }

      final dateLabel =
          '${scheduleDate.year}-${scheduleDate.month.toString().padLeft(2, '0')}-${scheduleDate.day.toString().padLeft(2, '0')} '
          '${scheduleDate.hour.toString().padLeft(2, '0')}:${scheduleDate.minute.toString().padLeft(2, '0')}';

      return '$dateLabel - $trainerName';
    }).toList();

    final activeWorkoutCount = workoutPlans
        .where((plan) => plan['isActive'] == true)
        .length;

    final flow = <String>[
      if (upcomingLines.isNotEmpty) 'Next session: ${upcomingLines.first}',
      if (dailyCalories > 0) 'Nutrition target: $dailyCalories kcal/day',
      if (activeWorkoutCount > 0) '$activeWorkoutCount active workout plan(s)',
      if (notifications.isNotEmpty)
        '${notifications.length} unread notification(s)',
    ];

    return TraineeDashboardData(
      traineeName: (me['name'] as String?)?.trim().isNotEmpty == true
          ? me['name'] as String
          : 'Trainee',
      currentPlan: planName?.isNotEmpty == true ? planName! : 'No active plan',
      planRenewalLabel: renewalText,
      weeklySessionCompletion: weeklyCompletion,
      unreadNotifications: notifications.length,
      latestWeightKg: latestWeight,
      dailyCalories: dailyCalories,
      upcomingSessions: upcomingLines,
      todayFlow: flow,
    );
  }

  Future<Map<String, dynamic>> _safeGetData(
    Dio client,
    String path,
    Map<String, dynamic> query,
  ) async {
    try {
      final response = await client.get<Map<String, dynamic>>(
        path,
        queryParameters: query,
      );
      return ApiClient.unwrapData(response.data);
    } catch (_) {
      return <String, dynamic>{};
    }
  }

  static DateTime? _parseDate(String? raw) {
    if (raw == null || raw.isEmpty) {
      return null;
    }
    return DateTime.tryParse(raw)?.toLocal();
  }

  static String _buildRenewalLabel(String? endDateRaw) {
    final endDate = _parseDate(endDateRaw);
    if (endDate == null) {
      return 'Renewal date unavailable';
    }

    final now = DateTime.now();
    final difference = endDate.difference(now).inDays;

    if (difference < 0) {
      return 'Plan expired ${difference.abs()} day(s) ago';
    }
    if (difference == 0) {
      return 'Renews today';
    }
    return 'Renews in $difference day(s)';
  }
}
