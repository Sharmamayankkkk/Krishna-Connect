import 'package:flutter/material.dart';

class NewsScreen extends StatelessWidget {
  const NewsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Icon(Icons.newspaper, size: 20, color: colorScheme.primary),
            const SizedBox(width: 8),
            Text(
              'News',
              style: TextStyle(
                color: colorScheme.onSurface,
                fontWeight: FontWeight.w700,
                fontSize: 20,
              ),
            ),
          ],
        ),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.newspaper_outlined,
              size: 64,
              color: colorScheme.onSurface.withValues(alpha: 0.3),
            ),
            const SizedBox(height: 16),
            Text(
              'News Coming Soon',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: colorScheme.onSurface.withValues(alpha: 0.7),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Stay tuned for the latest updates',
              style: TextStyle(
                color: colorScheme.onSurface.withValues(alpha: 0.4),
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
