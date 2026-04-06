import 'package:flutter/material.dart';
import 'trainer_exercise_library_screen.dart';
import 'trainer_home_screen.dart';
import 'trainer_planning_screen.dart';
import 'trainer_profile_screen.dart';
import 'trainer_trainees_screen.dart';

class TrainerShellScreen extends StatefulWidget {
  const TrainerShellScreen({super.key});

  @override
  State<TrainerShellScreen> createState() => _TrainerShellScreenState();
}

class _TrainerShellScreenState extends State<TrainerShellScreen> {
  int _index = 0;

  static const _pages = [
    TrainerHomeScreen(),
    TrainerTraineesScreen(),
    TrainerPlanningScreen(),
    TrainerExerciseLibraryScreen(),
    TrainerProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard_rounded), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.people_alt_rounded), label: 'Trainees'),
          NavigationDestination(icon: Icon(Icons.edit_calendar_rounded), label: 'Plans'),
          NavigationDestination(icon: Icon(Icons.fitness_center_rounded), label: 'Exercises'),
          NavigationDestination(icon: Icon(Icons.person_rounded), label: 'Profile'),
        ],
      ),
    );
  }
}
