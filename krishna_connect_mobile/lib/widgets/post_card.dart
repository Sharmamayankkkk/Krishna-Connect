import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../models/post_model.dart';
import '../providers/auth_provider.dart';
import '../providers/app_provider.dart';
import 'user_avatar.dart';

class PostCard extends StatelessWidget {
  final PostModel post;
  final VoidCallback? onTap;
  final VoidCallback? onProfileTap;
  final VoidCallback? onLike;
  final VoidCallback? onComment;
  final VoidCallback? onRepost;
  final VoidCallback? onBookmark;
  final VoidCallback? onShare;

  const PostCard({
    super.key,
    required this.post,
    this.onTap,
    this.onProfileTap,
    this.onLike,
    this.onComment,
    this.onRepost,
    this.onBookmark,
    this.onShare,
  });

  @override
  Widget build(BuildContext context) {
    final userId = context.read<AuthProvider>().userId ?? '';
    final isLiked = post.isLikedBy(userId);
    final isReposted = post.isRepostedBy(userId);
    final isSaved = post.isSavedBy(userId);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: colorScheme.surface,
          border: Border(bottom: BorderSide(color: colorScheme.outline.withValues(alpha: 0.3))),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Author header
            _buildHeader(context),
            
            // Content
            if (post.content != null && post.content!.isNotEmpty) ...[
              const SizedBox(height: 10),
              _buildContent(context),
            ],

            // Media
            if (post.media.isNotEmpty) ...[
              const SizedBox(height: 10),
              _buildMedia(context),
            ],

            // Poll
            if (post.poll != null) ...[
              const SizedBox(height: 10),
              _buildPoll(context, userId),
            ],

            // Quoted post
            if (post.quotedPost != null) ...[
              const SizedBox(height: 10),
              _buildQuotedPost(context),
            ],

            // Stats & Actions
            const SizedBox(height: 12),
            _buildActions(context, isLiked, isReposted, isSaved),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    final timeAgo = timeago.format(DateTime.tryParse(post.createdAt) ?? DateTime.now());
    final theme = Theme.of(context);
    final mutedColor = theme.colorScheme.onSurface.withValues(alpha: 0.5);
    
    return GestureDetector(
      onTap: onProfileTap,
      child: Row(
        children: [
          UserAvatar(
            imageUrl: post.author.avatarUrlOrDefault,
            size: 38,
            fallbackName: post.author.displayName,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        post.author.displayName,
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                          color: theme.colorScheme.onSurface,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (post.author.isVerified) ...[
                      const SizedBox(width: 3),
                      VerificationBadge(verified: post.author.verified, size: 14),
                    ],
                  ],
                ),
                Row(
                  children: [
                    if (post.author.username != null)
                      Text(
                        '@${post.author.username}',
                        style: TextStyle(color: mutedColor, fontSize: 12),
                      ),
                    Text(' · ', style: TextStyle(color: mutedColor, fontSize: 12)),
                    Text(timeAgo, style: TextStyle(color: mutedColor, fontSize: 12)),
                  ],
                ),
              ],
            ),
          ),
          if (post.isPinned)
            Icon(Icons.push_pin, size: 14, color: theme.colorScheme.primary),
          IconButton(
            icon: Icon(Icons.more_horiz, size: 20, color: mutedColor),
            onPressed: () => _showOptionsSheet(context),
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(BuildContext context) {
    return Text(
      post.content!,
      style: TextStyle(
        fontSize: 15,
        height: 1.4,
        color: Theme.of(context).colorScheme.onSurface,
      ),
    );
  }

  Widget _buildMedia(BuildContext context) {
    final placeholderColor = Theme.of(context).colorScheme.surfaceContainerHighest;

    if (post.media.length == 1) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: CachedNetworkImage(
          imageUrl: post.media.first.url,
          fit: BoxFit.cover,
          width: double.infinity,
          placeholder: (_, __) => Container(
            height: 200,
            color: placeholderColor,
            child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
          ),
          errorWidget: (_, __, ___) => Container(
            height: 200,
            color: placeholderColor,
            child: Icon(Icons.broken_image, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4)),
          ),
        ),
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: GridView.count(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisCount: 2,
        mainAxisSpacing: 2,
        crossAxisSpacing: 2,
        children: post.media.take(4).map((media) {
          return CachedNetworkImage(
            imageUrl: media.url,
            fit: BoxFit.cover,
            placeholder: (_, __) => Container(color: placeholderColor),
            errorWidget: (_, __, ___) => Container(
              color: placeholderColor,
              child: Icon(Icons.broken_image, size: 24, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4)),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildPoll(BuildContext context, String userId) {
    final poll = post.poll!;
    final totalVotes = poll.totalVotes;
    final hasVoted = poll.options.any((o) => o.votedBy.contains(userId));
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colorScheme.outline.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(poll.question, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: colorScheme.onSurface)),
          const SizedBox(height: 10),
          ...poll.options.map((option) {
            final pct = totalVotes > 0 ? (option.votes / totalVotes) : 0.0;
            final isSelected = option.votedBy.contains(userId);
            
            return Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Stack(
                  children: [
                    Container(
                      height: 40,
                      decoration: BoxDecoration(
                        color: colorScheme.surface,
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    if (hasVoted)
                      FractionallySizedBox(
                        widthFactor: pct,
                        child: Container(
                          height: 40,
                          decoration: BoxDecoration(
                            color: isSelected ? colorScheme.primary.withValues(alpha: 0.2) : colorScheme.outline.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                    Container(
                      height: 40,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Row(
                        children: [
                          Expanded(child: Text(option.text, style: TextStyle(fontSize: 13, color: colorScheme.onSurface))),
                          if (hasVoted)
                            Text('${(pct * 100).round()}%',
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: colorScheme.onSurface)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
          Text('$totalVotes votes', style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.5), fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildQuotedPost(BuildContext context) {
    final q = post.quotedPost!;
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colorScheme.outline.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              UserAvatar(imageUrl: q.author.avatarUrlOrDefault, size: 20, fallbackName: q.author.displayName),
              const SizedBox(width: 6),
              Text(q.author.displayName, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: colorScheme.onSurface)),
              if (q.author.isVerified) ...[
                const SizedBox(width: 3),
                VerificationBadge(verified: q.author.verified, size: 12),
              ],
            ],
          ),
          if (q.content != null) ...[
            const SizedBox(height: 6),
            Text(q.content!, style: TextStyle(fontSize: 13, color: colorScheme.onSurface.withValues(alpha: 0.7)), maxLines: 3, overflow: TextOverflow.ellipsis),
          ],
        ],
      ),
    );
  }

  Widget _buildActions(BuildContext context, bool isLiked, bool isReposted, bool isSaved) {
    final mutedColor = Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5);
    final primaryColor = Theme.of(context).colorScheme.primary;

    return Row(
      children: [
        _actionButton(
          icon: Icons.chat_bubble_outline,
          color: mutedColor,
          label: _formatCount(post.commentsCount),
          onTap: onComment,
        ),
        const SizedBox(width: 16),
        _actionButton(
          icon: Icons.repeat,
          color: isReposted ? AppTheme.successColor : mutedColor,
          label: _formatCount(post.repostsCount),
          onTap: onRepost,
        ),
        const SizedBox(width: 16),
        _actionButton(
          icon: isLiked ? Icons.favorite : Icons.favorite_border,
          color: isLiked ? const Color(0xFFEC4899) : mutedColor,
          label: _formatCount(post.likesCount),
          onTap: onLike,
        ),
        const SizedBox(width: 16),
        _actionButton(
          icon: Icons.bar_chart_rounded,
          color: mutedColor,
          label: _formatCount(post.viewsCount),
        ),
        const Spacer(),
        _actionButton(
          icon: isSaved ? Icons.bookmark : Icons.bookmark_border,
          color: isSaved ? primaryColor : mutedColor,
          onTap: onBookmark,
        ),
        const SizedBox(width: 8),
        _actionButton(
          icon: Icons.share_outlined,
          color: mutedColor,
          onTap: onShare,
        ),
      ],
    );
  }

  Widget _actionButton({
    required IconData icon,
    required Color color,
    String? label,
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Row(
        children: [
          Icon(icon, size: 20, color: color),
          if (label != null && label.isNotEmpty) ...[
            const SizedBox(width: 4),
            Text(label, style: TextStyle(color: color, fontSize: 12)),
          ],
        ],
      ),
    );
  }

  String _formatCount(int count) {
    if (count == 0) return '';
    if (count >= 1000000) return '${(count / 1000000).toStringAsFixed(1)}M';
    if (count >= 1000) return '${(count / 1000).toStringAsFixed(1)}K';
    return count.toString();
  }

  void _showOptionsSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.share_outlined),
              title: const Text('Share'),
              onTap: () { Navigator.pop(context); onShare?.call(); },
            ),
            ListTile(
              leading: const Icon(Icons.flag_outlined),
              title: const Text('Report'),
              onTap: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    );
  }
}
