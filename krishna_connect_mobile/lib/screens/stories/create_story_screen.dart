import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import '../../config/theme.dart';
import '../../providers/app_provider.dart';

class CreateStoryScreen extends StatefulWidget {
  const CreateStoryScreen({super.key});
  @override
  State<CreateStoryScreen> createState() => _CreateStoryScreenState();
}

class _CreateStoryScreenState extends State<CreateStoryScreen> {
  final _captionController = TextEditingController();
  XFile? _selectedMedia;
  String _mediaType = 'image';
  bool _isUploading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
        title: const Text('Create Story'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: ElevatedButton(
              onPressed: _selectedMedia == null || _isUploading ? null : _publishStory,
              child: _isUploading
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Share'),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: _selectedMedia != null
                ? Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.asset(_selectedMedia!.path, fit: BoxFit.contain, errorBuilder: (_, __, ___) => const Center(child: Icon(Icons.image, size: 48, color: AppTheme.textMuted))),
                      Positioned(
                        bottom: 0,
                        left: 0,
                        right: 0,
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.bottomCenter,
                              end: Alignment.topCenter,
                              colors: [Colors.black54, Colors.transparent],
                            ),
                          ),
                          child: TextField(
                            controller: _captionController,
                            style: const TextStyle(color: Colors.white),
                            decoration: const InputDecoration(
                              hintText: 'Add a caption...',
                              hintStyle: TextStyle(color: Colors.white60),
                              border: InputBorder.none,
                              filled: false,
                            ),
                          ),
                        ),
                      ),
                    ],
                  )
                : Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: AppTheme.cardDark,
                            shape: BoxShape.circle,
                            border: Border.all(color: AppTheme.borderDark),
                          ),
                          child: const Icon(Icons.add_photo_alternate, size: 48, color: AppTheme.primaryColor),
                        ),
                        const SizedBox(height: 16),
                        const Text('Add to your story', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 8),
                        const Text('Share a photo or video with your followers', style: TextStyle(color: AppTheme.textMuted, fontSize: 14)),
                        const SizedBox(height: 24),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            _mediaButton(Icons.photo_library, 'Gallery', () => _pickMedia(ImageSource.gallery)),
                            const SizedBox(width: 20),
                            _mediaButton(Icons.camera_alt, 'Camera', () => _pickMedia(ImageSource.camera)),
                          ],
                        ),
                      ],
                    ),
                  ),
          ),
          if (_selectedMedia == null)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.cardDark,
                border: Border(top: BorderSide(color: AppTheme.borderDark)),
              ),
              child: SafeArea(
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _pickMedia(ImageSource.gallery),
                        icon: const Icon(Icons.photo_library),
                        label: const Text('Gallery'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _pickMedia(ImageSource.camera),
                        icon: const Icon(Icons.camera_alt),
                        label: const Text('Camera'),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _mediaButton(IconData icon, String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AppTheme.primaryColor, size: 28),
          ),
          const SizedBox(height: 8),
          Text(label, style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
        ],
      ),
    );
  }

  Future<void> _pickMedia(ImageSource source) async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: source, maxWidth: 1080, imageQuality: 85);
    if (file != null) {
      setState(() {
        _selectedMedia = file;
        _mediaType = 'image';
      });
    }
  }

  Future<void> _publishStory() async {
    if (_selectedMedia == null) return;
    setState(() => _isUploading = true);

    try {
      final bytes = await _selectedMedia!.readAsBytes();
      final storyService = context.read<AppProvider>().storyService;
      final url = await storyService.uploadStoryMedia(bytes, 'image/jpeg');
      await storyService.createStory(
        mediaUrl: url,
        mediaType: _mediaType,
        caption: _captionController.text.trim().isNotEmpty ? _captionController.text.trim() : null,
      );
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Story shared!')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
    setState(() => _isUploading = false);
  }

  @override
  void dispose() {
    _captionController.dispose();
    super.dispose();
  }
}
