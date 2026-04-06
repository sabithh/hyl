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
  final _nameController = TextEditingController();
  final _gymEmailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _referralCodeController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _authService = AuthService();

  bool _isSignUp = false;
  bool _obscurePassword = true;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _nameController.dispose();
    _gymEmailController.dispose();
    _phoneController.dispose();
    _referralCodeController.dispose();
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
                    _isSignUp ? 'Create Trainee Account' : 'HYL Trainee',
                    style: Theme.of(
                      context,
                    ).textTheme.headlineLarge?.copyWith(color: AppColors.mint),
                  ),
                ),
                const SizedBox(height: 8),
                StaggeredReveal(
                  delay: const Duration(milliseconds: 80),
                  child: Text(
                    _isSignUp
                        ? 'Sign up with your gym email to get your trainee account.'
                        : 'Sign in with your trainee account to access your live plan and progress.',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppColors.mint.withValues(alpha: 0.82),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                if (_isSignUp)
                  StaggeredReveal(
                    delay: const Duration(milliseconds: 120),
                    child: TextField(
                      controller: _nameController,
                      textCapitalization: TextCapitalization.words,
                      decoration: const InputDecoration(
                        labelText: 'Full Name',
                        prefixIcon: Icon(Icons.person_outline_rounded),
                      ),
                    ),
                  ),
                if (_isSignUp)
                  const SizedBox(height: 12),
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
                if (_isSignUp)
                  StaggeredReveal(
                    delay: const Duration(milliseconds: 170),
                    child: TextField(
                      controller: _gymEmailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                        labelText: 'Gym Email',
                        prefixIcon: Icon(Icons.business_rounded),
                      ),
                    ),
                  ),
                if (_isSignUp)
                  const SizedBox(height: 12),
                if (_isSignUp)
                  StaggeredReveal(
                    delay: const Duration(milliseconds: 185),
                    child: TextField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: 'Phone (Optional)',
                        prefixIcon: Icon(Icons.call_outlined),
                      ),
                    ),
                  ),
                if (_isSignUp)
                  const SizedBox(height: 12),
                if (_isSignUp)
                  StaggeredReveal(
                    delay: const Duration(milliseconds: 192),
                    child: TextField(
                      controller: _referralCodeController,
                      decoration: const InputDecoration(
                        labelText: 'Referral Code (Optional)',
                        prefixIcon: Icon(Icons.card_giftcard_rounded),
                      ),
                    ),
                  ),
                if (_isSignUp)
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
                          : Icon(_isSignUp ? Icons.person_add_alt_1_rounded : Icons.login_rounded),
                      label: Text(
                        _isSubmitting
                            ? (_isSignUp ? 'Creating account...' : 'Signing in...')
                            : (_isSignUp ? 'Create Trainee Account' : 'Sign In'),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                StaggeredReveal(
                  delay: const Duration(milliseconds: 300),
                  child: Center(
                    child: TextButton(
                      onPressed: _isSubmitting
                          ? null
                          : () {
                              setState(() {
                                _isSignUp = !_isSignUp;
                              });
                            },
                      child: Text(
                        _isSignUp
                            ? 'Already have a trainee account? Sign In'
                            : 'New trainee? Create account',
                      ),
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
    final name = _nameController.text.trim();
    final gymEmail = _gymEmailController.text.trim();
    final phone = _phoneController.text.trim();
    final referralCode = _referralCodeController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter both email and password.')),
      );
      return;
    }

    if (_isSignUp && (name.isEmpty || gymEmail.isEmpty)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Name and gym email are required for sign up.')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final session = _isSignUp
          ? await _authService.register(
              gymEmail: gymEmail,
              name: name,
              email: email,
              password: password,
              role: 'trainee',
              requiredRole: 'trainee',
              phone: phone.isEmpty ? null : phone,
              referralCode: referralCode.isEmpty ? null : referralCode,
            )
          : await _authService.login(
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
