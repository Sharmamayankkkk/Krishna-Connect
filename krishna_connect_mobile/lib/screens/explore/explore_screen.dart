import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../providers/app_provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/profile_service.dart';
import '../../models/user_model.dart';
import '../../widgets/user_avatar.dart';
import '../../widgets/post_card.dart';

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key});
  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, dynamic>> _trending = [];
  List<UserModel> _suggestedUsers = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
  }

  Future<void> _loadData() async {
    final app = context.read<AppProvider>();
    final profile = context.read<ProfileService>();
    try {
      final trending = await app.postService.getTrendingHashtags();
      final suggested = await profile.getSuggestedUsers();
      setState(() { _trending = trending; _suggestedUsers = suggested; });
    } catch (e) { debugPrint('Explore error: $e'); }
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppProvider>();
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Scaffold(
      body: NestedScrollView(
        headerSliverBuilder: (context, _) => [
          SliverAppBar(
            floating: true, snap: true,
            title: const Text('Explore'),
            actions: [
              IconButton(icon: const Icon(Icons.search), onPressed: () => context.push('/search')),
            ],
            bottom: TabBar(controller: _tabController, tabs: const [Tab(text: 'For You'), Tab(text: 'Trending'), Tab(text: 'People')]),
          ),
        ],
        body: TabBarView(
          controller: _tabController,
          children: [
            // For You - posts
            RefreshIndicator(
              onRefresh: () => app.loadFeed(refresh: true),
              child: ListView.builder(
                itemCount: app.feedPosts.length,
                itemBuilder: (context, index) {
                  final post = app.feedPosts[index];
                  return PostCard(
                    post: post,
                    onTap: () => context.push('/post/${post.id}'),
                    onProfileTap: () => context.push('/profile/${post.author.username}'),
                  );
                },
              ),
            ),
            // Trending
            ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const Text('Trending Topics', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),
                ..._trending.map((t) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    width: 40, height: 40,
                    decoration: BoxDecoration(color: colorScheme.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                    child: Center(child: Text('#', style: TextStyle(color: colorScheme.primary, fontSize: 20, fontWeight: FontWeight.w700))),
                  ),
                  title: Text(t['tag'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text('${t['usage_count'] ?? 0} posts', style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.4), fontSize: 12)),
                  onTap: () {
                    final tag = t['tag'] ?? '';
                    if (tag.isNotEmpty) context.push('/hashtag/$tag');
                  },
                )),
                if (_trending.isEmpty)
                  Padding(
                    padding: const EdgeInsets.all(32),
                    child: Center(child: Text('No trending topics yet', style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.4)))),
                  ),
              ],
            ),
            // People
            ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const Text('Suggested People', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),
                ..._suggestedUsers.map((user) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: colorScheme.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: colorScheme.outline.withValues(alpha: 0.3))),
                    child: Row(
                      children: [
                        UserAvatar(imageUrl: user.avatarUrlOrDefault, size: 44, fallbackName: user.displayName),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(children: [
                                Flexible(child: Text(user.displayName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14), overflow: TextOverflow.ellipsis)),
                                if (user.isVerified) ...[const SizedBox(width: 4), VerificationBadge(verified: user.verified, size: 14)],
                              ]),
                              if (user.username != null) Text('@${user.username}', style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.4), fontSize: 12)),
                            ],
                          ),
                        ),
                        OutlinedButton(
                          onPressed: () async {
                            await context.read<ProfileService>().followUser(user.id);
                            _loadData();
                          },
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          ),
                          child: const Text('Follow', style: TextStyle(fontSize: 13)),
                        ),
                      ],
                    ),
                  ),
                )),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
