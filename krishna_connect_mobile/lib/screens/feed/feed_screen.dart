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

class _FeedScreenState extends State<FeedScreen> with SingleTickerProviderStateMixin {
  final _scrollController = ScrollController();
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
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
          // Top bar matching webapp: sidebar icon | search bar | notification bell
          SliverAppBar(
            floating: true,
            snap: true,
            toolbarHeight: 56,
            leading: IconButton(
              icon: Icon(Icons.menu, color: colorScheme.onSurface),
              onPressed: () => Scaffold.of(context).openDrawer(),
            ),
            title: GestureDetector(
              onTap: () => context.push('/search'),
              child: Container(
                height: 38,
                decoration: BoxDecoration(
                  color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    const SizedBox(width: 12),
                    Icon(Icons.search, size: 20, color: colorScheme.onSurface.withValues(alpha: 0.4)),
                    const SizedBox(width: 8),
                    Text(
                      'Search...',
                      style: TextStyle(
                        color: colorScheme.onSurface.withValues(alpha: 0.4),
                        fontSize: 15,
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            actions: [
              // Notification bell with dot badge
              Stack(
                clipBehavior: Clip.none,
                children: [
                  IconButton(
                    icon: Icon(Icons.notifications_outlined, color: colorScheme.onSurface.withValues(alpha: 0.7)),
                    onPressed: () => context.push('/notifications'),
                  ),
                  if (unread > 0)
                    Positioned(
                      top: 10,
                      right: 10,
                      child: Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: AppTheme.errorColor,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 4),
            ],
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(44),
              child: Container(
                decoration: BoxDecoration(
                  border: Border(bottom: BorderSide(color: colorScheme.outline.withValues(alpha: 0.15))),
                ),
                child: TabBar(
                  controller: _tabController,
                  indicatorColor: colorScheme.primary,
                  indicatorWeight: 3,
                  labelColor: colorScheme.onSurface,
                  unselectedLabelColor: colorScheme.onSurface.withValues(alpha: 0.5),
                  labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                  unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 15),
                  tabs: const [
                    Tab(text: 'For You'),
                    Tab(text: 'Following'),
                  ],
                ),
              ),
            ),
          ),
        ],
        body: TabBarView(
          controller: _tabController,
          children: [
            // "For You" tab
            _buildFeedContent(context, app, user, colorScheme),
            // "Following" tab (same feed for now — can be filtered later)
            _buildFeedContent(context, app, user, colorScheme),
          ],
        ),
      ),
      // FAB matching webapp's MobileFab (Plus button)
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/create-post'),
        backgroundColor: colorScheme.primary,
        child: Icon(Icons.add, color: colorScheme.onPrimary, size: 26),
      ),
    );
  }

  Widget _buildFeedContent(BuildContext context, AppProvider app, dynamic user, ColorScheme colorScheme) {
    return RefreshIndicator(
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
    );
  }

  Widget _buildToolIcon(BuildContext context, IconData icon, Color color) {
    return Icon(icon, size: 20, color: color.withValues(alpha: 0.7));
  }

  @override
  void dispose() {
    _tabController.dispose();
    _scrollController.dispose();
    super.dispose();
  }
}
