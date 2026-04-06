import 'package:flutter/material.dart';
import '../../core/models/app_user_role.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/animated_background.dart';
import '../../core/widgets/staggered_reveal.dart';
import '../common/loading_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.initialRole});

  final AppUserRole initialRole;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  late AppUserRole _selectedRole;
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void initState() {
    super.initState();
    _selectedRole = widget.initialRole;
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      body: AnimatedBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.arrow_back_rounded),
                ),
                const SizedBox(height: 8),
                StaggeredReveal(
                  child: Text(
                    'Welcome Back',
                    style: textTheme.headlineMedium?.copyWith(
                      color: AppColors.mint,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                StaggeredReveal(
                  delay: const Duration(milliseconds: 80),
                  child: Text(
                    'Sign in as ${_selectedRole.label.toLowerCase()} and continue your momentum.',
                    style: textTheme.bodyLarge?.copyWith(
                      color: AppColors.mint.withValues(alpha: 0.8),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                StaggeredReveal(
                  delay: const Duration(milliseconds: 160),
                  child: _RoleToggle(
                    selectedRole: _selectedRole,
                    onRoleChanged: (role) =>
                        setState(() => _selectedRole = role),
                  ),
                ),
                const SizedBox(height: 18),
                StaggeredReveal(
                  delay: const Duration(milliseconds: 220),
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
                  delay: const Duration(milliseconds: 280),
                  child: TextField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      labelText: 'Password',
                      prefixIcon: const Icon(Icons.lock_outline_rounded),
                      suffixIcon: IconButton(
                        onPressed: () => setState(
                          () => _obscurePassword = !_obscurePassword,
                        ),
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility_rounded
                              : Icons.visibility_off_rounded,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                StaggeredReveal(
                  delay: const Duration(milliseconds: 340),
                  child: SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: _submit,
                      child: const Text('Sign In'),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                StaggeredReveal(
                  delay: const Duration(milliseconds: 420),
                  child: Center(
                    child: TextButton(
                      onPressed: () {},
                      child: const Text('Forgot password?'),
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

  void _submit() {
    if (_emailController.text.trim().isEmpty ||
        _passwordController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter email and password.')),
      );
      return;
    }

    Navigator.of(context).pushReplacement(
      PageRouteBuilder<void>(
        pageBuilder: (context, animation, secondaryAnimation) =>
            LoadingScreen(role: _selectedRole),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          final curve = CurvedAnimation(
            parent: animation,
            curve: Curves.easeOut,
          );
          return FadeTransition(opacity: curve, child: child);
        },
        transitionDuration: const Duration(milliseconds: 420),
      ),
    );
  }
}

class _RoleToggle extends StatelessWidget {
  const _RoleToggle({required this.selectedRole, required this.onRoleChanged});

  final AppUserRole selectedRole;
  final ValueChanged<AppUserRole> onRoleChanged;

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
            child: _roleButton(
              context,
              role: AppUserRole.trainer,
              selected: selectedRole == AppUserRole.trainer,
            ),
          ),
          const SizedBox(width: 6),
          Expanded(
            child: _roleButton(
              context,
              role: AppUserRole.trainee,
              selected: selectedRole == AppUserRole.trainee,
            ),
          ),
        ],
      ),
    );
  }

  Widget _roleButton(
    BuildContext context, {
    required AppUserRole role,
    required bool selected,
  }) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 260),
      curve: Curves.easeOutCubic,
      decoration: BoxDecoration(
        color: selected ? AppColors.mint : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => onRoleChanged(role),
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
