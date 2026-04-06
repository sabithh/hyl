import 'package:flutter/material.dart';
import 'trainee_attendance_screen.dart';
import 'trainee_diet_screen.dart';
import 'trainee_home_screen.dart';
import 'trainee_profile_screen.dart';
import 'trainee_workouts_screen.dart';

class TraineeShellScreen extends StatefulWidget {
  const TraineeShellScreen({super.key});

  @override
  State<TraineeShellScreen> createState() => _TraineeShellScreenState();
}

class _TraineeShellScreenState extends State<TraineeShellScreen> {
  int _index = 0;

  static const _pages = [
    TraineeHomeScreen(),
    TraineeWorkoutsScreen(),
    TraineeDietScreen(),
    TraineeAttendanceScreen(),
    TraineeProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_rounded), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.fitness_center_rounded), label: 'Workouts'),
          NavigationDestination(icon: Icon(Icons.restaurant_rounded), label: 'Diet'),
          NavigationDestination(icon: Icon(Icons.qr_code_scanner_rounded), label: 'Check-in'),
          NavigationDestination(icon: Icon(Icons.person_rounded), label: 'Profile'),
        ],
      ),
    );
  }
}
