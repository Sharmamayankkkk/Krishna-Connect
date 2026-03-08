import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../config/assets.dart';
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

    return Scaffold(
      body: NestedScrollView(
        controller: _scrollController,
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          SliverAppBar(
            floating: true,
            snap: true,
            title: Row(
              children: [
                Image.asset(
                  AppAssets.logoLight,
                  height: 28,
                  errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                ),
                const SizedBox(width: 8),
                Text(
                  'Krishna Connect',
                  style: TextStyle(
                    color: colorScheme.primary,
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
              if (user != null)
                Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: GestureDetector(
                    onTap: () => context.push('/profile/${user.username}'),
                    child: UserAvatar(imageUrl: user.avatarUrlOrDefault, size: 30, fallbackName: user.displayName),
                  ),
                ),
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
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: colorScheme.surface,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: colorScheme.outline.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      children: [
                        UserAvatar(imageUrl: user?.avatarUrlOrDefault, size: 34, fallbackName: user?.displayName),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            "What's on your mind?",
                            style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.4), fontSize: 14),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: colorScheme.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(Icons.edit, size: 18, color: colorScheme.primary),
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
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/create-post'),
        backgroundColor: colorScheme.primary,
        child: Icon(Icons.edit, color: colorScheme.onPrimary),
      ),
    );
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }
}
