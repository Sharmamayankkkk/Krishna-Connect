import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';

class PrivacyScreen extends StatefulWidget {
  const PrivacyScreen({super.key});
  @override
  State<PrivacyScreen> createState() => _PrivacyScreenState();
}

class _PrivacyScreenState extends State<PrivacyScreen> {
  bool _isPrivate = false;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().user;
    _isPrivate = user?.isPrivate ?? false;
  }

  Future<void> _updatePrivacy(bool value) async {
    setState(() { _isPrivate = value; _isSaving = true; });
    try {
      await context.read<AuthProvider>().updateProfile({'is_private': value});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(value ? 'Account is now private' : 'Account is now public'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      setState(() => _isPrivate = !value);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
      }
    }
    setState(() => _isSaving = false);
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Privacy')),
      body: ListView(
        children: [
          // Privacy toggle
          SwitchListTile(
            secondary: Icon(Icons.lock_outline, color: colorScheme.onSurface.withValues(alpha: 0.7)),
            title: const Text('Private Account'),
            subtitle: Text(
              'When your account is private, only people you approve can see your posts',
              style: TextStyle(fontSize: 12, color: colorScheme.onSurface.withValues(alpha: 0.5)),
            ),
            value: _isPrivate,
            onChanged: _isSaving ? null : _updatePrivacy,
            activeColor: colorScheme.primary,
          ),
          const Divider(),

          // Info section
          _buildInfoTile(Icons.visibility_outlined, 'Who can see your posts',
              _isPrivate ? 'Only approved followers' : 'Everyone', colorScheme),
          _buildInfoTile(Icons.person_add_outlined, 'Follow requests',
              _isPrivate ? 'People must request to follow you' : 'Anyone can follow you', colorScheme),
          _buildInfoTile(Icons.message_outlined, 'Direct messages',
              'Anyone who follows you can message you', colorScheme),

          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: colorScheme.primary.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline, color: colorScheme.primary, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Your profile info (name, bio, avatar) is always visible to everyone.',
                      style: TextStyle(fontSize: 12, color: colorScheme.onSurface.withValues(alpha: 0.6)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoTile(IconData icon, String title, String subtitle, ColorScheme colorScheme) {
    return ListTile(
      leading: Icon(icon, color: colorScheme.onSurface.withValues(alpha: 0.5)),
      title: Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
      subtitle: Text(subtitle, style: TextStyle(fontSize: 12, color: colorScheme.onSurface.withValues(alpha: 0.5))),
    );
  }
}
