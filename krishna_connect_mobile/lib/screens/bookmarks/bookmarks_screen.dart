import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../providers/app_provider.dart';
import '../../models/post_model.dart';
import '../../widgets/post_card.dart';

class BookmarksScreen extends StatefulWidget {
  const BookmarksScreen({super.key});
  @override
  State<BookmarksScreen> createState() => _BookmarksScreenState();
}

class _BookmarksScreenState extends State<BookmarksScreen> {
  List<PostModel> _bookmarkedPosts = [];
  List<Map<String, dynamic>> _collections = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadBookmarks();
  }

  Future<void> _loadBookmarks() async {
    try {
      final bookmarkService = context.read<AppProvider>().bookmarkService;
      final bookmarks = await bookmarkService.getBookmarks();
      final collections = await bookmarkService.getCollections();
      setState(() {
        _bookmarkedPosts = bookmarks
            .where((b) => b['posts'] != null)
            .map((b) => PostModel.fromJson(Map<String, dynamic>.from(b['posts'])))
            .toList();
        _collections = collections;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Bookmarks error: $e');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bookmarks'),
        actions: [
          IconButton(
            icon: const Icon(Icons.create_new_folder_outlined),
            onPressed: () => _showCreateCollectionSheet(context),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _bookmarkedPosts.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.bookmark_outline, size: 64, color: colorScheme.onSurface.withValues(alpha: 0.4)),
                      SizedBox(height: 16),
                      Text('No bookmarks yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: colorScheme.onSurface.withValues(alpha: 0.7))),
                      SizedBox(height: 6),
                      Text('Save posts to find them later', style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.4))),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadBookmarks,
                  child: CustomScrollView(
                    slivers: [
                      // Collections
                      if (_collections.isNotEmpty)
                        SliverToBoxAdapter(
                          child: SizedBox(
                            height: 80,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              itemCount: _collections.length,
                              itemBuilder: (context, index) {
                                final collection = _collections[index];
                                return Container(
                                  margin: const EdgeInsets.only(right: 8),
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                  decoration: BoxDecoration(
                                    color: colorScheme.surface,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: colorScheme.outline.withValues(alpha: 0.3)),
                                  ),
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.folder_outlined, size: 20, color: colorScheme.primary),
                                      const SizedBox(height: 4),
                                      Text(collection['name'] ?? 'Collection', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                                    ],
                                  ),
                                );
                              },
                            ),
                          ),
                        ),

                      // Bookmarked posts
                      SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            final post = _bookmarkedPosts[index];
                            return PostCard(
                              post: post,
                              onTap: () => context.push('/post/${post.id}'),
                              onProfileTap: () => context.push('/profile/${post.author.username}'),
                            );
                          },
                          childCount: _bookmarkedPosts.length,
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }

  void _showCreateCollectionSheet(BuildContext context) {
    final nameController = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('New Collection', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 14),
              TextField(controller: nameController, autofocus: true, decoration: const InputDecoration(labelText: 'Collection Name', prefixIcon: Icon(Icons.folder_outlined))),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: () async {
                    if (nameController.text.trim().isEmpty) return;
                    await context.read<AppProvider>().bookmarkService.createCollection(nameController.text.trim());
                    await _loadBookmarks();
                    if (ctx.mounted) Navigator.pop(ctx);
                  },
                  child: const Text('Create'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
