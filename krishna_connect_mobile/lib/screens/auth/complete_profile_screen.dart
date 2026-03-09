import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../config/assets.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';

class CompleteProfileScreen extends StatefulWidget {
  const CompleteProfileScreen({super.key});
  @override
  State<CompleteProfileScreen> createState() => _CompleteProfileScreenState();
}

class _CompleteProfileScreenState extends State<CompleteProfileScreen> {
  final _usernameController = TextEditingController();
  final _nameController = TextEditingController();
  final _bioController = TextEditingController();
  String _gender = 'male';
  bool _isLoading = false;

  @override
  void dispose() {
    _usernameController.dispose();
    _nameController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Background image
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
                        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Logo (centered)
                          Center(
                            child: Image.asset(
                              AppAssets.logo,
                              width: 70,
                              height: 70,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Center(
                            child: Text(
                              'Complete Profile',
                              style: TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w700,
                                color: colorScheme.onSurface,
                              ),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Center(
                            child: Text(
                              'Tell us about yourself to get started',
                              style: TextStyle(
                                color: colorScheme.onSurface.withValues(alpha: 0.5),
                                fontSize: 14,
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Avatar
                          Center(
                            child: Stack(
                              children: [
                                CircleAvatar(
                                  radius: 50,
                                  backgroundImage: AssetImage(
                                    _gender == 'male' ? AppAssets.avatarMale : AppAssets.avatarFemale,
                                  ),
                                ),
                                Positioned(
                                  bottom: 0,
                                  right: 0,
                                  child: Container(
                                    padding: const EdgeInsets.all(6),
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: colorScheme.primary,
                                    ),
                                    child: const Icon(Icons.camera_alt, size: 18, color: Colors.white),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Full Name
                          TextField(
                            controller: _nameController,
                            style: TextStyle(color: colorScheme.onSurface),
                            decoration: InputDecoration(
                              labelText: 'Full Name',
                              prefixIcon: const Icon(Icons.person_outline),
                              filled: true,
                              fillColor: colorScheme.surface.withValues(alpha: 0.5),
                            ),
                          ),
                          const SizedBox(height: 14),

                          // Username
                          TextField(
                            controller: _usernameController,
                            style: TextStyle(color: colorScheme.onSurface),
                            decoration: InputDecoration(
                              labelText: 'Username',
                              prefixIcon: const Icon(Icons.alternate_email),
                              hintText: 'Choose a unique username',
                              filled: true,
                              fillColor: colorScheme.surface.withValues(alpha: 0.5),
                            ),
                          ),
                          const SizedBox(height: 14),

                          // Bio
                          TextField(
                            controller: _bioController,
                            maxLines: 3,
                            style: TextStyle(color: colorScheme.onSurface),
                            decoration: InputDecoration(
                              labelText: 'Bio',
                              prefixIcon: const Icon(Icons.edit_outlined),
                              hintText: 'Tell the community about yourself',
                              filled: true,
                              fillColor: colorScheme.surface.withValues(alpha: 0.5),
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Gender (Prabhuji / Mataji matching webapp)
                          Text(
                            'Gender',
                            style: TextStyle(
                              color: colorScheme.onSurface.withValues(alpha: 0.7),
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              _buildGenderChip('Prabhuji (Male)', 'male', colorScheme),
                              const SizedBox(width: 12),
                              _buildGenderChip('Mataji (Female)', 'female', colorScheme),
                            ],
                          ),
                          const SizedBox(height: 28),

                          SizedBox(
                            width: double.infinity,
                            height: 48,
                            child: ElevatedButton(
                              onPressed: _isLoading ? null : () async {
                                if (_usernameController.text.trim().isEmpty || _nameController.text.trim().isEmpty) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Name and username are required')),
                                  );
                                  return;
                                }
                                setState(() => _isLoading = true);

                                final avatarUrl = AppAssets.serverAvatarForGender(_gender);

                                await context.read<AuthProvider>().updateProfile({
                                  'username': _usernameController.text.trim().toLowerCase(),
                                  'name': _nameController.text.trim(),
                                  'bio': _bioController.text.trim(),
                                  'gender': _gender,
                                  'avatar_url': avatarUrl,
                                });
                                setState(() => _isLoading = false);
                                if (mounted) context.go('/');
                              },
                              child: _isLoading
                                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                                  : const Text('Complete Setup', style: TextStyle(fontWeight: FontWeight.w600)),
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

  Widget _buildGenderChip(String label, String value, ColorScheme colorScheme) {
    final selected = _gender == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _gender = value),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: selected ? colorScheme.primary : Colors.white.withValues(alpha: 0.15),
              width: selected ? 2 : 1,
            ),
            color: selected ? colorScheme.primary.withValues(alpha: 0.1) : Colors.transparent,
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
      ),
    );
  }
}
