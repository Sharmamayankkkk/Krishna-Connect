import 'package:flutter/material.dart';
import '../models/models.dart';
import 'user_avatar.dart';

class StoryCircle extends StatelessWidget {
  final StoryModel story;
  final bool isMine;
  final bool isViewed;
  final VoidCallback? onTap;

  const StoryCircle({
    super.key,
    required this.story,
    this.isMine = false,
    this.isViewed = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 72,
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(2.5),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: isViewed
                    ? null
                    : LinearGradient(
                        colors: [colorScheme.primary, colorScheme.primary.withValues(alpha: 0.6)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                border: isViewed
                    ? Border.all(color: colorScheme.outline.withValues(alpha: 0.3), width: 2)
                    : null,
              ),
              child: Container(
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: theme.scaffoldBackgroundColor,
                ),
                child: Stack(
                  children: [
                    UserAvatar(
                      imageUrl: story.user?.avatarUrlOrDefault,
                      size: 52,
                      fallbackName: story.user?.displayName,
                    ),
                    if (isMine)
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          width: 20,
                          height: 20,
                          decoration: BoxDecoration(
                            color: colorScheme.primary,
                            shape: BoxShape.circle,
                            border: Border.all(color: theme.scaffoldBackgroundColor, width: 2),
                          ),
                          child: Icon(Icons.add, size: 12, color: colorScheme.onPrimary),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              isMine ? 'Your Story' : (story.user?.displayName ?? ''),
              style: TextStyle(fontSize: 11, color: colorScheme.onSurface.withValues(alpha: 0.6)),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class StoriesBar extends StatelessWidget {
  final List<StoryModel> stories;
  final String currentUserId;
  final VoidCallback? onCreateStory;
  final Function(StoryModel)? onViewStory;

  const StoriesBar({
    super.key,
    required this.stories,
    required this.currentUserId,
    this.onCreateStory,
    this.onViewStory,
  });

  @override
  Widget build(BuildContext context) {
    // Group stories by user
    final Map<String, List<StoryModel>> grouped = {};
    for (final story in stories) {
      grouped.putIfAbsent(story.userId, () => []).add(story);
    }

    final myStories = grouped[currentUserId] ?? [];
    final otherUsers = grouped.keys.where((id) => id != currentUserId).toList();

    return SizedBox(
      height: 96,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        children: [
          // My story / add story
          if (myStories.isEmpty)
            _buildAddStory(context)
          else
            StoryCircle(
              story: myStories.first,
              isMine: true,
              onTap: () => onViewStory?.call(myStories.first),
            ),
          // Others
          ...otherUsers.map((userId) {
            final userStories = grouped[userId]!;
            return Padding(
              padding: const EdgeInsets.only(left: 4),
              child: StoryCircle(
                story: userStories.first,
                onTap: () => onViewStory?.call(userStories.first),
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildAddStory(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return GestureDetector(
      onTap: onCreateStory,
      child: SizedBox(
        width: 72,
        child: Column(
          children: [
            Container(
              width: 58,
              height: 58,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: colorScheme.surfaceContainerHighest,
                border: Border.all(color: colorScheme.outline.withValues(alpha: 0.3)),
              ),
              child: Icon(Icons.add, color: colorScheme.primary, size: 26),
            ),
            const SizedBox(height: 4),
            Text(
              'Add Story',
              style: TextStyle(fontSize: 11, color: colorScheme.onSurface.withValues(alpha: 0.6)),
            ),
          ],
        ),
      ),
    );
  }
}
