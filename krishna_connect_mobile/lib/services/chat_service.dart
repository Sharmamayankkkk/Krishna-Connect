import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/chat_model.dart';

class ChatService {
  final SupabaseClient _client;

  ChatService(this._client);

  String? get _userId => _client.auth.currentUser?.id;

  Future<List<ChatModel>> getChats() async {
    final data = await _client
        .from('chats')
        .select('''
          *,
          participants!inner(*, profiles(*)),
          messages(*, profiles(*))
        ''')
        .order('created_at', referencedTable: 'messages', ascending: false);
    
    // Filter chats where current user is a participant
    final chats = (data as List)
        .map((c) => ChatModel.fromJson(Map<String, dynamic>.from(c)))
        .where((c) => c.participants.any((p) => p.user.id == _userId))
        .toList();

    // Sort by last message
    chats.sort((a, b) {
      final aTime = a.messages.isNotEmpty ? a.messages.first.createdAt : a.createdAt;
      final bTime = b.messages.isNotEmpty ? b.messages.first.createdAt : b.createdAt;
      return bTime.compareTo(aTime);
    });

    return chats;
  }

  Future<ChatModel?> getChat(int chatId) async {
    final data = await _client
        .from('chats')
        .select('*, participants(*, profiles(*)), messages(*, profiles(*))')
        .eq('id', chatId)
        .maybeSingle();
    if (data == null) return null;
    return ChatModel.fromJson(data);
  }

  Future<List<MessageModel>> getMessages(int chatId, {int limit = 50, int offset = 0}) async {
    final data = await _client
        .from('messages')
        .select('*, profiles(*)')
        .eq('chat_id', chatId)
        .order('created_at', ascending: false)
        .range(offset, offset + limit - 1);
    
    return (data as List)
        .map((m) => MessageModel.fromJson(Map<String, dynamic>.from(m)))
        .toList();
  }

  Future<MessageModel> sendMessage(int chatId, {String? content, String? attachmentUrl, Map<String, dynamic>? attachmentMetadata, String? replyToMessageId}) async {
    final data = await _client.from('messages').insert({
      'chat_id': chatId,
      'user_id': _userId,
      'content': content,
      if (attachmentUrl != null) 'attachment_url': attachmentUrl,
      if (attachmentMetadata != null) 'attachment_metadata': attachmentMetadata,
      if (replyToMessageId != null) 'reply_to_message_id': int.parse(replyToMessageId),
    }).select('*, profiles(*)').single();

    return MessageModel.fromJson(data);
  }

  Future<void> editMessage(String messageId, String content) async {
    await _client.from('messages').update({
      'content': content,
      'is_edited': true,
    }).eq('id', int.parse(messageId));
  }

  Future<void> deleteMessage(String messageId) async {
    await _client.from('messages').update({
      'deleted_for': [_userId],
    }).eq('id', int.parse(messageId));
  }

  Future<void> toggleReaction(String messageId, String emoji) async {
    final msg = await _client.from('messages').select('reactions').eq('id', int.parse(messageId)).single();
    final reactions = Map<String, List<dynamic>>.from(msg['reactions'] ?? {});
    
    final emojiReactions = reactions[emoji];
    if (emojiReactions != null && emojiReactions.contains(_userId)) {
      emojiReactions.remove(_userId);
      if (emojiReactions.isEmpty) reactions.remove(emoji);
    } else {
      reactions[emoji] = [...(emojiReactions ?? []), _userId!];
    }

    await _client.from('messages').update({'reactions': reactions}).eq('id', int.parse(messageId));
  }

  Future<void> toggleStarMessage(String messageId) async {
    final msg = await _client.from('messages').select('starred_by, is_starred').eq('id', int.parse(messageId)).single();
    final starredBy = List<String>.from(msg['starred_by'] ?? []);
    
    if (starredBy.contains(_userId)) {
      starredBy.remove(_userId);
    } else {
      starredBy.add(_userId!);
    }

    await _client.from('messages').update({
      'starred_by': starredBy,
      'is_starred': starredBy.isNotEmpty,
    }).eq('id', int.parse(messageId));
  }

  Future<void> markAsRead(int chatId) async {
    // Mark all unread messages in chat as read
    final messages = await _client
        .from('messages')
        .select('id, read_by')
        .eq('chat_id', chatId)
        .not('user_id', 'eq', _userId!);

    for (final msg in messages) {
      final readBy = List<String>.from(msg['read_by'] ?? []);
      if (!readBy.contains(_userId)) {
        readBy.add(_userId!);
        await _client.from('messages').update({'read_by': readBy}).eq('id', msg['id']);
      }
    }
  }

  // Create DM
  Future<ChatModel> createDM(String otherUserId) async {
    // Check if DM already exists
    final existing = await _client
        .from('chats')
        .select('*, participants(*, profiles(*))')
        .eq('type', 'dm');

    for (final chat in existing) {
      final participants = (chat['participants'] as List);
      if (participants.length == 2 &&
          participants.any((p) => p['user_id'] == _userId) &&
          participants.any((p) => p['user_id'] == otherUserId)) {
        return ChatModel.fromJson(Map<String, dynamic>.from(chat));
      }
    }

    // Create new DM
    final chatData = await _client.from('chats').insert({
      'type': 'dm',
      'created_by': _userId,
    }).select().single();

    final chatId = chatData['id'];

    // Add participants
    await _client.from('participants').insert([
      {'chat_id': chatId, 'user_id': _userId},
      {'chat_id': chatId, 'user_id': otherUserId},
    ]);

    return ChatModel.fromJson({...chatData, 'participants': [], 'messages': []});
  }

  // Create group
  Future<ChatModel> createGroup(String name, List<String> memberIds, {String? description, String? avatarUrl}) async {
    final chatData = await _client.from('chats').insert({
      'type': 'group',
      'name': name,
      'description': description,
      'avatar_url': avatarUrl,
      'created_by': _userId,
    }).select().single();

    final chatId = chatData['id'];
    final allMembers = [_userId!, ...memberIds];

    await _client.from('participants').insert(
      allMembers.map((id) => {
        'chat_id': chatId,
        'user_id': id,
        'is_admin': id == _userId,
      }).toList(),
    );

    return ChatModel.fromJson({...chatData, 'participants': [], 'messages': []});
  }

  // Realtime subscription
  RealtimeChannel subscribeToMessages(int chatId, void Function(MessageModel) onMessage) {
    return _client
        .channel('messages:$chatId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'messages',
          filter: PostgresChangeFilter(type: PostgresChangeFilterType.eq, column: 'chat_id', value: chatId),
          callback: (payload) {
            final msg = MessageModel.fromJson(Map<String, dynamic>.from(payload.newRecord));
            onMessage(msg);
          },
        )
        .subscribe();
  }

  // Upload attachment
  Future<String> uploadAttachment(String fileName, List<int> bytes, String mimeType) async {
    final path = '${_userId}_${DateTime.now().millisecondsSinceEpoch}_$fileName';
    await _client.storage.from('chat-attachments').uploadBinary(
      path,
      bytes as dynamic,
      fileOptions: FileOptions(contentType: mimeType),
    );
    return _client.storage.from('chat-attachments').getPublicUrl(path);
  }
}
