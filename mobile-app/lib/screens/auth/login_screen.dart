import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/src/core/models/app_user_role.dart';
import 'package:mobile_app/src/core/theme/app_colors.dart';
import 'package:mobile_app/src/core/widgets/animated_background.dart';
import 'package:mobile_app/src/core/widgets/staggered_reveal.dart';
import '../../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  AppUserRole _selectedRole = AppUserRole.trainee;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
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
                const SizedBox(height: 8),
                StaggeredReveal(
                  child: Text(
                    'Sign In',
                    style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      color: AppColors.mint,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                StaggeredReveal(
                  delay: const Duration(milliseconds: 80),
                  child: Text(
                    'Role-aware login with automatic routing to Trainer or Trainee app.',
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
                  delay: const Duration(milliseconds: 160),
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
                          : const Icon(Icons.login_rounded),
                      label: Text(isSubmitting ? 'Signing in...' : 'Sign In'),
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

    final message = await ref.read(authProvider.notifier).signIn(
      email: email,
      password: password,
      role: _selectedRole,
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
