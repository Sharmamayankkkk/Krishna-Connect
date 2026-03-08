import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  bool _obscurePassword = true;
  bool _isOtpSent = false;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF1A1520), AppTheme.surfaceDark],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 28),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo
                  Container(
                    width: 90,
                    height: 90,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        colors: [AppTheme.primaryColor.withValues(alpha: 0.2), AppTheme.accentColor.withValues(alpha: 0.1)],
                      ),
                    ),
                    child: const Icon(Icons.self_improvement, size: 48, color: AppTheme.primaryColor),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Krishna Connect',
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: AppTheme.primaryColor),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Where Devotees Unite',
                    style: TextStyle(fontSize: 14, color: AppTheme.textMuted, fontStyle: FontStyle.italic),
                  ),
                  const SizedBox(height: 36),

                  // Tab bar
                  Container(
                    decoration: BoxDecoration(
                      color: AppTheme.cardDark,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: TabBar(
                      controller: _tabController,
                      indicator: BoxDecoration(
                        color: AppTheme.primaryColor.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      indicatorSize: TabBarIndicatorSize.tab,
                      dividerHeight: 0,
                      labelColor: AppTheme.primaryColor,
                      unselectedLabelColor: AppTheme.textMuted,
                      tabs: const [
                        Tab(text: 'Email'),
                        Tab(text: 'Phone'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Error message
                  if (authProvider.error != null)
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
                              authProvider.error!,
                              style: const TextStyle(color: AppTheme.errorColor, fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                    ),

                  // Tab views
                  SizedBox(
                    height: 260,
                    child: TabBarView(
                      controller: _tabController,
                      children: [
                        _buildEmailForm(authProvider),
                        _buildPhoneForm(authProvider),
                      ],
                    ),
                  ),

                  // Divider
                  Row(
                    children: [
                      Expanded(child: Divider(color: AppTheme.borderDark)),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 16),
                        child: Text('or continue with', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                      ),
                      Expanded(child: Divider(color: AppTheme.borderDark)),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Google Sign In
                  OutlinedButton.icon(
                    onPressed: () async {
                      final auth = context.read<AuthProvider>();
                      // Google sign in handled by Supabase
                    },
                    icon: const Icon(Icons.g_mobiledata, size: 24),
                    label: const Text('Google'),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(double.infinity, 50),
                      side: const BorderSide(color: AppTheme.borderDark),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Sign up link
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text("Don't have an account? ", style: TextStyle(color: AppTheme.textMuted)),
                      GestureDetector(
                        onTap: () => context.push('/auth/signup'),
                        child: const Text(
                          'Sign up',
                          style: TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmailForm(AuthProvider authProvider) {
    return Column(
      children: [
        TextField(
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(
            labelText: 'Email',
            prefixIcon: Icon(Icons.email_outlined, size: 20),
          ),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _passwordController,
          obscureText: _obscurePassword,
          decoration: InputDecoration(
            labelText: 'Password',
            prefixIcon: const Icon(Icons.lock_outline, size: 20),
            suffixIcon: IconButton(
              icon: Icon(_obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 20),
              onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            onPressed: () => context.push('/auth/forgot-password'),
            child: const Text('Forgot password?', style: TextStyle(fontSize: 13)),
          ),
        ),
        const SizedBox(height: 6),
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            onPressed: _isLoading ? null : () async {
              setState(() => _isLoading = true);
              authProvider.clearError();
              final success = await authProvider.signIn(
                _emailController.text.trim(),
                _passwordController.text,
              );
              setState(() => _isLoading = false);
              if (success && mounted) {
                context.go('/');
              }
            },
            child: _isLoading
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Sign In'),
          ),
        ),
      ],
    );
  }

  Widget _buildPhoneForm(AuthProvider authProvider) {
    if (!_isOtpSent) {
      return Column(
        children: [
          TextField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(
              labelText: 'Phone Number',
              hintText: '+919876543210',
              prefixIcon: Icon(Icons.phone_outlined, size: 20),
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: _isLoading ? null : () async {
                setState(() => _isLoading = true);
                await authProvider.sendOtp(_phoneController.text.trim());
                setState(() {
                  _isLoading = false;
                  _isOtpSent = true;
                });
              },
              child: _isLoading
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Get OTP'),
            ),
          ),
        ],
      );
    }

    return Column(
      children: [
        TextField(
          controller: _otpController,
          keyboardType: TextInputType.number,
          maxLength: 6,
          decoration: const InputDecoration(
            labelText: 'Enter OTP',
            prefixIcon: Icon(Icons.pin, size: 20),
          ),
        ),
        const SizedBox(height: 14),
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            onPressed: _isLoading ? null : () async {
              setState(() => _isLoading = true);
              final success = await authProvider.verifyOtp(
                _phoneController.text.trim(),
                _otpController.text.trim(),
              );
              setState(() => _isLoading = false);
              if (success && mounted) context.go('/');
            },
            child: _isLoading
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Verify & Login'),
          ),
        ),
        TextButton(
          onPressed: () => setState(() { _isOtpSent = false; _otpController.clear(); }),
          child: const Text('Change phone number'),
        ),
      ],
    );
  }
}
