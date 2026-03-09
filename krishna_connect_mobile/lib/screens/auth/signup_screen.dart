import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../config/assets.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});
  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _nameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscure = true;
  bool _isLoading = false;
  String _gender = 'male';
  String? _localError;

  @override
  void dispose() {
    _nameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<bool> _validateUsername() async {
    final username = _usernameController.text.trim();
    final usernameRegex = RegExp(r'^[a-zA-Z0-9_]+$');
    if (!usernameRegex.hasMatch(username)) {
      setState(() => _localError = 'Username can only contain letters, numbers, and underscores.');
      return false;
    }

    try {
      final data = await Supabase.instance.client
          .from('profiles')
          .select('username')
          .eq('username', username)
          .maybeSingle();
      if (data != null) {
        setState(() => _localError = 'This username is already taken. Please choose another one.');
        return false;
      }
    } catch (_) {
      // Ignore validation errors and let server handle
    }
    return true;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final auth = context.watch<AuthProvider>();

    final displayError = _localError ?? auth.error;

    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Background image (matching webapp's c2.png)
          Image.asset(
            AppAssets.bgC2,
            fit: BoxFit.cover,
          ),
          // Gradient overlay
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  colorScheme.surface.withValues(alpha: 0.3),
                  colorScheme.surface.withValues(alpha: 0.5),
                  colorScheme.surface.withValues(alpha: 0.7),
                ],
              ),
            ),
          ),
          // Content
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                    child: Container(
                      constraints: const BoxConstraints(maxWidth: 400),
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.1),
                        ),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // Logo
                          Image.asset(
                            AppAssets.logo,
                            width: 80,
                            height: 80,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Create Account',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w700,
                              color: colorScheme.onSurface,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Enter your details to join Krishna Connect',
                            style: TextStyle(
                              color: colorScheme.onSurface.withValues(alpha: 0.5),
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Error message
                          if (displayError != null)
                            Container(
                              padding: const EdgeInsets.all(12),
                              margin: const EdgeInsets.only(bottom: 16),
                              decoration: BoxDecoration(
                                color: AppTheme.errorColor.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: AppTheme.errorColor.withValues(alpha: 0.3)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.error_outline, color: AppTheme.errorColor, size: 18),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      displayError,
                                      style: const TextStyle(color: AppTheme.errorColor, fontSize: 13),
                                    ),
                                  ),
                                ],
                              ),
                            ),

                          // Full Name
                          TextField(
                            controller: _nameController,
                            style: TextStyle(color: colorScheme.onSurface),
                            decoration: InputDecoration(
                              labelText: 'Full Name',
                              filled: true,
                              fillColor: colorScheme.surface.withValues(alpha: 0.5),
                            ),
                          ),
                          const SizedBox(height: 12),

                          // Username
                          TextField(
                            controller: _usernameController,
                            style: TextStyle(color: colorScheme.onSurface),
                            decoration: InputDecoration(
                              labelText: 'Username',
                              filled: true,
                              fillColor: colorScheme.surface.withValues(alpha: 0.5),
                            ),
                          ),
                          const SizedBox(height: 12),

                          // Email
                          TextField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            style: TextStyle(color: colorScheme.onSurface),
                            decoration: InputDecoration(
                              labelText: 'Email',
                              filled: true,
                              fillColor: colorScheme.surface.withValues(alpha: 0.5),
                            ),
                          ),
                          const SizedBox(height: 12),

                          // Password
                          TextField(
                            controller: _passwordController,
                            obscureText: _obscure,
                            style: TextStyle(color: colorScheme.onSurface),
                            decoration: InputDecoration(
                              labelText: 'Password',
                              filled: true,
                              fillColor: colorScheme.surface.withValues(alpha: 0.5),
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                  size: 20,
                                ),
                                onPressed: () => setState(() => _obscure = !_obscure),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Gender selection (matching webapp: Prabhuji/Mataji)
                          Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              'Gender',
                              style: TextStyle(
                                color: colorScheme.onSurface.withValues(alpha: 0.7),
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: _GenderOption(
                                  label: 'Prabhuji (Male)',
                                  value: 'male',
                                  groupValue: _gender,
                                  onChanged: (v) => setState(() => _gender = v),
                                  colorScheme: colorScheme,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _GenderOption(
                                  label: 'Mataji (Female)',
                                  value: 'female',
                                  groupValue: _gender,
                                  onChanged: (v) => setState(() => _gender = v),
                                  colorScheme: colorScheme,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),

                          // Create Account button
                          SizedBox(
                            width: double.infinity,
                            height: 48,
                            child: ElevatedButton(
                              onPressed: _isLoading ? null : () async {
                                setState(() { _localError = null; _isLoading = true; });
                                auth.clearError();

                                final name = _nameController.text.trim();
                                final username = _usernameController.text.trim();
                                final email = _emailController.text.trim();
                                final password = _passwordController.text;

                                if (name.isEmpty || username.isEmpty || email.isEmpty || password.isEmpty) {
                                  setState(() { _localError = 'All fields are required.'; _isLoading = false; });
                                  return;
                                }

                                if (password.length < 6) {
                                  setState(() { _localError = 'Password must be at least 6 characters long.'; _isLoading = false; });
                                  return;
                                }

                                final usernameValid = await _validateUsername();
                                if (!usernameValid) {
                                  setState(() => _isLoading = false);
                                  return;
                                }

                                final avatarUrl = _gender == 'male'
                                    ? '/user_Avatar/male.png'
                                    : '/user_Avatar/female.png';

                                final success = await auth.signUp(
                                  email,
                                  password,
                                  name: name,
                                  username: username,
                                  gender: _gender,
                                  avatarUrl: avatarUrl,
                                );
                                setState(() => _isLoading = false);
                                if (success && mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Check your email! We\'ve sent you a confirmation link.')),
                                  );
                                  context.go('/auth/login');
                                }
                              },
                              child: _isLoading
                                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                                  : const Text('Create Account', style: TextStyle(fontWeight: FontWeight.w600)),
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Or sign up with divider
                          Row(
                            children: [
                              Expanded(child: Divider(color: Colors.white.withValues(alpha: 0.15))),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 16),
                                child: Text(
                                  'Or sign up with',
                                  style: TextStyle(
                                    color: colorScheme.onSurface.withValues(alpha: 0.5),
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                              Expanded(child: Divider(color: Colors.white.withValues(alpha: 0.15))),
                            ],
                          ),
                          const SizedBox(height: 16),

                          // Google
                          OutlinedButton.icon(
                            onPressed: _isLoading ? null : () async {
                              await context.read<AuthProvider>().signInWithGoogle();
                            },
                            icon: const Icon(Icons.g_mobiledata, size: 24),
                            label: const Text('Google'),
                            style: OutlinedButton.styleFrom(
                              minimumSize: const Size(double.infinity, 48),
                              side: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              backgroundColor: colorScheme.surface.withValues(alpha: 0.3),
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Login link
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'Already have an account? ',
                                style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.5)),
                              ),
                              GestureDetector(
                                onTap: () => context.go('/auth/login'),
                                child: Text(
                                  'Login',
                                  style: TextStyle(color: colorScheme.primary, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),

                          // Terms footer (matching webapp)
                          Text(
                            'By creating an account, you agree to our Terms, Privacy Policy, and Acceptable Use Policy.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: colorScheme.onSurface.withValues(alpha: 0.4),
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _GenderOption extends StatelessWidget {
  const _GenderOption({
    required this.label,
    required this.value,
    required this.groupValue,
    required this.onChanged,
    required this.colorScheme,
  });

  final String label;
  final String value;
  final String groupValue;
  final ValueChanged<String> onChanged;
  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    final selected = value == groupValue;
    return GestureDetector(
      onTap: () => onChanged(value),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: selected ? colorScheme.primary : Colors.white.withValues(alpha: 0.15),
            width: selected ? 2 : 1,
          ),
          color: selected
              ? colorScheme.primary.withValues(alpha: 0.1)
              : Colors.transparent,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              selected ? Icons.radio_button_checked : Icons.radio_button_off,
              size: 18,
              color: selected ? colorScheme.primary : colorScheme.onSurface.withValues(alpha: 0.5),
            ),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                label,
                style: TextStyle(
                  color: selected ? colorScheme.primary : colorScheme.onSurface.withValues(alpha: 0.7),
                  fontSize: 13,
                  fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
