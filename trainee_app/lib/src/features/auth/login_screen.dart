import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/animated_background.dart';
import '../../core/widgets/staggered_reveal.dart';
import '../../services/auth_service.dart';

class TraineeLoginScreen extends StatefulWidget {
  const TraineeLoginScreen({super.key, required this.onSignedIn});

  final ValueChanged<AuthSession> onSignedIn;

  @override
  State<TraineeLoginScreen> createState() => _TraineeLoginScreenState();
}

class _TraineeLoginScreenState extends State<TraineeLoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _authService = AuthService();

  bool _obscurePassword = true;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                StaggeredReveal(
                  child: Text(
                    'HYL Trainee',
                    style: Theme.of(
                      context,
                    ).textTheme.headlineLarge?.copyWith(color: AppColors.mint),
                  ),
                ),
                const SizedBox(height: 8),
                StaggeredReveal(
                  delay: const Duration(milliseconds: 80),
                  child: Text(
                    'Sign in with your trainee account to access your live plan and progress.',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppColors.mint.withValues(alpha: 0.82),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                StaggeredReveal(
                  delay: const Duration(milliseconds: 140),
                  child: TextField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      labelText: 'Email',
                      prefixIcon: Icon(Icons.alternate_email_rounded),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                StaggeredReveal(
                  delay: const Duration(milliseconds: 200),
                  child: TextField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      labelText: 'Password',
                      prefixIcon: const Icon(Icons.lock_outline_rounded),
                      suffixIcon: IconButton(
                        onPressed: () {
                          setState(() => _obscurePassword = !_obscurePassword);
                        },
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility_rounded
                              : Icons.visibility_off_rounded,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                StaggeredReveal(
                  delay: const Duration(milliseconds: 260),
                  child: SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: _isSubmitting ? null : _submit,
                      icon: _isSubmitting
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.login_rounded),
                      label: Text(_isSubmitting ? 'Signing in...' : 'Sign In'),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter both email and password.')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final session = await _authService.login(
        email: email,
        password: password,
        requiredRole: 'trainee',
      );
      if (!mounted) {
        return;
      }
      widget.onSignedIn(session);
    } catch (error) {
      if (!mounted) {
        return;
      }
      final message = error.toString().replaceFirst('Exception: ', '');
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(message)));
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }
}
