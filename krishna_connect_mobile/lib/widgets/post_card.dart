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

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppTheme.cardDark,
          border: Border(bottom: BorderSide(color: AppTheme.borderDark.withValues(alpha: 0.5))),
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
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
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
                        style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                      ),
                    const Text(' · ', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                    Text(timeAgo, style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                  ],
                ),
              ],
            ),
          ),
          if (post.isPinned)
            const Icon(Icons.push_pin, size: 14, color: AppTheme.primaryColor),
          IconButton(
            icon: const Icon(Icons.more_horiz, size: 20, color: AppTheme.textMuted),
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
      style: const TextStyle(fontSize: 15, height: 1.4, color: AppTheme.textPrimary),
    );
  }

  Widget _buildMedia(BuildContext context) {
    if (post.media.length == 1) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: CachedNetworkImage(
          imageUrl: post.media.first.url,
          fit: BoxFit.cover,
          width: double.infinity,
          placeholder: (_, __) => Container(
            height: 200,
            color: AppTheme.cardDarkElevated,
            child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
          ),
          errorWidget: (_, __, ___) => Container(
            height: 200,
            color: AppTheme.cardDarkElevated,
            child: const Icon(Icons.broken_image, color: AppTheme.textMuted),
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
            placeholder: (_, __) => Container(color: AppTheme.cardDarkElevated),
            errorWidget: (_, __, ___) => Container(
              color: AppTheme.cardDarkElevated,
              child: const Icon(Icons.broken_image, size: 24, color: AppTheme.textMuted),
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

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.cardDarkElevated,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.borderDark),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(poll.question, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
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
                        color: AppTheme.cardDark,
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    if (hasVoted)
                      FractionallySizedBox(
                        widthFactor: pct,
                        child: Container(
                          height: 40,
                          decoration: BoxDecoration(
                            color: isSelected ? AppTheme.primaryColor.withValues(alpha: 0.3) : AppTheme.borderDark,
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                    Container(
                      height: 40,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Row(
                        children: [
                          Expanded(child: Text(option.text, style: const TextStyle(fontSize: 13))),
                          if (hasVoted)
                            Text('${(pct * 100).round()}%',
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
          Text('$totalVotes votes', style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildQuotedPost(BuildContext context) {
    final q = post.quotedPost!;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.borderDark),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              UserAvatar(imageUrl: q.author.avatarUrlOrDefault, size: 20, fallbackName: q.author.displayName),
              const SizedBox(width: 6),
              Text(q.author.displayName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
              if (q.author.isVerified) ...[
                const SizedBox(width: 3),
                VerificationBadge(verified: q.author.verified, size: 12),
              ],
            ],
          ),
          if (q.content != null) ...[
            const SizedBox(height: 6),
            Text(q.content!, style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary), maxLines: 3, overflow: TextOverflow.ellipsis),
          ],
        ],
      ),
    );
  }

  Widget _buildActions(BuildContext context, bool isLiked, bool isReposted, bool isSaved) {
    return Row(
      children: [
        _actionButton(
          icon: isLiked ? Icons.favorite : Icons.favorite_border,
          color: isLiked ? Colors.red : AppTheme.textMuted,
          label: _formatCount(post.likesCount),
          onTap: onLike,
        ),
        const SizedBox(width: 16),
        _actionButton(
          icon: Icons.chat_bubble_outline,
          color: AppTheme.textMuted,
          label: _formatCount(post.commentsCount),
          onTap: onComment,
        ),
        const SizedBox(width: 16),
        _actionButton(
          icon: Icons.repeat,
          color: isReposted ? AppTheme.successColor : AppTheme.textMuted,
          label: _formatCount(post.repostsCount),
          onTap: onRepost,
        ),
        const Spacer(),
        _actionButton(
          icon: isSaved ? Icons.bookmark : Icons.bookmark_border,
          color: isSaved ? AppTheme.primaryColor : AppTheme.textMuted,
          onTap: onBookmark,
        ),
        const SizedBox(width: 8),
        _actionButton(
          icon: Icons.share_outlined,
          color: AppTheme.textMuted,
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
