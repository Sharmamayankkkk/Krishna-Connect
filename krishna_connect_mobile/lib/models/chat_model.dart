import 'user_model.dart';

class MessageModel {
  final String id;
  final String createdAt;
  final int chatId;
  final String userId;
  final String? content;
  final UserModel? sender;
  final String? attachmentUrl;
  final Map<String, dynamic>? attachmentMetadata;
  final bool isEdited;
  final Map<String, List<String>>? reactions;
  final List<String> readBy;
  final List<String>? deletedFor;
  final bool isStarred;
  final List<String> starredBy;
  final bool isPinned;
  final String? replyToMessageId;
  final MessageModel? repliedToMessage;

  MessageModel({
    required this.id,
    required this.createdAt,
    required this.chatId,
    required this.userId,
    this.content,
    this.sender,
    this.attachmentUrl,
    this.attachmentMetadata,
    this.isEdited = false,
    this.reactions,
    this.readBy = const [],
    this.deletedFor,
    this.isStarred = false,
    this.starredBy = const [],
    this.isPinned = false,
    this.replyToMessageId,
    this.repliedToMessage,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    return MessageModel(
      id: (json['id'] ?? '').toString(),
      createdAt: json['created_at'] ?? DateTime.now().toIso8601String(),
      chatId: json['chat_id'] ?? 0,
      userId: json['user_id'] ?? '',
      content: json['content'],
      sender: json['profiles'] != null 
          ? UserModel.fromJson(Map<String, dynamic>.from(json['profiles'])) 
          : null,
      attachmentUrl: json['attachment_url'],
      attachmentMetadata: json['attachment_metadata'] is Map 
          ? Map<String, dynamic>.from(json['attachment_metadata']) 
          : null,
      isEdited: json['is_edited'] ?? false,
      reactions: json['reactions'] is Map 
          ? (json['reactions'] as Map).map((k, v) => MapEntry(k.toString(), List<String>.from(v ?? []))) 
          : null,
      readBy: List<String>.from(json['read_by'] ?? []),
      deletedFor: json['deleted_for'] != null ? List<String>.from(json['deleted_for']) : null,
      isStarred: json['is_starred'] ?? false,
      starredBy: List<String>.from(json['starred_by'] ?? []),
      isPinned: json['is_pinned'] ?? false,
      replyToMessageId: json['reply_to_message_id']?.toString(),
    );
  }

  bool get hasAttachment => attachmentUrl != null && attachmentUrl!.isNotEmpty;
  
  String get attachmentType {
    if (attachmentMetadata == null) return 'file';
    return attachmentMetadata!['type'] ?? 'file';
  }

  String get attachmentName {
    if (attachmentMetadata == null) return 'File';
    return attachmentMetadata!['name'] ?? 'File';
  }

  bool get isVoiceNote => attachmentType.contains('audio') || attachmentType == 'voice_note';
  bool get isImage => attachmentType.contains('image');
  bool get isVideo => attachmentType.contains('video');
}

class ParticipantModel {
  final String oderId;
  final int chatId;
  final bool isAdmin;
  final UserModel user;
  final String? tag;

  ParticipantModel({
    required this.oderId,
    required this.chatId,
    this.isAdmin = false,
    required this.user,
    this.tag,
  });

  factory ParticipantModel.fromJson(Map<String, dynamic> json) {
    return ParticipantModel(
      oderId: json['user_id'] ?? '',
      chatId: json['chat_id'] ?? 0,
      isAdmin: json['is_admin'] ?? false,
      user: UserModel.fromJson(Map<String, dynamic>.from(json['profiles'] ?? {})),
      tag: json['tag'],
    );
  }
}

class ChatModel {
  final int id;
  final String createdAt;
  final String type; // dm, group
  final String? name;
  final String? avatarUrl;
  final String? createdBy;
  final String? description;
  final List<ParticipantModel> participants;
  final List<MessageModel> messages;
  final bool isPublic;
  final bool historyVisible;
  final String? inviteCode;
  int unreadCount;
  String? lastMessageContent;
  String? lastMessageTimestamp;

  ChatModel({
    required this.id,
    required this.createdAt,
    required this.type,
    this.name,
    this.avatarUrl,
    this.createdBy,
    this.description,
    this.participants = const [],
    this.messages = const [],
    this.isPublic = true,
    this.historyVisible = true,
    this.inviteCode,
    this.unreadCount = 0,
    this.lastMessageContent,
    this.lastMessageTimestamp,
  });

  factory ChatModel.fromJson(Map<String, dynamic> json) {
    return ChatModel(
      id: json['id'] ?? 0,
      createdAt: json['created_at'] ?? DateTime.now().toIso8601String(),
      type: json['type'] ?? 'dm',
      name: json['name'],
      avatarUrl: json['avatar_url'],
      createdBy: json['created_by'],
      description: json['description'],
      participants: (json['participants'] as List?)
          ?.map((p) => ParticipantModel.fromJson(Map<String, dynamic>.from(p)))
          .toList() ?? [],
      messages: (json['messages'] as List?)
          ?.map((m) => MessageModel.fromJson(Map<String, dynamic>.from(m)))
          .toList() ?? [],
      isPublic: json['is_public'] ?? true,
      historyVisible: json['history_visible'] ?? true,
      inviteCode: json['invite_code'],
    );
  }

  bool get isDM => type == 'dm';
  bool get isGroup => type == 'group';

  UserModel? getOtherUser(String currentUserId) {
    if (!isDM) return null;
    final other = participants.where((p) => p.user.id != currentUserId);
    return other.isNotEmpty ? other.first.user : null;
  }

  String getChatName(String currentUserId) {
    if (isGroup) return name ?? 'Group';
    final other = getOtherUser(currentUserId);
    return other?.displayName ?? 'Chat';
  }

  String? getChatAvatar(String currentUserId) {
    if (isGroup) return avatarUrl;
    return getOtherUser(currentUserId)?.avatarUrl;
  }
}
