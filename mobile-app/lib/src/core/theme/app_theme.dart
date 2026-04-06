import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTheme {
  static final ThemeData theme = ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: AppColors.deep,
    colorScheme: const ColorScheme(
      brightness: Brightness.dark,
      primary: AppColors.fern,
      onPrimary: AppColors.mint,
      secondary: AppColors.forest,
      onSecondary: Colors.white,
      error: Color(0xFFFF6B6B),
      onError: Colors.black,
      surface: AppColors.card,
      onSurface: AppColors.mint,
    ),
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {
        TargetPlatform.android: FadeUpwardsPageTransitionsBuilder(),
        TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        TargetPlatform.macOS: FadeUpwardsPageTransitionsBuilder(),
        TargetPlatform.linux: FadeUpwardsPageTransitionsBuilder(),
        TargetPlatform.windows: FadeUpwardsPageTransitionsBuilder(),
      },
    ),
    textTheme: GoogleFonts.soraTextTheme().copyWith(
      headlineLarge: const TextStyle(
        fontWeight: FontWeight.w700,
        letterSpacing: -0.8,
      ),
      headlineMedium: const TextStyle(
        fontWeight: FontWeight.w700,
        letterSpacing: -0.4,
      ),
      bodyLarge: GoogleFonts.nunitoSans(fontSize: 16, height: 1.35),
      bodyMedium: GoogleFonts.nunitoSans(fontSize: 14, height: 1.3),
      labelLarge: GoogleFonts.nunitoSans(
        fontSize: 15,
        fontWeight: FontWeight.w700,
      ),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      centerTitle: false,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.forest.withValues(alpha: 0.24),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: AppColors.mint.withValues(alpha: 0.2)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: AppColors.mint.withValues(alpha: 0.2)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: AppColors.mint, width: 1.2),
      ),
      labelStyle: TextStyle(color: AppColors.mint.withValues(alpha: 0.9)),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      color: AppColors.forest.withValues(alpha: 0.26),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.fern,
        foregroundColor: AppColors.deep,
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 18),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    ),
  );
}
