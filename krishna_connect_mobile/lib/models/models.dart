import 'user_model.dart';

class EventModel {
  final int id;
  final String createdAt;
  final String creatorId;
  final String title;
  final String? description;
  final String? thumbnail;
  final String dateTime;
  final String? meetLink;
  final bool isDeleted;
  final UserModel? creator;
  final List<EventRSVP> rsvps;

  EventModel({
    required this.id,
    required this.createdAt,
    required this.creatorId,
    required this.title,
    this.description,
    this.thumbnail,
    required this.dateTime,
    this.meetLink,
    this.isDeleted = false,
    this.creator,
    this.rsvps = const [],
  });

  factory EventModel.fromJson(Map<String, dynamic> json) {
    return EventModel(
      id: json['id'] ?? 0,
      createdAt: json['created_at'] ?? '',
      creatorId: json['creator_id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      thumbnail: json['thumbnail'],
      dateTime: json['date_time'] ?? '',
      meetLink: json['meet_link'],
      isDeleted: json['is_deleted'] ?? false,
      creator: json['profiles'] != null 
          ? UserModel.fromJson(Map<String, dynamic>.from(json['profiles'])) 
          : null,
      rsvps: (json['event_rsvps'] as List?)
          ?.map((r) => EventRSVP.fromJson(Map<String, dynamic>.from(r)))
          .toList() ?? [],
    );
  }

  int get goingCount => rsvps.where((r) => r.status == 'going').length;
  int get interestedCount => rsvps.where((r) => r.status == 'interested').length;
}

class EventRSVP {
  final int eventId;
  final String oderId;
  final String status;
  final UserModel? user;

  EventRSVP({
    required this.eventId,
    required this.oderId,
    required this.status,
    this.user,
  });

  factory EventRSVP.fromJson(Map<String, dynamic> json) {
    return EventRSVP(
      eventId: json['event_id'] ?? 0,
      oderId: json['user_id'] ?? '',
      status: json['status'] ?? 'interested',
      user: json['profiles'] != null 
          ? UserModel.fromJson(Map<String, dynamic>.from(json['profiles'])) 
          : null,
    );
  }
}

class NotificationModel {
  final String id;
  final String userId;
  final String actorId;
  final String type;
  final int? entityId;
  final String? entityType;
  final bool isRead;
  final String createdAt;
  final UserModel? actor;

  NotificationModel({
    required this.id,
    required this.userId,
    required this.actorId,
    required this.type,
    this.entityId,
    this.entityType,
    this.isRead = false,
    required this.createdAt,
    this.actor,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: (json['id'] ?? '').toString(),
      userId: json['user_id'] ?? '',
      actorId: json['actor_id'] ?? '',
      type: json['type'] ?? '',
      entityId: json['entity_id'],
      entityType: json['entity_type'],
      isRead: json['is_read'] ?? false,
      createdAt: json['created_at'] ?? '',
      actor: json['actor'] != null 
          ? UserModel.fromJson(Map<String, dynamic>.from(json['actor'])) 
          : null,
    );
  }

  String get displayType {
    switch (type) {
      case 'new_follower': return 'started following you';
      case 'follow_request': return 'sent you a follow request';
      case 'new_like': return 'liked your post';
      case 'new_comment': return 'commented on your post';
      case 'new_repost': return 'reposted your post';
      case 'mention': return 'mentioned you';
      case 'collaboration_request': return 'wants to collaborate';
      case 'call_missed': return 'missed call';
      case 'call_incoming': return 'is calling you';
      case 'event_rsvp': return 'responded to your event';
      case 'challenge_joined': return 'joined your challenge';
      case 'story_reaction': return 'reacted to your story';
      default: return type.replaceAll('_', ' ');
    }
  }
}

class StoryModel {
  final String id;
  final String userId;
  final String mediaUrl;
  final String mediaType;
  final String? caption;
  final String? visibility;
  final String createdAt;
  final String expiresAt;
  final UserModel? user;
  final int viewCount;
  final List<StoryReaction> reactions;

  StoryModel({
    required this.id,
    required this.userId,
    required this.mediaUrl,
    this.mediaType = 'image',
    this.caption,
    this.visibility,
    required this.createdAt,
    required this.expiresAt,
    this.user,
    this.viewCount = 0,
    this.reactions = const [],
  });

  factory StoryModel.fromJson(Map<String, dynamic> json) {
    return StoryModel(
      id: (json['id'] ?? '').toString(),
      userId: json['user_id'] ?? '',
      mediaUrl: json['media_url'] ?? '',
      mediaType: json['media_type'] ?? 'image',
      caption: json['caption'],
      visibility: json['visibility'],
      createdAt: json['created_at'] ?? '',
      expiresAt: json['expires_at'] ?? '',
      user: json['profiles'] != null 
          ? UserModel.fromJson(Map<String, dynamic>.from(json['profiles'])) 
          : null,
    );
  }

  bool get isExpired => DateTime.tryParse(expiresAt)?.isBefore(DateTime.now()) ?? false;
}

class StoryReaction {
  final String userId;
  final String emoji;

  StoryReaction({required this.userId, required this.emoji});

  factory StoryReaction.fromJson(Map<String, dynamic> json) {
    return StoryReaction(
      userId: json['user_id'] ?? '',
      emoji: json['emoji'] ?? '',
    );
  }
}

class ChallengeModel {
  final int id;
  final String createdBy;
  final String title;
  final String? description;
  final String? coverImage;
  final String? rules;
  final String? prizeDescription;
  final String? category;
  final int? maxParticipants;
  final bool requiresProof;
  final bool isFeatured;
  final bool isActive;
  final String? startDate;
  final String? endDate;
  final String? winnerId;
  final String createdAt;
  final UserModel? creator;
  final int participantCount;

  ChallengeModel({
    required this.id,
    required this.createdBy,
    required this.title,
    this.description,
    this.coverImage,
    this.rules,
    this.prizeDescription,
    this.category,
    this.maxParticipants,
    this.requiresProof = true,
    this.isFeatured = false,
    this.isActive = true,
    this.startDate,
    this.endDate,
    this.winnerId,
    required this.createdAt,
    this.creator,
    this.participantCount = 0,
  });

  factory ChallengeModel.fromJson(Map<String, dynamic> json) {
    return ChallengeModel(
      id: json['id'] ?? 0,
      createdBy: json['created_by'] ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      coverImage: json['cover_image'],
      rules: json['rules'],
      prizeDescription: json['prize_description'],
      category: json['category'],
      maxParticipants: json['max_participants'],
      requiresProof: json['requires_proof'] ?? true,
      isFeatured: json['is_featured'] ?? false,
      isActive: json['is_active'] ?? true,
      startDate: json['start_date'],
      endDate: json['end_date'],
      winnerId: json['winner_id'],
      createdAt: json['created_at'] ?? '',
      creator: json['profiles'] != null 
          ? UserModel.fromJson(Map<String, dynamic>.from(json['profiles'])) 
          : null,
      participantCount: json['participant_count'] ?? 0,
    );
  }
}

class LeelaVideo {
  final String id;
  final String userId;
  final String videoUrl;
  final String? thumbnailUrl;
  final String? caption;
  final String? audioName;
  final int? durationSeconds;
  final int viewCount;
  final int likeCount;
  final int commentCount;
  final int shareCount;
  final String createdAt;
  final UserModel? user;
  final bool isLiked;
  final bool isBookmarked;

  LeelaVideo({
    required this.id,
    required this.userId,
    required this.videoUrl,
    this.thumbnailUrl,
    this.caption,
    this.audioName,
    this.durationSeconds,
    this.viewCount = 0,
    this.likeCount = 0,
    this.commentCount = 0,
    this.shareCount = 0,
    required this.createdAt,
    this.user,
    this.isLiked = false,
    this.isBookmarked = false,
  });

  factory LeelaVideo.fromJson(Map<String, dynamic> json) {
    return LeelaVideo(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      videoUrl: json['video_url'] ?? '',
      thumbnailUrl: json['thumbnail_url'],
      caption: json['caption'],
      audioName: json['audio_name'],
      durationSeconds: json['duration_seconds'],
      viewCount: json['view_count'] ?? 0,
      likeCount: json['like_count'] ?? 0,
      commentCount: json['comment_count'] ?? 0,
      shareCount: json['share_count'] ?? 0,
      createdAt: json['created_at'] ?? '',
      user: json['profiles'] != null 
          ? UserModel.fromJson(Map<String, dynamic>.from(json['profiles'])) 
          : null,
      isLiked: json['is_liked'] ?? false,
      isBookmarked: json['is_bookmarked'] ?? false,
    );
  }
}

class NewsArticle {
  final String id;
  final String title;
  final String? description;
  final String? imageUrl;
  final String? sourceUrl;
  final String? sourceName;
  final String publishedAt;

  NewsArticle({
    required this.id,
    required this.title,
    this.description,
    this.imageUrl,
    this.sourceUrl,
    this.sourceName,
    required this.publishedAt,
  });

  factory NewsArticle.fromJson(Map<String, dynamic> json) {
    return NewsArticle(
      id: (json['id'] ?? '').toString(),
      title: json['title'] ?? '',
      description: json['description'],
      imageUrl: json['image_url'] ?? json['urlToImage'],
      sourceUrl: json['source_url'] ?? json['url'],
      sourceName: json['source_name'] ?? (json['source'] is Map ? json['source']['name'] : null),
      publishedAt: json['published_at'] ?? json['publishedAt'] ?? '',
    );
  }
}
