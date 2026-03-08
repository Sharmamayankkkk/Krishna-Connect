import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/theme.dart';
import '../../models/models.dart';
import '../../widgets/user_avatar.dart';

class StoryViewerScreen extends StatefulWidget {
  final List<StoryModel> stories;
  final int initialIndex;

  const StoryViewerScreen({
    super.key,
    required this.stories,
    this.initialIndex = 0,
  });

  @override
  State<StoryViewerScreen> createState() => _StoryViewerScreenState();
}

class _StoryViewerScreenState extends State<StoryViewerScreen> with SingleTickerProviderStateMixin {
  late PageController _pageController;
  late AnimationController _progressController;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: _currentIndex);
    _progressController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 5),
    )..addStatusListener((status) {
        if (status == AnimationStatus.completed) {
          _nextStory();
        }
      });
    _progressController.forward();
  }

  void _nextStory() {
    if (_currentIndex < widget.stories.length - 1) {
      _pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    } else {
      Navigator.pop(context);
    }
  }

  void _previousStory() {
    if (_currentIndex > 0) {
      _pageController.previousPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        onTapUp: (details) {
          final width = MediaQuery.of(context).size.width;
          if (details.globalPosition.dx < width / 3) {
            _previousStory();
          } else {
            _nextStory();
          }
        },
        onLongPressStart: (_) => _progressController.stop(),
        onLongPressEnd: (_) => _progressController.forward(),
        child: PageView.builder(
          controller: _pageController,
          itemCount: widget.stories.length,
          onPageChanged: (index) {
            setState(() => _currentIndex = index);
            _progressController.reset();
            _progressController.forward();
          },
          itemBuilder: (context, index) {
            final story = widget.stories[index];
            return Stack(
              fit: StackFit.expand,
              children: [
                // Story media
                if (story.mediaType == 'video')
                  Container(color: Colors.black, child: const Center(child: Icon(Icons.play_circle, size: 64, color: Colors.white54)))
                else
                  CachedNetworkImage(
                    imageUrl: story.mediaUrl,
                    fit: BoxFit.contain,
                    placeholder: (_, __) => const Center(child: CircularProgressIndicator()),
                    errorWidget: (_, __, ___) => const Center(child: Icon(Icons.broken_image, size: 64, color: Colors.white54)),
                  ),

                // Top gradient
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 120,
                  child: Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.black54, Colors.transparent]),
                    ),
                  ),
                ),

                // Progress bars
                Positioned(
                  top: MediaQuery.of(context).padding.top + 8,
                  left: 8,
                  right: 8,
                  child: Row(
                    children: List.generate(widget.stories.length, (i) {
                      return Expanded(
                        child: Container(
                          margin: const EdgeInsets.symmetric(horizontal: 2),
                          height: 2.5,
                          child: i < _currentIndex
                              ? Container(decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(2)))
                              : i == _currentIndex
                                  ? AnimatedBuilder(
                                      animation: _progressController,
                                      builder: (context, child) {
                                        return ClipRRect(
                                          borderRadius: BorderRadius.circular(2),
                                          child: LinearProgressIndicator(
                                            value: _progressController.value,
                                            backgroundColor: Colors.white30,
                                            valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                                            minHeight: 2.5,
                                          ),
                                        );
                                      },
                                    )
                                  : Container(decoration: BoxDecoration(color: Colors.white30, borderRadius: BorderRadius.circular(2))),
                        ),
                      );
                    }),
                  ),
                ),

                // User info
                Positioned(
                  top: MediaQuery.of(context).padding.top + 20,
                  left: 12,
                  right: 12,
                  child: Row(
                    children: [
                      UserAvatar(imageUrl: story.user?.avatarUrlOrDefault, size: 36, fallbackName: story.user?.displayName),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(story.user?.displayName ?? 'Unknown', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14)),
                            Text(_timeAgo(story.createdAt), style: const TextStyle(color: Colors.white70, fontSize: 11)),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: Colors.white),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                ),

                // Caption
                if (story.caption != null && story.caption!.isNotEmpty)
                  Positioned(
                    bottom: 80,
                    left: 16,
                    right: 16,
                    child: Text(
                      story.caption!,
                      style: const TextStyle(color: Colors.white, fontSize: 15, height: 1.3),
                      textAlign: TextAlign.center,
                    ),
                  ),

                // Bottom bar
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      child: Row(
                        children: [
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(24),
                                border: Border.all(color: Colors.white30),
                              ),
                              child: const Text('Reply...', style: TextStyle(color: Colors.white54, fontSize: 14)),
                            ),
                          ),
                          const SizedBox(width: 12),
                          GestureDetector(onTap: () {}, child: const Icon(Icons.favorite_border, color: Colors.white, size: 26)),
                          const SizedBox(width: 12),
                          GestureDetector(onTap: () {}, child: const Icon(Icons.share_outlined, color: Colors.white, size: 26)),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  String _timeAgo(String dateStr) {
    final date = DateTime.tryParse(dateStr);
    if (date == null) return '';
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  @override
  void dispose() {
    _pageController.dispose();
    _progressController.dispose();
    super.dispose();
  }
}
