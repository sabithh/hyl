class TraineeProfile {
  const TraineeProfile({
    required this.id,
    required this.name,
    required this.email,
    required this.membershipStatus,
    required this.lastCheckIn,
    required this.goal,
  });

  final String id;
  final String name;
  final String email;
  final String membershipStatus;
  final String lastCheckIn;
  final String goal;
}
