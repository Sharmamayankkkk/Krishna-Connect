import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:video_player/video_player.dart';
import '../../config/theme.dart';
import '../../providers/app_provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/models.dart';
import '../../widgets/user_avatar.dart';

class LeelaScreen extends StatefulWidget {
  const LeelaScreen({super.key});
  @override
  State<LeelaScreen> createState() => _LeelaScreenState();
}

class _LeelaScreenState extends State<LeelaScreen> {
  final PageController _pageController = PageController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().loadLeelaVideos(refresh: true);
    });
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppProvider>();
    final videos = app.leelaVideos;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('Leela', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 22)),
        actions: [
          IconButton(icon: const Icon(Icons.camera_alt_outlined), onPressed: () {}),
        ],
      ),
      body: videos.isEmpty
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.play_circle_outline, size: 64, color: AppTheme.textMuted),
                  SizedBox(height: 16),
                  Text('No videos yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
                  SizedBox(height: 6),
                  Text('Short videos will appear here', style: TextStyle(color: AppTheme.textMuted)),
                ],
              ),
            )
          : PageView.builder(
              controller: _pageController,
              scrollDirection: Axis.vertical,
              itemCount: videos.length,
              onPageChanged: (index) {
                if (index >= videos.length - 3) {
                  app.loadLeelaVideos();
                }
              },
              itemBuilder: (context, index) {
                return _LeelaVideoCard(video: videos[index]);
              },
            ),
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }
}

class _LeelaVideoCard extends StatefulWidget {
  final LeelaVideo video;
  const _LeelaVideoCard({required this.video});
  @override
  State<_LeelaVideoCard> createState() => _LeelaVideoCardState();
}

class _LeelaVideoCardState extends State<_LeelaVideoCard> {
  VideoPlayerController? _controller;
  bool _isInitialized = false;
  bool _isPlaying = true;

  @override
  void initState() {
    super.initState();
    _initVideo();
  }

  Future<void> _initVideo() async {
    try {
      _controller = VideoPlayerController.networkUrl(Uri.parse(widget.video.videoUrl));
      await _controller!.initialize();
      _controller!.setLooping(true);
      _controller!.play();
      if (mounted) setState(() => _isInitialized = true);
    } catch (e) {
      debugPrint('Video init error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final userId = context.read<AuthProvider>().userId ?? '';

    return GestureDetector(
      onTap: () {
        if (_controller != null) {
          if (_isPlaying) {
            _controller!.pause();
          } else {
            _controller!.play();
          }
          setState(() => _isPlaying = !_isPlaying);
        }
      },
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Video
          if (_isInitialized && _controller != null)
            FittedBox(
              fit: BoxFit.cover,
              child: SizedBox(
                width: _controller!.value.size.width,
                height: _controller!.value.size.height,
                child: VideoPlayer(_controller!),
              ),
            )
          else
            Container(
              color: Colors.black,
              child: widget.video.thumbnailUrl != null
                  ? Image.network(widget.video.thumbnailUrl!, fit: BoxFit.cover)
                  : const Center(child: CircularProgressIndicator()),
            ),

          // Play/Pause indicator
          if (!_isPlaying)
            const Center(
              child: Icon(Icons.play_arrow_rounded, size: 80, color: Colors.white54),
            ),

          // Gradient overlay
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            height: 200,
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [Colors.black87, Colors.transparent],
                ),
              ),
            ),
          ),

          // Right side actions
          Positioned(
            right: 12,
            bottom: 120,
            child: Column(
              children: [
                _buildActionButton(
                  icon: widget.video.isLiked ? Icons.favorite : Icons.favorite_border,
                  label: _formatCount(widget.video.likeCount),
                  color: widget.video.isLiked ? Colors.red : Colors.white,
                  onTap: () {
                    final app = context.read<AppProvider>();
                    if (widget.video.isLiked) {
                      app.leelaService.unlikeVideo(widget.video.id);
                    } else {
                      app.leelaService.likeVideo(widget.video.id);
                    }
                  },
                ),
                const SizedBox(height: 20),
                _buildActionButton(
                  icon: Icons.chat_bubble_outline,
                  label: _formatCount(widget.video.commentCount),
                  onTap: () {},
                ),
                const SizedBox(height: 20),
                _buildActionButton(
                  icon: widget.video.isBookmarked ? Icons.bookmark : Icons.bookmark_border,
                  label: 'Save',
                  color: widget.video.isBookmarked ? AppTheme.primaryColor : Colors.white,
                  onTap: () {},
                ),
                const SizedBox(height: 20),
                _buildActionButton(
                  icon: Icons.share_outlined,
                  label: 'Share',
                  onTap: () {},
                ),
              ],
            ),
          ),

          // Bottom info
          Positioned(
            left: 12,
            right: 72,
            bottom: 24,
            child: SafeArea(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      UserAvatar(
                        imageUrl: widget.video.user?.avatarUrlOrDefault,
                        size: 36,
                        fallbackName: widget.video.user?.displayName,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.video.user?.displayName ?? 'Unknown',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14),
                            ),
                            if (widget.video.user?.username != null)
                              Text(
                                '@${widget.video.user?.username ?? ''}',
                                style: const TextStyle(color: Colors.white70, fontSize: 12),
                              ),
                          ],
                        ),
                      ),
                      OutlinedButton(
                        onPressed: () {},
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Colors.white54),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        ),
                        child: const Text('Follow', style: TextStyle(color: Colors.white, fontSize: 12)),
                      ),
                    ],
                  ),
                  if (widget.video.caption != null && widget.video.caption!.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      widget.video.caption!,
                      style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.3),
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  if (widget.video.audioName != null) ...[
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.music_note, size: 14, color: Colors.white70),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            widget.video.audioName!,
                            style: const TextStyle(color: Colors.white70, fontSize: 12),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    Color color = Colors.white,
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Icon(icon, size: 30, color: color),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  String _formatCount(int count) {
    if (count >= 1000000) return '${(count / 1000000).toStringAsFixed(1)}M';
    if (count >= 1000) return '${(count / 1000).toStringAsFixed(1)}K';
    return count.toString();
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }
}
