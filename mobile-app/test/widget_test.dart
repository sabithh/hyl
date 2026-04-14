import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/app.dart';

void main() {
  testWidgets('Splash screen renders branded title', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const GymPulseApp());

    expect(find.text('HYL'), findsOneWidget);
  });
}
