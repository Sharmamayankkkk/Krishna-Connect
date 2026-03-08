import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
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
  String? _gender;
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Complete Profile')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Tell us about yourself', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
            const SizedBox(height: 6),
            Text('Complete your profile to get started', style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.4))),
            const SizedBox(height: 28),
            // Avatar placeholder
            Center(
              child: Stack(
                children: [
                  Container(
                    width: 100, height: 100,
                    decoration: BoxDecoration(shape: BoxShape.circle, color: colorScheme.surfaceContainerHighest, border: Border.all(color: colorScheme.outline.withValues(alpha: 0.3))),
                    child: Icon(Icons.person, size: 50, color: colorScheme.onSurface.withValues(alpha: 0.4)),
                  ),
                  Positioned(
                    bottom: 0, right: 0,
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(shape: BoxShape.circle, color: colorScheme.primary),
                      child: const Icon(Icons.camera_alt, size: 18, color: Colors.black),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),
            TextField(controller: _nameController, decoration: const InputDecoration(labelText: 'Full Name', prefixIcon: Icon(Icons.person_outline))),
            const SizedBox(height: 14),
            TextField(controller: _usernameController, decoration: const InputDecoration(labelText: 'Username', prefixIcon: Icon(Icons.alternate_email), hintText: 'Choose a unique username')),
            const SizedBox(height: 14),
            TextField(controller: _bioController, maxLines: 3, decoration: const InputDecoration(labelText: 'Bio', prefixIcon: Icon(Icons.edit_outlined), hintText: 'Tell the community about yourself')),
            const SizedBox(height: 14),
            DropdownButtonFormField<String>(
              value: _gender,
              decoration: const InputDecoration(labelText: 'Gender', prefixIcon: Icon(Icons.wc)),
              items: ['male', 'female'].map((g) => DropdownMenuItem(value: g, child: Text(g[0].toUpperCase() + g.substring(1)))).toList(),
              onChanged: (v) => setState(() => _gender = v),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity, height: 50,
              child: ElevatedButton(
                onPressed: _isLoading ? null : () async {
                  if (_usernameController.text.trim().isEmpty || _nameController.text.trim().isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Name and username are required')));
                    return;
                  }
                  setState(() => _isLoading = true);
                  await context.read<AuthProvider>().updateProfile({
                    'username': _usernameController.text.trim().toLowerCase(),
                    'name': _nameController.text.trim(),
                    'bio': _bioController.text.trim(),
                    if (_gender != null) 'gender': _gender,
                  });
                  setState(() => _isLoading = false);
                  if (mounted) context.go('/');
                },
                child: _isLoading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Complete Setup'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
