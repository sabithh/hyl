class WorkoutPlanSummary {
  const WorkoutPlanSummary({
    required this.id,
    required this.title,
    required this.duration,
    required this.focus,
    required this.days,
  });

  final String id;
  final String title;
  final String duration;
  final String focus;
  final int days;
}
