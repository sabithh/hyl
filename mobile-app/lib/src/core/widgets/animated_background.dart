import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class AnimatedBackground extends StatefulWidget {
  const AnimatedBackground({super.key, required this.child});

  final Widget child;

  @override
  State<AnimatedBackground> createState() => _AnimatedBackgroundState();
}

class _AnimatedBackgroundState extends State<AnimatedBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 16),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final phase = _controller.value * math.pi * 2;

        return Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [AppColors.night, AppColors.deep, AppColors.forest],
            ),
          ),
          child: Stack(
            children: [
              Positioned(
                top: -120 + math.sin(phase) * 30,
                left: -80 + math.cos(phase * 0.8) * 40,
                child: _blob(AppColors.fern.withValues(alpha: 0.22), 240),
              ),
              Positioned(
                right: -90 + math.cos(phase * 1.2) * 26,
                top: 160 + math.sin(phase * 1.5) * 24,
                child: _blob(AppColors.mint.withValues(alpha: 0.18), 220),
              ),
              Positioned(
                bottom: -120 + math.sin(phase * 1.1) * 35,
                left: 100 + math.cos(phase * 0.6) * 30,
                child: _blob(AppColors.forest.withValues(alpha: 0.25), 280),
              ),
              Positioned.fill(child: child!),
            ],
          ),
        );
      },
      child: widget.child,
    );
  }

  Widget _blob(Color color, double size) {
    return IgnorePointer(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: color,
          boxShadow: [
            BoxShadow(blurRadius: 80, spreadRadius: 30, color: color),
          ],
        ),
      ),
    );
  }
}
