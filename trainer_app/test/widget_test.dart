import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:trainer_app/src/app.dart';

void main() {
  testWidgets('HYL Trainer app renders login title', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(const TrainerPulseApp());
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 800));

    expect(find.text('HYL Trainer'), findsOneWidget);
  });
}
