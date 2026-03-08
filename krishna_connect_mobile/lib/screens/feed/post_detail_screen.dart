import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/app_provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/post_model.dart';
import '../../widgets/post_card.dart';
import '../../widgets/user_avatar.dart';
import 'package:timeago/timeago.dart' as timeago;

class PostDetailScreen extends StatefulWidget {
  final String postId;
  const PostDetailScreen({super.key, required this.postId});
  @override
  State<PostDetailScreen> createState() => _PostDetailScreenState();
}

class _PostDetailScreenState extends State<PostDetailScreen> {
  PostModel? _post;
  List<CommentModel> _comments = [];
  final _commentController = TextEditingController();
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPost();
  }

  Future<void> _loadPost() async {
    final postService = context.read<AppProvider>().postService;
    final post = await postService.getPost(widget.postId);
    final comments = await postService.getComments(widget.postId);
    setState(() { _post = post; _comments = comments; _isLoading = false; });
  }

  @override
  Widget build(BuildContext context) {
    final userId = context.read<AuthProvider>().userId ?? '';

    return Scaffold(
      appBar: AppBar(title: const Text('Post')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _post == null
              ? const Center(child: Text('Post not found'))
              : Column(
                  children: [
                    Expanded(
                      child: SingleChildScrollView(
                        child: Column(
                          children: [
                            PostCard(post: _post!),
                            const Divider(height: 1),
                            // Comments
                            ListView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: _comments.length,
                              itemBuilder: (context, index) {
                                final comment = _comments[index];
                                return _buildComment(comment);
                              },
                            ),
                            if (_comments.isEmpty)
                              const Padding(
                                padding: EdgeInsets.all(32),
                                child: Text('No comments yet', style: TextStyle(color: AppTheme.textMuted)),
                              ),
                          ],
                        ),
                      ),
                    ),
                    // Comment input
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.cardDark,
                        border: Border(top: BorderSide(color: AppTheme.borderDark)),
                      ),
                      child: SafeArea(
                        child: Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _commentController,
                                decoration: InputDecoration(
                                  hintText: 'Add a comment...',
                                  filled: true,
                                  fillColor: AppTheme.cardDarkElevated,
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            IconButton(
                              onPressed: () async {
                                if (_commentController.text.trim().isEmpty) return;
                                await context.read<AppProvider>().postService.addComment(widget.postId, _commentController.text.trim());
                                _commentController.clear();
                                await _loadPost();
                              },
                              icon: const Icon(Icons.send, color: AppTheme.primaryColor),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _buildComment(CommentModel comment) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          UserAvatar(imageUrl: comment.author.avatarUrlOrDefault, size: 32, fallbackName: comment.author.displayName),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(comment.author.displayName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                    const SizedBox(width: 6),
                    Text(timeago.format(DateTime.tryParse(comment.createdAt) ?? DateTime.now()), style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
                  ],
                ),
                const SizedBox(height: 3),
                Text(comment.content, style: const TextStyle(fontSize: 14)),
                const SizedBox(height: 4),
                Row(
                  children: [
                    GestureDetector(child: const Icon(Icons.favorite_border, size: 16, color: AppTheme.textMuted)),
                    if (comment.likesCount > 0) ...[
                      const SizedBox(width: 4),
                      Text('${comment.likesCount}', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                    ],
                    const SizedBox(width: 16),
                    GestureDetector(child: const Text('Reply', style: TextStyle(fontSize: 12, color: AppTheme.textMuted, fontWeight: FontWeight.w600))),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
