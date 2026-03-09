import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/app_provider.dart';
import '../../widgets/post_card.dart';
import '../../widgets/story_widgets.dart';
import '../../widgets/user_avatar.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});
  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 300) {
      final app = context.read<AppProvider>();
      if (!app.isFeedLoading && app.hasMorePosts) {
        app.loadFeed();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final app = context.watch<AppProvider>();
    final user = auth.user;
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final unread = app.unreadNotifications;

    return Scaffold(
      body: NestedScrollView(
        controller: _scrollController,
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          SliverAppBar(
            floating: true,
            snap: true,
            title: Row(
              children: [
                Icon(Icons.auto_awesome, size: 20, color: colorScheme.primary),
                const SizedBox(width: 8),
                Text(
                  'For You',
                  style: TextStyle(
                    color: colorScheme.onSurface,
                    fontWeight: FontWeight.w700,
                    fontSize: 20,
                  ),
                ),
              ],
            ),
            actions: [
              IconButton(
                icon: Icon(Icons.search, color: colorScheme.onSurface.withValues(alpha: 0.6)),
                onPressed: () => context.push('/search'),
              ),
              // Notification bell with unread badge (matching webapp sidebar)
              Stack(
                clipBehavior: Clip.none,
                children: [
                  IconButton(
                    icon: Icon(Icons.notifications_outlined, color: colorScheme.onSurface.withValues(alpha: 0.6)),
                    onPressed: () => context.push('/notifications'),
                  ),
                  if (unread > 0)
                    Positioned(
                      top: 6,
                      right: 6,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                        decoration: BoxDecoration(
                          color: colorScheme.primary,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        constraints: const BoxConstraints(minWidth: 16),
                        child: Text(
                          unread > 99 ? '99+' : unread.toString(),
                          style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 4),
            ],
          ),
        ],
        body: RefreshIndicator(
          onRefresh: () async {
            await app.loadFeed(refresh: true);
            await app.loadStories();
          },
          color: colorScheme.primary,
          child: CustomScrollView(
            slivers: [
              // Stories bar
              if (app.stories.isNotEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: StoriesBar(
                      stories: app.stories,
                      currentUserId: user?.id ?? '',
                      onCreateStory: () => context.push('/create-story'),
                    ),
                  ),
                ),

              // Create post prompt
              SliverToBoxAdapter(
                child: GestureDetector(
                  onTap: () => context.push('/create-post'),
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: colorScheme.surface,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: colorScheme.outline.withValues(alpha: 0.3)),
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            UserAvatar(imageUrl: user?.avatarUrlOrDefault, size: 34, fallbackName: user?.displayName),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                "What's on your mind?",
                                style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.4), fontSize: 14),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            _buildToolIcon(context, Icons.image_outlined, colorScheme.primary),
                            const SizedBox(width: 16),
                            _buildToolIcon(context, Icons.videocam_outlined, AppTheme.successColor),
                            const SizedBox(width: 16),
                            _buildToolIcon(context, Icons.emoji_emotions_outlined, AppTheme.warningColor),
                            const SizedBox(width: 16),
                            _buildToolIcon(context, Icons.bar_chart, colorScheme.primary),
                            const Spacer(),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                              decoration: BoxDecoration(
                                color: colorScheme.primary,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                'Post',
                                style: TextStyle(
                                  color: colorScheme.onPrimary,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Loading state
              if (app.isFeedLoading && app.feedPosts.isEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(40),
                    child: Center(child: CircularProgressIndicator(color: colorScheme.primary)),
                  ),
                ),

              // Empty state
              if (!app.isFeedLoading && app.feedPosts.isEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(40),
                    child: Column(
                      children: [
                        Icon(Icons.article_outlined, size: 60, color: colorScheme.onSurface.withValues(alpha: 0.3)),
                        const SizedBox(height: 16),
                        Text('No posts yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: colorScheme.onSurface.withValues(alpha: 0.7))),
                        const SizedBox(height: 6),
                        Text('Be the first to share something!', style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.4), fontSize: 14)),
                      ],
                    ),
                  ),
                ),

              // Post list
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    if (index >= app.feedPosts.length) {
                      return const Padding(
                        padding: EdgeInsets.all(20),
                        child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
                      );
                    }
                    final post = app.feedPosts[index];
                    return PostCard(
                      post: post,
                      onTap: () => context.push('/post/${post.id}'),
                      onProfileTap: () => context.push('/profile/${post.author.username}'),
                      onLike: () => app.toggleLike(post, user?.id ?? ''),
                      onComment: () => context.push('/post/${post.id}'),
                      onBookmark: () => app.toggleBookmark(post, user?.id ?? ''),
                    );
                  },
                  childCount: app.feedPosts.length + (app.isFeedLoading && app.feedPosts.isNotEmpty ? 1 : 0),
                ),
              ),
            ],
          ),
        ),
      ),
      // Expandable FAB matching webapp's MobileFab (Plus → Post / Leela actions)
      floatingActionButton: _ExpandableFab(
        onCreatePost: () => context.push('/create-post'),
        onCreateLeela: () => context.push('/leela'),
      ),
    );
  }

  Widget _buildToolIcon(BuildContext context, IconData icon, Color color) {
    return Icon(icon, size: 20, color: color.withValues(alpha: 0.7));
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }
}

/// Expandable FAB matching the webapp's MobileFab component.
/// Shows a Plus button that expands to show Post and Leela actions.
class _ExpandableFab extends StatefulWidget {
  final VoidCallback onCreatePost;
  final VoidCallback onCreateLeela;

  const _ExpandableFab({
    required this.onCreatePost,
    required this.onCreateLeela,
  });

  @override
  State<_ExpandableFab> createState() => _ExpandableFabState();
}

class _ExpandableFabState extends State<_ExpandableFab> with SingleTickerProviderStateMixin {
  bool _isOpen = false;
  late AnimationController _controller;
  late Animation<double> _expandAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 250),
    );
    _expandAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOut,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _toggle() {
    setState(() {
      _isOpen = !_isOpen;
      if (_isOpen) {
        _controller.forward();
      } else {
        _controller.reverse();
      }
    });
  }

  void _close() {
    if (_isOpen) _toggle();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        // Expanded action buttons
        FadeTransition(
          opacity: _expandAnimation,
          child: ScaleTransition(
            scale: _expandAnimation,
            alignment: Alignment.bottomRight,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                _buildAction(
                  icon: Icons.edit_outlined,
                  label: 'Post',
                  onTap: () {
                    _close();
                    widget.onCreatePost();
                  },
                  colorScheme: colorScheme,
                ),
                const SizedBox(height: 12),
                _buildAction(
                  icon: Icons.movie_creation_outlined,
                  label: 'Leela',
                  onTap: () {
                    _close();
                    widget.onCreateLeela();
                  },
                  colorScheme: colorScheme,
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
        // Main FAB - Plus icon that rotates 45° when open (matching webapp)
        FloatingActionButton(
          onPressed: _toggle,
          backgroundColor: colorScheme.primary,
          child: AnimatedRotation(
            turns: _isOpen ? 0.125 : 0,
            duration: const Duration(milliseconds: 250),
            child: Icon(Icons.add, color: colorScheme.onPrimary, size: 26),
          ),
        ),
      ],
    );
  }

  Widget _buildAction({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    required ColorScheme colorScheme,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: colorScheme.surface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: colorScheme.outline.withValues(alpha: 0.2)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.08),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: colorScheme.onSurface,
            ),
          ),
        ),
        const SizedBox(width: 12),
        FloatingActionButton.small(
          heroTag: 'fab_$label',
          onPressed: onTap,
          backgroundColor: colorScheme.surface,
          foregroundColor: colorScheme.primary,
          elevation: 4,
          child: Icon(icon),
        ),
      ],
    );
  }
}
