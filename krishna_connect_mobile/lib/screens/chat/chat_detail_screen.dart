import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/app_provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/chat_model.dart';
import '../../widgets/message_bubble.dart';
import '../../widgets/user_avatar.dart';

class ChatDetailScreen extends StatefulWidget {
  final int chatId;
  const ChatDetailScreen({super.key, required this.chatId});
  @override
  State<ChatDetailScreen> createState() => _ChatDetailScreenState();
}

class _ChatDetailScreenState extends State<ChatDetailScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  List<MessageModel> _messages = [];
  ChatModel? _chat;
  bool _isLoading = true;
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    _loadChat();
  }

  Future<void> _loadChat() async {
    final chatService = context.read<AppProvider>().chatService;
    final chat = await chatService.getChat(widget.chatId);
    final messages = await chatService.getMessages(widget.chatId);
    setState(() { _chat = chat; _messages = messages; _isLoading = false; });
    
    // Subscribe to realtime
    chatService.subscribeToMessages(widget.chatId, (msg) {
      setState(() => _messages.insert(0, msg));
    });

    // Mark as read
    chatService.markAsRead(widget.chatId);
  }

  @override
  Widget build(BuildContext context) {
    final userId = context.read<AuthProvider>().userId ?? '';
    final chatName = _chat?.getChatName(userId) ?? 'Chat';
    final chatAvatar = _chat?.getChatAvatar(userId);

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Row(
          children: [
            UserAvatar(imageUrl: chatAvatar, size: 34, fallbackName: chatName),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(chatName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  if (_chat?.isGroup == true)
                    Text('${_chat!.participants.length} members', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(icon: const Icon(Icons.phone_outlined), onPressed: () {}),
          IconButton(icon: const Icon(Icons.videocam_outlined), onPressed: () {}),
          IconButton(icon: const Icon(Icons.more_vert), onPressed: () => _showChatOptions()),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _messages.isEmpty
                    ? const Center(child: Text('No messages yet. Say hello!', style: TextStyle(color: AppTheme.textMuted)))
                    : ListView.builder(
                        controller: _scrollController,
                        reverse: true,
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          final msg = _messages[index];
                          final isMe = msg.userId == userId;
                          final showAvatar = index == _messages.length - 1 ||
                              _messages[index + 1].userId != msg.userId;
                          
                          return MessageBubble(
                            message: msg,
                            isMe: isMe,
                            showAvatar: showAvatar,
                            onLongPress: () => _showMessageOptions(msg),
                          );
                        },
                      ),
          ),
          // Input bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            decoration: BoxDecoration(
              color: AppTheme.cardDark,
              border: Border(top: BorderSide(color: AppTheme.borderDark)),
            ),
            child: SafeArea(
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.add_circle_outline, color: AppTheme.textMuted),
                    onPressed: () => _showAttachmentSheet(),
                  ),
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppTheme.cardDarkElevated,
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _messageController,
                              maxLines: 4,
                              minLines: 1,
                              decoration: const InputDecoration(
                                hintText: 'Type a message...',
                                border: InputBorder.none,
                                filled: false,
                                contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                              ),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.emoji_emotions_outlined, color: AppTheme.textMuted, size: 22),
                            onPressed: () {},
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                  Container(
                    decoration: const BoxDecoration(shape: BoxShape.circle, color: AppTheme.primaryColor),
                    child: IconButton(
                      icon: Icon(_isSending ? Icons.hourglass_empty : Icons.send, color: Colors.black, size: 20),
                      onPressed: _isSending ? null : _sendMessage,
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

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;
    
    setState(() => _isSending = true);
    _messageController.clear();

    try {
      final msg = await context.read<AppProvider>().chatService.sendMessage(widget.chatId, content: text);
      setState(() {
        _messages.insert(0, msg);
        _isSending = false;
      });
    } catch (e) {
      setState(() => _isSending = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  void _showChatOptions() {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(leading: const Icon(Icons.search), title: const Text('Search in chat'), onTap: () => Navigator.pop(ctx)),
            ListTile(leading: const Icon(Icons.image_outlined), title: const Text('Media & files'), onTap: () => Navigator.pop(ctx)),
            ListTile(leading: const Icon(Icons.star_outline), title: const Text('Starred messages'), onTap: () => Navigator.pop(ctx)),
            if (_chat?.isGroup == true) ...[
              ListTile(leading: const Icon(Icons.people_outline), title: const Text('Group members'), onTap: () => Navigator.pop(ctx)),
              ListTile(leading: const Icon(Icons.exit_to_app), title: const Text('Leave group'), onTap: () => Navigator.pop(ctx)),
            ],
            ListTile(leading: const Icon(Icons.block, color: AppTheme.errorColor), title: const Text('Block', style: TextStyle(color: AppTheme.errorColor)), onTap: () => Navigator.pop(ctx)),
          ],
        ),
      ),
    );
  }

  void _showMessageOptions(MessageModel msg) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(leading: const Icon(Icons.reply), title: const Text('Reply'), onTap: () => Navigator.pop(ctx)),
            ListTile(leading: const Icon(Icons.content_copy), title: const Text('Copy'), onTap: () => Navigator.pop(ctx)),
            ListTile(leading: const Icon(Icons.forward), title: const Text('Forward'), onTap: () => Navigator.pop(ctx)),
            ListTile(leading: const Icon(Icons.star_outline), title: const Text('Star'), onTap: () => Navigator.pop(ctx)),
            ListTile(leading: const Icon(Icons.delete_outline, color: AppTheme.errorColor), title: const Text('Delete', style: TextStyle(color: AppTheme.errorColor)), onTap: () => Navigator.pop(ctx)),
          ],
        ),
      ),
    );
  }

  void _showAttachmentSheet() {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(20),
        child: Wrap(
          spacing: 20,
          runSpacing: 20,
          alignment: WrapAlignment.center,
          children: [
            _attachOption(Icons.image, 'Gallery', AppTheme.successColor),
            _attachOption(Icons.camera_alt, 'Camera', AppTheme.primaryColor),
            _attachOption(Icons.insert_drive_file, 'Document', AppTheme.verifiedColor),
            _attachOption(Icons.mic, 'Voice Note', AppTheme.errorColor),
            _attachOption(Icons.gif_box, 'GIF', AppTheme.accentColor),
            _attachOption(Icons.location_on, 'Location', AppTheme.warningColor),
          ],
        ),
      ),
    );
  }

  Widget _attachOption(IconData icon, String label, Color color) {
    return GestureDetector(
      onTap: () => Navigator.pop(context),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 56, height: 56,
            decoration: BoxDecoration(color: color.withValues(alpha: 0.15), shape: BoxShape.circle),
            child: Icon(icon, color: color, size: 26),
          ),
          const SizedBox(height: 6),
          Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
        ],
      ),
    );
  }
}
