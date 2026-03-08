import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../providers/app_provider.dart';
import '../../services/profile_service.dart';
import '../../models/user_model.dart';
import '../../models/post_model.dart';
import '../../widgets/user_avatar.dart';
import '../../widgets/post_card.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});
  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _searchController = TextEditingController();
  List<UserModel> _users = [];
  List<PostModel> _posts = [];
  bool _isSearching = false;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  Future<void> _search(String query) async {
    if (query.trim().isEmpty) {
      setState(() { _users = []; _posts = []; _query = ''; });
      return;
    }
    setState(() { _isSearching = true; _query = query; });

    try {
      final profileService = context.read<ProfileService>();
      final postService = context.read<AppProvider>().postService;
      final users = await profileService.searchUsers(query);
      final posts = await postService.searchPosts(query);
      setState(() { _users = users; _posts = posts; });
    } catch (e) {
      debugPrint('Search error: $e');
    }
    setState(() => _isSearching = false);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: TextField(
          controller: _searchController,
          autofocus: true,
          onSubmitted: _search,
          onChanged: (value) {
            if (value.length >= 2) _search(value);
          },
          decoration: InputDecoration(
            hintText: 'Search users, posts...',
            border: InputBorder.none,
            filled: true,
            fillColor: colorScheme.surfaceContainerHighest,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            prefixIcon: Icon(Icons.search, size: 20, color: colorScheme.onSurface.withValues(alpha: 0.4)),
            suffixIcon: _searchController.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear, size: 18),
                    onPressed: () {
                      _searchController.clear();
                      setState(() { _users = []; _posts = []; _query = ''; });
                    },
                  )
                : null,
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: 'People (${_users.length})'),
            Tab(text: 'Posts (${_posts.length})'),
          ],
        ),
      ),
      body: _query.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.search, size: 64, color: colorScheme.onSurface.withValues(alpha: 0.4)),
                  SizedBox(height: 16),
                  Text('Search Krishna Connect', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: colorScheme.onSurface.withValues(alpha: 0.7))),
                  SizedBox(height: 6),
                  Text('Find people, posts, and more', style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.4))),
                ],
              ),
            )
          : _isSearching
              ? const Center(child: CircularProgressIndicator())
              : TabBarView(
                  controller: _tabController,
                  children: [
                    // Users tab
                    _users.isEmpty
                        ? Center(child: Text('No users found', style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.4))))
                        : ListView.builder(
                            itemCount: _users.length,
                            itemBuilder: (context, index) {
                              final user = _users[index];
                              return ListTile(
                                onTap: () => context.push('/profile/${user.username}'),
                                leading: UserAvatar(imageUrl: user.avatarUrlOrDefault, size: 44, fallbackName: user.displayName),
                                title: Row(
                                  children: [
                                    Flexible(child: Text(user.displayName, style: const TextStyle(fontWeight: FontWeight.w600))),
                                    if (user.isVerified) ...[const SizedBox(width: 4), VerificationBadge(verified: user.verified, size: 14)],
                                  ],
                                ),
                                subtitle: user.username != null ? Text('@${user.username}', style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.4), fontSize: 13)) : null,
                              );
                            },
                          ),

                    // Posts tab
                    _posts.isEmpty
                        ? Center(child: Text('No posts found', style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.4))))
                        : ListView.builder(
                            itemCount: _posts.length,
                            itemBuilder: (context, index) {
                              final post = _posts[index];
                              return PostCard(
                                post: post,
                                onTap: () => context.push('/post/${post.id}'),
                                onProfileTap: () => context.push('/profile/${post.author.username}'),
                              );
                            },
                          ),
                  ],
                ),
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }
}
