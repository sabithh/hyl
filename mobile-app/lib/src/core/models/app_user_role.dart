enum AppUserRole { trainer, trainee }

extension AppUserRoleX on AppUserRole {
  String get label {
    switch (this) {
      case AppUserRole.trainer:
        return 'Trainer';
      case AppUserRole.trainee:
        return 'Trainee';
    }
  }

  String get welcomeLine {
    switch (this) {
      case AppUserRole.trainer:
        return 'Manage trainees, plans, and daily sessions.';
      case AppUserRole.trainee:
        return 'Track workouts, nutrition, and weekly progress.';
    }
  }
}
