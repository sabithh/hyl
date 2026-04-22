import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_app/src/core/models/app_user_role.dart';
import 'package:mobile_app/src/core/theme/app_colors.dart';
import 'package:mobile_app/src/core/widgets/animated_background.dart';
import 'package:mobile_app/src/core/widgets/staggered_reveal.dart';
import '../../providers/auth_provider.dart';

class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _gymEmailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  AppUserRole _selectedRole = AppUserRole.trainee;
  bool _obscurePassword = true;
  bool _obscureConfirm = true;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _gymEmailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isSubmitting = authState.status == AuthStatus.checking;

    return Scaffold(
      body: AnimatedBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                IconButton(
                  padding: EdgeInsets.zero,
                  alignment: Alignment.centerLeft,
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.arrow_back_rounded, color: AppColors.mint),
                ),
                const SizedBox(height: 8),
                StaggeredReveal(
                  child: Text(
                    'Sign Up',
                    style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      color: AppColors.mint,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                StaggeredReveal(
                  delay: const Duration(milliseconds: 80),
                  child: Text(
                    'Create an account to track your fitness journey.',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppColors.mint.withValues(alpha: 0.82),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                StaggeredReveal(
                  delay: const Duration(milliseconds: 120),
                  child: _RoleToggle(
                    selectedRole: _selectedRole,
                    onChanged: (role) => setState(() => _selectedRole = role),
                  ),
                ),
                const SizedBox(height: 16),
                StaggeredReveal(
                  delay: const Duration(milliseconds: 140),
                  child: TextField(
                    controller: _nameController,
                    textCapitalization: TextCapitalization.words,
                    decoration: const InputDecoration(
                      labelText: 'Full Name',
                      prefixIcon: Icon(Icons.person_outline_rounded),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                StaggeredReveal(
                  delay: const Duration(milliseconds: 160),
                  child: TextField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    autocorrect: false,
                    decoration: const InputDecoration(
                      labelText: 'Your Email',
                      prefixIcon: Icon(Icons.alternate_email_rounded),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                StaggeredReveal(
                  delay: const Duration(milliseconds: 180),
                  child: TextField(
                    controller: _gymEmailController,
                    keyboardType: TextInputType.emailAddress,
                    autocorrect: false,
                    decoration: const InputDecoration(
                      labelText: 'Gym Email',
                      helperText: 'Email address of the gym you are joining',
                      prefixIcon: Icon(Icons.fitness_center_rounded),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                StaggeredReveal(
                  delay: const Duration(milliseconds: 220),
                  child: TextField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      labelText: 'Password',
                      prefixIcon: const Icon(Icons.lock_outline_rounded),
                      suffixIcon: IconButton(
                        onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                        icon: Icon(_obscurePassword ? Icons.visibility_rounded : Icons.visibility_off_rounded),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                StaggeredReveal(
                  delay: const Duration(milliseconds: 250),
                  child: TextField(
                    controller: _confirmPasswordController,
                    obscureText: _obscureConfirm,
                    decoration: InputDecoration(
                      labelText: 'Confirm Password',
                      prefixIcon: const Icon(Icons.lock_outline_rounded),
                      suffixIcon: IconButton(
                        onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                        icon: Icon(_obscureConfirm ? Icons.visibility_rounded : Icons.visibility_off_rounded),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                StaggeredReveal(
                  delay: const Duration(milliseconds: 280),
                  child: SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: isSubmitting ? null : _submit,
                      icon: isSubmitting
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.person_add_rounded),
                      label: Text(isSubmitting ? 'Signing up...' : 'Sign Up'),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                StaggeredReveal(
                  delay: const Duration(milliseconds: 320),
                  child: Center(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Already have an account?',
                          style: TextStyle(
                            color: AppColors.mint.withValues(alpha: 0.8),
                          ),
                        ),
                        TextButton(
                          onPressed: isSubmitting
                            ? null
                            : () => context.pop(),
                          child: const Text('Sign In'),
                        ),
                      ],
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
    final email = _emailController.text.trim();
    final gymEmail = _gymEmailController.text.trim();
    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (name.isEmpty || email.isEmpty || gymEmail.isEmpty || password.isEmpty || confirmPassword.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('All fields are required.')),
      );
      return;
    }

    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a valid email address.')),
      );
      return;
    }

    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(gymEmail)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a valid gym email address.')),
      );
      return;
    }

    if (password.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password must be at least 6 characters.')),
      );
      return;
    }

    if (password != confirmPassword) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Passwords do not match.')),
      );
      return;
    }

    final message = await ref.read(authProvider.notifier).signUp(
      name: name,
      email: email,
      password: password,
      role: _selectedRole,
      gymEmail: gymEmail,
    );

    if (message != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
    }
  }
}

class _RoleToggle extends StatelessWidget {
  const _RoleToggle({required this.selectedRole, required this.onChanged});

  final AppUserRole selectedRole;
  final ValueChanged<AppUserRole> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppColors.forest.withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Expanded(
            child: _item(context, AppUserRole.trainer, selectedRole == AppUserRole.trainer),
          ),
          const SizedBox(width: 6),
          Expanded(
            child: _item(context, AppUserRole.trainee, selectedRole == AppUserRole.trainee),
          ),
        ],
      ),
    );
  }

  Widget _item(BuildContext context, AppUserRole role, bool selected) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 260),
      curve: Curves.easeOutCubic,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: selected ? AppColors.mint : Colors.transparent,
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => onChanged(role),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Text(
            role.label,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: selected ? AppColors.deep : AppColors.mint,
            ),
          ),
        ),
      ),
    );
  }
}
