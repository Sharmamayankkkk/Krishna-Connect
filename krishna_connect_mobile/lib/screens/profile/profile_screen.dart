import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/auth_provider.dart';
import '../../services/profile_service.dart';
import '../../services/post_service.dart';
import '../../models/user_model.dart';
import '../../models/post_model.dart';
import '../../widgets/user_avatar.dart';
import '../../widgets/post_card.dart';
import '../../providers/app_provider.dart';

class ProfileScreen extends StatefulWidget {
  final String username;
  const ProfileScreen({super.key, required this.username});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  UserModel? _profile;
  List<PostModel> _posts = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final profileService = context.read<ProfileService>();
    final postService = context.read<AppProvider>().postService;
    try {
      final profile = await profileService.getProfileByUsername(widget.username);
      List<PostModel> posts = [];
      if (profile != null) {
        posts = await postService.getUserPosts(profile.id);
      }
      setState(() { _profile = profile; _posts = posts; _isLoading = false; });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentUserId = context.read<AuthProvider>().userId;
    final isOwnProfile = _profile?.id == currentUserId;
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _profile == null
              ? const Center(child: Text('User not found'))
              : NestedScrollView(
                  headerSliverBuilder: (context, _) => [
                    SliverAppBar(
                      expandedHeight: 180,
                      pinned: true,
                      flexibleSpace: FlexibleSpaceBar(
                        background: _profile!.bannerUrl != null
                            ? CachedNetworkImage(imageUrl: _profile!.bannerUrl!, fit: BoxFit.cover, errorWidget: (_, __, ___) => Container(color: colorScheme.surface))
                            : Container(
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(colors: [colorScheme.primary.withValues(alpha: 0.3), theme.scaffoldBackgroundColor]),
                                ),
                              ),
                      ),
                      actions: [
                        if (isOwnProfile)
                          IconButton(icon: const Icon(Icons.settings_outlined), onPressed: () => context.push('/settings')),
                      ],
                    ),
                    SliverToBoxAdapter(child: _buildProfileInfo(context, isOwnProfile)),
                    SliverPersistentHeader(
                      pinned: true,
                      delegate: _TabBarDelegate(TabBar(
                        controller: _tabController,
                        tabs: const [Tab(text: 'Posts'), Tab(text: 'Replies'), Tab(text: 'Media')],
                      )),
                    ),
                  ],
                  body: TabBarView(
                    controller: _tabController,
                    children: [
                      // Posts
                      _posts.isEmpty
                          ? Center(child: Padding(padding: const EdgeInsets.all(32), child: Text('No posts yet', style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.4)))))
                          : ListView.builder(
                              itemCount: _posts.length,
                              itemBuilder: (context, index) => PostCard(
                                post: _posts[index],
                                onTap: () => context.push('/post/${_posts[index].id}'),
                              ),
                            ),
                      // Replies placeholder
                      Center(child: Text('Replies', style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.4)))),
                      // Media grid
                      _buildMediaGrid(),
                    ],
                  ),
                ),
    );
  }

  Widget _buildProfileInfo(BuildContext context, bool isOwnProfile) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Transform.translate(
            offset: const Offset(0, -36),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: theme.scaffoldBackgroundColor, width: 4)),
                  child: UserAvatar(imageUrl: _profile!.avatarUrlOrDefault, size: 80, fallbackName: _profile!.displayName),
                ),
                const Spacer(),
                if (isOwnProfile)
                  OutlinedButton(
                    onPressed: () => context.push('/edit-profile'),
                    child: const Text('Edit Profile'),
                  )
                else ...[
                  OutlinedButton(
                    onPressed: () async {
                      final profileService = context.read<ProfileService>();
                      if (_profile!.isFollowing) {
                        await profileService.unfollowUser(_profile!.id);
                      } else {
                        await profileService.followUser(_profile!.id);
                      }
                      _loadProfile();
                    },
                    style: _profile!.isFollowing ? OutlinedButton.styleFrom(side: BorderSide(color: colorScheme.outline.withValues(alpha: 0.3))) : ElevatedButton.styleFrom(backgroundColor: colorScheme.primary, foregroundColor: Colors.black),
                    child: Text(_profile!.isFollowing ? 'Following' : (_profile!.followStatus == 'pending' ? 'Requested' : 'Follow')),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton(onPressed: () {}, child: const Icon(Icons.chat_bubble_outline, size: 18)),
                ],
              ],
            ),
          ),
          Transform.translate(
            offset: const Offset(0, -20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Text(_profile!.displayName, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                  if (_profile!.isVerified) ...[const SizedBox(width: 6), VerificationBadge(verified: _profile!.verified, size: 18)],
                ]),
                if (_profile!.username != null)
                  Text('@${_profile!.username}', style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.4), fontSize: 14)),
                if (_profile!.bio != null && _profile!.bio!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(_profile!.bio!, style: const TextStyle(fontSize: 14, height: 1.4)),
                ],
                const SizedBox(height: 10),
                Row(children: [
                  if (_profile!.location != null) ...[
                    Icon(Icons.location_on_outlined, size: 14, color: colorScheme.onSurface.withValues(alpha: 0.4)),
                    const SizedBox(width: 3),
                    Text(_profile!.location!, style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.4), fontSize: 13)),
                    const SizedBox(width: 14),
                  ],
                  if (_profile!.website != null) ...[
                    Icon(Icons.link, size: 14, color: colorScheme.primary),
                    const SizedBox(width: 3),
                    Text(_profile!.website!, style: TextStyle(color: colorScheme.primary, fontSize: 13)),
                  ],
                ]),
                const SizedBox(height: 12),
                Row(children: [
                  _statItem('${_profile!.followingCount}', 'Following'),
                  const SizedBox(width: 20),
                  _statItem('${_profile!.followerCount}', 'Followers'),
                  const SizedBox(width: 20),
                  _statItem('${_posts.length}', 'Posts'),
                ]),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _statItem(String count, String label) {
    final colorScheme = Theme.of(context).colorScheme;
    return Row(children: [
      Text(count, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
      const SizedBox(width: 4),
      Text(label, style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.4), fontSize: 13)),
    ]);
  }

  Widget _buildMediaGrid() {
    final colorScheme = Theme.of(context).colorScheme;
    final mediaPosts = _posts.where((p) => p.media.isNotEmpty).toList();
    if (mediaPosts.isEmpty) return Center(child: Text('No media yet', style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.4))));
    return GridView.builder(
      padding: const EdgeInsets.all(2),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, crossAxisSpacing: 2, mainAxisSpacing: 2),
      itemCount: mediaPosts.length,
      itemBuilder: (context, index) {
        return CachedNetworkImage(imageUrl: mediaPosts[index].media.first.url, fit: BoxFit.cover,
          placeholder: (_, __) => Container(color: colorScheme.surfaceContainerHighest),
          errorWidget: (_, __, ___) => Container(color: colorScheme.surfaceContainerHighest, child: const Icon(Icons.broken_image)),
        );
      },
    );
  }
}

class _TabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;
  _TabBarDelegate(this.tabBar);
  @override
  double get minExtent => tabBar.preferredSize.height;
  @override
  double get maxExtent => tabBar.preferredSize.height;
  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(color: Theme.of(context).scaffoldBackgroundColor, child: tabBar);
  }
  @override
  bool shouldRebuild(covariant SliverPersistentHeaderDelegate oldDelegate) => false;
}
