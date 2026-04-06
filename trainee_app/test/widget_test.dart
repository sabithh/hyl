import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:trainee_app/src/app.dart';

void main() {
  testWidgets('HYL Trainee app renders login title', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(const TraineePulseApp());
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 800));

    expect(find.text('HYL Trainee'), findsOneWidget);
  });
}
