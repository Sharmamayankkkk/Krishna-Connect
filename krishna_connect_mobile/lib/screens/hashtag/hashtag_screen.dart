import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../providers/app_provider.dart';
import '../../models/post_model.dart';
import '../../widgets/post_card.dart';

class HashtagScreen extends StatefulWidget {
  final String tag;
  const HashtagScreen({super.key, required this.tag});
  @override
  State<HashtagScreen> createState() => _HashtagScreenState();
}

class _HashtagScreenState extends State<HashtagScreen> {
  List<PostModel> _posts = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPosts();
  }

  Future<void> _loadPosts() async {
    setState(() => _isLoading = true);
    try {
      final app = context.read<AppProvider>();
      final posts = await app.postService.getPostsByHashtag(widget.tag);
      setState(() { _posts = posts; _isLoading = false; });
    } catch (e) {
      debugPrint('Hashtag load error: $e');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: Text('#${widget.tag}'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadPosts,
              child: _posts.isEmpty
                  ? ListView(
                      children: [
                        SizedBox(height: MediaQuery.of(context).size.height * 0.25),
                        Icon(Icons.tag, size: 64, color: colorScheme.onSurface.withValues(alpha: 0.2)),
                        const SizedBox(height: 16),
                        Center(
                          child: Text(
                            'No posts with #${widget.tag} yet',
                            style: TextStyle(fontSize: 16, color: colorScheme.onSurface.withValues(alpha: 0.5)),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Center(
                          child: Text(
                            'Be the first to post with this hashtag!',
                            style: TextStyle(fontSize: 13, color: colorScheme.onSurface.withValues(alpha: 0.3)),
                          ),
                        ),
                      ],
                    )
                  : ListView.builder(
                      itemCount: _posts.length + 1,
                      itemBuilder: (context, index) {
                        if (index == 0) {
                          return Container(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                Container(
                                  width: 48, height: 48,
                                  decoration: BoxDecoration(
                                    color: colorScheme.primary.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Center(
                                    child: Text('#', style: TextStyle(color: colorScheme.primary, fontSize: 24, fontWeight: FontWeight.w700)),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('#${widget.tag}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                                    Text('${_posts.length} post${_posts.length == 1 ? '' : 's'}',
                                        style: TextStyle(fontSize: 13, color: colorScheme.onSurface.withValues(alpha: 0.5))),
                                  ],
                                ),
                              ],
                            ),
                          );
                        }
                        final post = _posts[index - 1];
                        return PostCard(
                          post: post,
                          onTap: () => context.push('/post/${post.id}'),
                          onProfileTap: () => context.push('/profile/${post.author.username}'),
                        );
                      },
                    ),
            ),
    );
  }
}
