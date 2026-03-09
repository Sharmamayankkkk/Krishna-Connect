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
    final themeData = Theme.of(context);
    final colorScheme = themeData.colorScheme;
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
                color: colorScheme.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: colorScheme.outline.withValues(alpha: 0.3)),
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
                          Text('@${user.username}', style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.4), fontSize: 13)),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.edit_outlined, color: colorScheme.onSurface.withValues(alpha: 0.7)),
                    onPressed: () => context.push('/edit-profile'),
                  ),
                ],
              ),
            ),

          // Account section
          _buildSection('Account', [
            _buildTile(Icons.person_outline, 'Edit Profile', () => context.push('/edit-profile'), colorScheme),
            _buildTile(Icons.lock_outline, 'Privacy', () => context.push('/settings/privacy'), colorScheme),
            _buildTile(Icons.analytics_outlined, 'Analytics', () => context.push('/analytics'), colorScheme),
            _buildTile(Icons.verified_outlined, 'Get Verified', () => context.push('/get-verified'), colorScheme),
          ], colorScheme),

          // Preferences section
          _buildSection('Preferences', [
            SwitchListTile(
              secondary: Icon(Icons.dark_mode_outlined, color: colorScheme.onSurface.withValues(alpha: 0.7)),
              title: const Text('Dark Mode'),
              subtitle: Text('Toggle dark/light theme', style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.4), fontSize: 12)),
              value: theme.isDark,
              onChanged: (_) => theme.toggleTheme(),
              activeColor: colorScheme.primary,
            ),
            _buildTile(Icons.notifications_outlined, 'Notifications', () => context.push('/settings/notifications'), colorScheme),
          ], colorScheme),

          // Content section
          _buildSection('Content', [
            _buildTile(Icons.bookmark_outline, 'Bookmarks', () => context.push('/bookmarks'), colorScheme),
            _buildTile(Icons.group_outlined, 'Groups', () => context.push('/groups'), colorScheme),
            _buildTile(Icons.event_outlined, 'Events', () => context.push('/events'), colorScheme),
            _buildTile(Icons.emoji_events_outlined, 'Challenges', () => context.push('/challenges'), colorScheme),
            _buildTile(Icons.block_outlined, 'Blocked Users', () => context.push('/settings/blocked-users'), colorScheme),
          ], colorScheme),

          // Support section
          _buildSection('Support', [
            _buildTile(Icons.help_outline, 'Help Center', () {
              showDialog(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Help Center'),
                  content: const Text(
                    'Need help? Contact us:\n\n'
                    '• Email: support@krishnaconnect.app\n'
                    '• Visit our FAQ at krishnaconnect.app/help\n\n'
                    'We typically respond within 24 hours.',
                  ),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
                  ],
                ),
              );
            }, colorScheme),
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
            }, colorScheme),
            _buildTile(Icons.feedback_outlined, 'Send Feedback', () {
              final feedbackController = TextEditingController();
              showDialog(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Send Feedback'),
                  content: TextField(
                    controller: feedbackController,
                    decoration: InputDecoration(
                      hintText: 'Tell us what you think...',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    maxLines: 4,
                  ),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                    FilledButton(
                      onPressed: () {
                        Navigator.pop(ctx);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Thank you for your feedback!'), backgroundColor: Colors.green),
                        );
                      },
                      child: const Text('Send'),
                    ),
                  ],
                ),
              );
            }, colorScheme),
          ], colorScheme),

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

  Widget _buildSection(String title, List<Widget> children, ColorScheme colorScheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
          child: Text(title, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: colorScheme.onSurface.withValues(alpha: 0.4), letterSpacing: 0.5)),
        ),
        ...children,
        const Divider(height: 1),
      ],
    );
  }

  Widget _buildTile(IconData icon, String title, VoidCallback onTap, ColorScheme colorScheme) {
    return ListTile(
      leading: Icon(icon, color: colorScheme.onSurface.withValues(alpha: 0.7)),
      title: Text(title, style: const TextStyle(fontSize: 15)),
      trailing: Icon(Icons.chevron_right, size: 20, color: colorScheme.onSurface.withValues(alpha: 0.4)),
      onTap: onTap,
    );
  }
}
