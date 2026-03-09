import 'package:flutter/material.dart';

class NotificationSettingsScreen extends StatefulWidget {
  const NotificationSettingsScreen({super.key});
  @override
  State<NotificationSettingsScreen> createState() => _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState extends State<NotificationSettingsScreen> {
  bool _likes = true;
  bool _comments = true;
  bool _follows = true;
  bool _mentions = true;
  bool _messages = true;
  bool _events = true;
  bool _challenges = true;
  bool _stories = true;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Notification Preferences')),
      body: ListView(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text(
              'Choose which notifications you want to receive',
              style: TextStyle(fontSize: 13, color: colorScheme.onSurface.withValues(alpha: 0.5)),
            ),
          ),
          _buildSection('Social', [
            _buildToggle(Icons.favorite_outline, 'Likes', 'When someone likes your post', _likes, (v) => setState(() => _likes = v), colorScheme),
            _buildToggle(Icons.chat_bubble_outline, 'Comments', 'When someone comments on your post', _comments, (v) => setState(() => _comments = v), colorScheme),
            _buildToggle(Icons.person_add_outlined, 'Follows', 'When someone follows you', _follows, (v) => setState(() => _follows = v), colorScheme),
            _buildToggle(Icons.alternate_email, 'Mentions', 'When someone mentions you', _mentions, (v) => setState(() => _mentions = v), colorScheme),
          ], colorScheme),
          _buildSection('Messaging', [
            _buildToggle(Icons.message_outlined, 'Messages', 'New direct messages', _messages, (v) => setState(() => _messages = v), colorScheme),
          ], colorScheme),
          _buildSection('Activities', [
            _buildToggle(Icons.event_outlined, 'Events', 'Event updates and RSVPs', _events, (v) => setState(() => _events = v), colorScheme),
            _buildToggle(Icons.emoji_events_outlined, 'Challenges', 'Challenge updates', _challenges, (v) => setState(() => _challenges = v), colorScheme),
            _buildToggle(Icons.auto_stories_outlined, 'Stories', 'Story reactions', _stories, (v) => setState(() => _stories = v), colorScheme),
          ], colorScheme),
          const SizedBox(height: 16),
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
                      'Push notifications require system permission. Check your device settings if notifications aren\'t appearing.',
                      style: TextStyle(fontSize: 12, color: colorScheme.onSurface.withValues(alpha: 0.6)),
                    ),
                  ),
                ],
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
      ],
    );
  }

  Widget _buildToggle(IconData icon, String title, String subtitle, bool value, ValueChanged<bool> onChanged, ColorScheme colorScheme) {
    return SwitchListTile(
      secondary: Icon(icon, color: colorScheme.onSurface.withValues(alpha: 0.7)),
      title: Text(title, style: const TextStyle(fontSize: 15)),
      subtitle: Text(subtitle, style: TextStyle(fontSize: 12, color: colorScheme.onSurface.withValues(alpha: 0.4))),
      value: value,
      onChanged: onChanged,
      activeColor: colorScheme.primary,
    );
  }
}
