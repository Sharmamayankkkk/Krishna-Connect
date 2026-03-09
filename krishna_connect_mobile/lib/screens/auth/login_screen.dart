import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../config/assets.dart';
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
  int _timeLeft = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  void _startOtpTimer() {
    _timeLeft = 120;
    _tick();
  }

  void _tick() {
    if (_timeLeft > 0 && mounted) {
      Future.delayed(const Duration(seconds: 1), () {
        if (mounted) {
          setState(() => _timeLeft--);
          _tick();
        }
      });
    }
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
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final authProvider = context.watch<AuthProvider>();

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
                padding: const EdgeInsets.symmetric(horizontal: 20),
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
                          // Logo (actual asset matching webapp)
                          Image.asset(
                            AppAssets.logo,
                            width: 100,
                            height: 100,
                          ),
                          const SizedBox(height: 24),

                          // Tab bar
                          Container(
                            decoration: BoxDecoration(
                              color: colorScheme.surface.withValues(alpha: 0.5),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: TabBar(
                              controller: _tabController,
                              indicator: BoxDecoration(
                                color: colorScheme.primary.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              indicatorSize: TabBarIndicatorSize.tab,
                              dividerHeight: 0,
                              labelColor: colorScheme.primary,
                              unselectedLabelColor: colorScheme.onSurface.withValues(alpha: 0.5),
                              tabs: const [
                                Tab(text: 'Email'),
                                Tab(text: 'Phone'),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),

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
                                _buildEmailForm(authProvider, colorScheme),
                                _buildPhoneForm(authProvider, colorScheme),
                              ],
                            ),
                          ),

                          // Divider
                          Row(
                            children: [
                              Expanded(child: Divider(color: Colors.white.withValues(alpha: 0.15))),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 16),
                                child: Text(
                                  'Or continue with',
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

                          // Google Sign In
                          OutlinedButton.icon(
                            onPressed: () async {
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
                          const SizedBox(height: 20),

                          // Sign up link
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                "Don't have an account? ",
                                style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.5)),
                              ),
                              GestureDetector(
                                onTap: () => context.push('/auth/signup'),
                                child: Text(
                                  'Sign up',
                                  style: TextStyle(color: colorScheme.primary, fontWeight: FontWeight.w600),
                                ),
                              ),
                            ],
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

  Widget _buildEmailForm(AuthProvider authProvider, ColorScheme colorScheme) {
    return Column(
      children: [
        TextField(
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          style: TextStyle(color: colorScheme.onSurface),
          decoration: InputDecoration(
            labelText: 'Email',
            prefixIcon: const Icon(Icons.email_outlined, size: 20),
            filled: true,
            fillColor: colorScheme.surface.withValues(alpha: 0.5),
          ),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _passwordController,
          obscureText: _obscurePassword,
          style: TextStyle(color: colorScheme.onSurface),
          decoration: InputDecoration(
            labelText: 'Password',
            prefixIcon: const Icon(Icons.lock_outline, size: 20),
            filled: true,
            fillColor: colorScheme.surface.withValues(alpha: 0.5),
            suffixIcon: IconButton(
              icon: Icon(_obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 20),
              onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            onPressed: () => context.push('/auth/forgot-password'),
            child: Text(
              'Forgot password?',
              style: TextStyle(fontSize: 13, color: colorScheme.onSurface.withValues(alpha: 0.7)),
            ),
          ),
        ),
        const SizedBox(height: 4),
        SizedBox(
          width: double.infinity,
          height: 48,
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
                : const Text('Sign In', style: TextStyle(fontWeight: FontWeight.w600)),
          ),
        ),
      ],
    );
  }

  Widget _buildPhoneForm(AuthProvider authProvider, ColorScheme colorScheme) {
    if (!_isOtpSent) {
      return Column(
        children: [
          TextField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            style: TextStyle(color: colorScheme.onSurface),
            decoration: InputDecoration(
              labelText: 'Phone Number',
              hintText: 'e.g. +919876543210',
              prefixIcon: const Icon(Icons.phone_outlined, size: 20),
              filled: true,
              fillColor: colorScheme.surface.withValues(alpha: 0.5),
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: _isLoading ? null : () async {
                setState(() => _isLoading = true);
                await authProvider.sendOtp(_phoneController.text.trim());
                setState(() {
                  _isLoading = false;
                  _isOtpSent = true;
                });
                _startOtpTimer();
              },
              child: _isLoading
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Get OTP', style: TextStyle(fontWeight: FontWeight.w600)),
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
          style: TextStyle(color: colorScheme.onSurface),
          decoration: InputDecoration(
            labelText: 'One-Time Password',
            hintText: 'Enter 6-digit OTP',
            prefixIcon: const Icon(Icons.pin, size: 20),
            filled: true,
            fillColor: colorScheme.surface.withValues(alpha: 0.5),
          ),
        ),
        const SizedBox(height: 14),
        SizedBox(
          width: double.infinity,
          height: 48,
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
                : const Text('Verify OTP & Login', style: TextStyle(fontWeight: FontWeight.w600)),
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            TextButton(
              onPressed: () => setState(() { _isOtpSent = false; _otpController.clear(); _timeLeft = 0; }),
              child: Text('Change Phone Number', style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.5), fontSize: 13)),
            ),
            if (_timeLeft > 0)
              Text(
                'Resend in ${_timeLeft ~/ 60}:${(_timeLeft % 60).toString().padLeft(2, '0')}',
                style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.5), fontSize: 13),
              )
            else
              TextButton(
                onPressed: _isLoading ? null : () async {
                  setState(() => _isLoading = true);
                  await authProvider.sendOtp(_phoneController.text.trim());
                  setState(() => _isLoading = false);
                  _startOtpTimer();
                },
                child: Text('Resend OTP', style: TextStyle(color: colorScheme.primary, fontWeight: FontWeight.w500, fontSize: 13)),
              ),
          ],
        ),
      ],
    );
  }
}
