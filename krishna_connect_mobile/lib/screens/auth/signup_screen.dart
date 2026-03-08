import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});
  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscure = true;
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0xFF1A1520), AppTheme.surfaceDark]),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 28),
              child: Column(
                children: [
                  Container(
                    width: 80, height: 80,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(colors: [AppTheme.primaryColor.withValues(alpha: 0.2), AppTheme.accentColor.withValues(alpha: 0.1)]),
                    ),
                    child: const Icon(Icons.person_add_outlined, size: 40, color: AppTheme.primaryColor),
                  ),
                  const SizedBox(height: 20),
                  const Text('Create Account', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 6),
                  const Text('Join the Krishna Connect community', style: TextStyle(color: AppTheme.textMuted, fontSize: 14)),
                  const SizedBox(height: 32),
                  if (auth.error != null)
                    Container(
                      padding: const EdgeInsets.all(12), margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(color: AppTheme.errorColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                      child: Row(children: [
                        const Icon(Icons.error_outline, color: AppTheme.errorColor, size: 18),
                        const SizedBox(width: 8),
                        Expanded(child: Text(auth.error!, style: const TextStyle(color: AppTheme.errorColor, fontSize: 13))),
                      ]),
                    ),
                  TextField(controller: _emailController, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined, size: 20))),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _passwordController, obscureText: _obscure,
                    decoration: InputDecoration(labelText: 'Password', prefixIcon: const Icon(Icons.lock_outline, size: 20),
                      suffixIcon: IconButton(icon: Icon(_obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 20), onPressed: () => setState(() => _obscure = !_obscure))),
                  ),
                  const SizedBox(height: 14),
                  TextField(controller: _confirmPasswordController, obscureText: true, decoration: const InputDecoration(labelText: 'Confirm Password', prefixIcon: Icon(Icons.lock_outline, size: 20))),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity, height: 50,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : () async {
                        if (_passwordController.text != _confirmPasswordController.text) {
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Passwords do not match')));
                          return;
                        }
                        setState(() => _isLoading = true);
                        auth.clearError();
                        final success = await auth.signUp(_emailController.text.trim(), _passwordController.text);
                        setState(() => _isLoading = false);
                        if (success && mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Account created! Please check your email to verify.')));
                          context.go('/auth/login');
                        }
                      },
                      child: _isLoading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Create Account'),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    const Text('Already have an account? ', style: TextStyle(color: AppTheme.textMuted)),
                    GestureDetector(onTap: () => context.go('/auth/login'), child: const Text('Sign in', style: TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.w600))),
                  ]),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
