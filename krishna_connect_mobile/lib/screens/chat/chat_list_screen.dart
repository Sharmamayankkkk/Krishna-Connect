import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../config/theme.dart';
import '../../providers/app_provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/chat_model.dart';
import '../../widgets/user_avatar.dart';

class ChatListScreen extends StatefulWidget {
  const ChatListScreen({super.key});
  @override
  State<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends State<ChatListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().loadChats();
    });
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppProvider>();
    final userId = context.read<AuthProvider>().userId ?? '';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Chats'),
        actions: [
          IconButton(icon: const Icon(Icons.search), onPressed: () => context.push('/search')),
          IconButton(icon: const Icon(Icons.group_add_outlined), onPressed: () => _showNewChatSheet(context)),
        ],
      ),
      body: app.isChatsLoading
          ? const Center(child: CircularProgressIndicator())
          : app.chats.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: () => app.loadChats(),
                  child: ListView.builder(
                    itemCount: app.chats.length,
                    itemBuilder: (context, index) => _buildChatTile(context, app.chats[index], userId),
                  ),
                ),
    );
  }

  Widget _buildChatTile(BuildContext context, ChatModel chat, String userId) {
    final name = chat.getChatName(userId);
    final avatar = chat.getChatAvatar(userId);
    final lastMsg = chat.messages.isNotEmpty ? chat.messages.first : null;
    final lastMsgText = lastMsg?.content ?? (lastMsg?.hasAttachment == true ? 'Attachment' : '');
    final timeStr = lastMsg != null
        ? timeago.format(DateTime.tryParse(lastMsg.createdAt) ?? DateTime.now(), locale: 'en_short')
        : '';

    return ListTile(
      onTap: () => context.push('/chat/${chat.id}'),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: UserAvatar(
        imageUrl: avatar,
        size: 48,
        fallbackName: name,
        showBorder: chat.isGroup,
        borderColor: chat.isGroup ? AppTheme.accentColor : null,
      ),
      title: Row(
        children: [
          Expanded(
            child: Text(name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15), overflow: TextOverflow.ellipsis),
          ),
          Text(timeStr, style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
        ],
      ),
      subtitle: Row(
        children: [
          if (chat.isGroup && lastMsg != null) ...[
            Text('${lastMsg.sender?.displayName ?? "Someone"}: ', style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13, fontWeight: FontWeight.w500)),
          ],
          Expanded(
            child: Text(
              lastMsgText,
              style: TextStyle(
                color: chat.unreadCount > 0 ? AppTheme.textPrimary : AppTheme.textMuted,
                fontSize: 13,
                fontWeight: chat.unreadCount > 0 ? FontWeight.w500 : FontWeight.w400,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (chat.unreadCount > 0)
            Container(
              margin: const EdgeInsets.only(left: 8),
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(color: AppTheme.primaryColor, borderRadius: BorderRadius.circular(10)),
              child: Text('${chat.unreadCount}', style: const TextStyle(color: Colors.black, fontSize: 11, fontWeight: FontWeight.w600)),
            ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.chat_bubble_outline, size: 64, color: AppTheme.textMuted.withValues(alpha: 0.5)),
          const SizedBox(height: 16),
          const Text('No conversations yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
          const SizedBox(height: 6),
          const Text('Start a chat with someone!', style: TextStyle(color: AppTheme.textMuted)),
        ],
      ),
    );
  }

  void _showNewChatSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(leading: const Icon(Icons.person_add), title: const Text('New Direct Message'), onTap: () => Navigator.pop(context)),
            ListTile(leading: const Icon(Icons.group_add), title: const Text('New Group Chat'), onTap: () => Navigator.pop(context)),
          ],
        ),
      ),
    );
  }
}
