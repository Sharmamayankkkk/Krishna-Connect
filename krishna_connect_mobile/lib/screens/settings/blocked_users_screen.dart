import 'package:flutter/material.dart';

class BlockedUsersScreen extends StatefulWidget {
  const BlockedUsersScreen({super.key});
  @override
  State<BlockedUsersScreen> createState() => _BlockedUsersScreenState();
}

class _BlockedUsersScreenState extends State<BlockedUsersScreen> {
  // Currently blocked users would be loaded from the database
  // For now, we display the screen structure with empty state

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Blocked Users')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.block, size: 64, color: colorScheme.onSurface.withValues(alpha: 0.2)),
            const SizedBox(height: 16),
            Text('No blocked users', style: TextStyle(fontSize: 16, color: colorScheme.onSurface.withValues(alpha: 0.5))),
            const SizedBox(height: 8),
            Text(
              'Users you block will appear here',
              style: TextStyle(fontSize: 13, color: colorScheme.onSurface.withValues(alpha: 0.3)),
            ),
          ],
        ),
      ),
    );
  }
}
