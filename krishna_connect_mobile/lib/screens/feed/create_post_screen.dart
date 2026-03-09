import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../providers/app_provider.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/user_avatar.dart';
import '../../models/post_model.dart';

class CreatePostScreen extends StatefulWidget {
  const CreatePostScreen({super.key});
  @override
  State<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends State<CreatePostScreen> {
  final _contentController = TextEditingController();
  bool _isPosting = false;

  @override
  Widget build(BuildContext context) {
    final user = context.read<AuthProvider>().user;
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
        title: const Text('Create Post'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: ElevatedButton(
              onPressed: _isPosting || _contentController.text.trim().isEmpty ? null : _submitPost,
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8)),
              child: _isPosting ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Post'),
            ),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                UserAvatar(
                  imageUrl: user?.avatarUrlOrDefault,
                  size: 40,
                  fallbackName: user?.displayName,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (user != null) ...[
                        Row(
                          children: [
                            Text(
                              user.displayName,
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 15,
                                color: colorScheme.onSurface,
                              ),
                            ),
                            if (user.isVerified) ...[
                              const SizedBox(width: 4),
                              VerificationBadge(verified: user.verified, size: 15),
                            ],
                          ],
                        ),
                        Text(
                          '@${user.username ?? ''}',
                          style: TextStyle(
                            color: colorScheme.onSurface.withValues(alpha: 0.5),
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: 8),
                      ],
                      TextField(
                        controller: _contentController,
                        maxLines: null,
                        autofocus: true,
                        onChanged: (_) => setState(() {}),
                        decoration: const InputDecoration(
                          hintText: "What's on your mind?",
                          border: InputBorder.none,
                          filled: false,
                        ),
                        style: const TextStyle(fontSize: 16),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const Spacer(),
            // Media buttons
            Container(
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(border: Border(top: BorderSide(color: colorScheme.outline.withValues(alpha: 0.3)))),
              child: Row(
                children: [
                  IconButton(icon: const Icon(Icons.image_outlined, color: AppTheme.successColor), onPressed: () {}),
                  IconButton(icon: Icon(Icons.gif_box_outlined, color: colorScheme.primary), onPressed: () {}),
                  IconButton(icon: const Icon(Icons.poll_outlined, color: AppTheme.accentColor), onPressed: () {}),
                  IconButton(icon: const Icon(Icons.location_on_outlined, color: AppTheme.errorColor), onPressed: () {}),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submitPost() async {
    setState(() => _isPosting = true);
    try {
      await context.read<AppProvider>().createPost(_contentController.text.trim());
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
    setState(() => _isPosting = false);
  }
}
