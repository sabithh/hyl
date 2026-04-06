import '../models/trainee_profile.dart';
import '../models/workout_plan_summary.dart';

class ExerciseLibraryItem {
  const ExerciseLibraryItem({
    required this.name,
    required this.category,
    required this.level,
  });

  final String name;
  final String category;
  final String level;
}

class MockData {
  static const List<TraineeProfile> trainees = [
    TraineeProfile(
      id: 'tr-101',
      name: 'Ava Sharma',
      email: 'ava@fitmail.com',
      membershipStatus: 'Active',
      lastCheckIn: 'Today, 6:40 AM',
      goal: 'Lean strength',
    ),
    TraineeProfile(
      id: 'tr-102',
      name: 'Noah Patel',
      email: 'noah@fitmail.com',
      membershipStatus: 'Active',
      lastCheckIn: 'Yesterday, 7:12 PM',
      goal: 'Muscle gain',
    ),
    TraineeProfile(
      id: 'tr-103',
      name: 'Mia Khan',
      email: 'mia@fitmail.com',
      membershipStatus: 'Expiring in 6 days',
      lastCheckIn: '2 days ago',
      goal: 'Weight loss',
    ),
  ];

  static const List<WorkoutPlanSummary> traineePlans = [
    WorkoutPlanSummary(
      id: 'wp-201',
      title: 'Week 1 - Upper Body Foundation',
      duration: '45 mins',
      focus: 'Chest, Shoulders, Triceps',
      days: 4,
    ),
    WorkoutPlanSummary(
      id: 'wp-202',
      title: 'Week 2 - Lower Body Strength',
      duration: '55 mins',
      focus: 'Quads, Hamstrings, Glutes',
      days: 3,
    ),
  ];

  static const List<String> traineeNotifications = [
    'Your membership renews in 18 days.',
    'Coach Alex assigned a new workout plan.',
    'Weekly check-in reminder: log your progress today.',
  ];

  static const List<String> trainerNotifications = [
    '3 trainees have not checked in for 5+ days.',
    'Session booking request from Ava Sharma.',
    'Two workout plans need weekly review.',
  ];

  static const List<ExerciseLibraryItem> exerciseLibrary = [
    ExerciseLibraryItem(name: 'Barbell Squat', category: 'Legs', level: 'Intermediate'),
    ExerciseLibraryItem(name: 'Incline Dumbbell Press', category: 'Chest', level: 'Beginner'),
    ExerciseLibraryItem(name: 'Seated Cable Row', category: 'Back', level: 'Beginner'),
    ExerciseLibraryItem(name: 'Romanian Deadlift', category: 'Posterior Chain', level: 'Intermediate'),
    ExerciseLibraryItem(name: 'Battle Rope Intervals', category: 'Conditioning', level: 'Advanced'),
  ];
}
