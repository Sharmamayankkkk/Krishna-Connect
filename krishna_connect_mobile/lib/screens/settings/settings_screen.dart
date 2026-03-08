import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/user_avatar.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final theme = context.watch<ThemeProvider>();
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          // Profile header
          if (user != null)
            Container(
              padding: const EdgeInsets.all(16),
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.cardDark,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.borderDark),
              ),
              child: Row(
                children: [
                  UserAvatar(imageUrl: user.avatarUrlOrDefault, size: 56, fallbackName: user.displayName),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(children: [
                          Text(user.displayName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                          if (user.isVerified) ...[const SizedBox(width: 6), VerificationBadge(verified: user.verified, size: 16)],
                        ]),
                        if (user.username != null)
                          Text('@${user.username}', style: const TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.edit_outlined, color: AppTheme.textSecondary),
                    onPressed: () => context.push('/edit-profile'),
                  ),
                ],
              ),
            ),

          // Account section
          _buildSection('Account', [
            _buildTile(Icons.person_outline, 'Edit Profile', () => context.push('/edit-profile')),
            _buildTile(Icons.lock_outline, 'Privacy', () {}),
            _buildTile(Icons.security_outlined, 'Security', () {}),
            _buildTile(Icons.verified_outlined, 'Get Verified', () {}),
          ]),

          // Preferences section
          _buildSection('Preferences', [
            SwitchListTile(
              secondary: const Icon(Icons.dark_mode_outlined, color: AppTheme.textSecondary),
              title: const Text('Dark Mode'),
              subtitle: const Text('Toggle dark/light theme', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
              value: theme.isDark,
              onChanged: (_) => theme.toggleTheme(),
              activeColor: AppTheme.primaryColor,
            ),
            _buildTile(Icons.notifications_outlined, 'Notifications', () {}),
            _buildTile(Icons.language, 'Language', () {}),
          ]),

          // Content section
          _buildSection('Content', [
            _buildTile(Icons.bookmark_outline, 'Bookmarks', () => context.push('/bookmarks')),
            _buildTile(Icons.event_outlined, 'Events', () => context.push('/events')),
            _buildTile(Icons.emoji_events_outlined, 'Challenges', () => context.push('/challenges')),
            _buildTile(Icons.star_outline, 'Starred Messages', () {}),
            _buildTile(Icons.block_outlined, 'Blocked Users', () {}),
          ]),

          // Support section
          _buildSection('Support', [
            _buildTile(Icons.help_outline, 'Help Center', () {}),
            _buildTile(Icons.info_outline, 'About Krishna Connect', () {
              showAboutDialog(
                context: context,
                applicationName: 'Krishna Connect',
                applicationVersion: '2.1.0',
                applicationLegalese: '© 2024 Krishna Connect',
                children: [
                  const Padding(
                    padding: EdgeInsets.only(top: 16),
                    child: Text('Where Devotees Unite - A social platform for the spiritual community.'),
                  ),
                ],
              );
            }),
            _buildTile(Icons.feedback_outlined, 'Send Feedback', () {}),
          ]),

          // Danger zone
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: OutlinedButton.icon(
              onPressed: () async {
                final confirmed = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Sign Out'),
                    content: const Text('Are you sure you want to sign out?'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                      TextButton(
                        onPressed: () => Navigator.pop(ctx, true),
                        child: const Text('Sign Out', style: TextStyle(color: AppTheme.errorColor)),
                      ),
                    ],
                  ),
                );
                if (confirmed == true && context.mounted) {
                  await auth.signOut();
                  if (context.mounted) context.go('/auth/login');
                }
              },
              icon: const Icon(Icons.logout, color: AppTheme.errorColor),
              label: const Text('Sign Out', style: TextStyle(color: AppTheme.errorColor)),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(double.infinity, 50),
                side: const BorderSide(color: AppTheme.errorColor),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
          child: Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textMuted, letterSpacing: 0.5)),
        ),
        ...children,
        const Divider(height: 1),
      ],
    );
  }

  Widget _buildTile(IconData icon, String title, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon, color: AppTheme.textSecondary),
      title: Text(title, style: const TextStyle(fontSize: 15)),
      trailing: const Icon(Icons.chevron_right, size: 20, color: AppTheme.textMuted),
      onTap: onTap,
    );
  }
}
