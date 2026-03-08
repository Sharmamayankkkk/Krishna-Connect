import 'user_model.dart';

class MediaItem {
  final String type;
  final String url;
  final String? thumbnailUrl;
  final int? width;
  final int? height;

  MediaItem({
    required this.type,
    required this.url,
    this.thumbnailUrl,
    this.width,
    this.height,
  });

  factory MediaItem.fromJson(Map<String, dynamic> json) {
    return MediaItem(
      type: json['type'] ?? 'image',
      url: json['url'] ?? '',
      thumbnailUrl: json['thumbnailUrl'],
      width: json['width'],
      height: json['height'],
    );
  }
}

class PollOption {
  final String id;
  final String text;
  final int votes;
  final List<String> votedBy;

  PollOption({required this.id, required this.text, this.votes = 0, this.votedBy = const []});

  factory PollOption.fromJson(Map<String, dynamic> json) {
    return PollOption(
      id: json['id'] ?? '',
      text: json['text'] ?? '',
      votes: json['votes'] ?? 0,
      votedBy: List<String>.from(json['votedBy'] ?? []),
    );
  }
}

class Poll {
  final String question;
  final List<PollOption> options;
  final int totalVotes;
  final String? endsAt;
  final bool allowMultipleChoices;

  Poll({
    required this.question,
    required this.options,
    this.totalVotes = 0,
    this.endsAt,
    this.allowMultipleChoices = false,
  });

  factory Poll.fromJson(Map<String, dynamic> json) {
    return Poll(
      question: json['question'] ?? '',
      options: (json['options'] as List?)?.map((o) => PollOption.fromJson(o)).toList() ?? [],
      totalVotes: json['totalVotes'] ?? 0,
      endsAt: json['endsAt'],
      allowMultipleChoices: json['allowMultipleChoices'] ?? false,
    );
  }
}

class PostModel {
  final String id;
  final UserModel author;
  final String? content;
  final List<MediaItem> media;
  final Poll? poll;
  final String createdAt;
  final String? updatedAt;
  final int likesCount;
  final int commentsCount;
  final int repostsCount;
  final int viewsCount;
  final int bookmarksCount;
  final List<String> likedBy;
  final List<String> repostedBy;
  final List<String> savedBy;
  final bool isPinned;
  final bool isPromoted;
  final PostModel? quotedPost;
  final List<UserModel>? collaborators;

  PostModel({
    required this.id,
    required this.author,
    this.content,
    this.media = const [],
    this.poll,
    required this.createdAt,
    this.updatedAt,
    this.likesCount = 0,
    this.commentsCount = 0,
    this.repostsCount = 0,
    this.viewsCount = 0,
    this.bookmarksCount = 0,
    this.likedBy = const [],
    this.repostedBy = const [],
    this.savedBy = const [],
    this.isPinned = false,
    this.isPromoted = false,
    this.quotedPost,
    this.collaborators,
  });

  factory PostModel.fromJson(Map<String, dynamic> json) {
    final authorData = json['profiles'] ?? json['author'] ?? {};
    final mediaUrls = json['media_urls'] ?? json['media'] ?? [];
    
    return PostModel(
      id: (json['id'] ?? '').toString(),
      author: UserModel.fromJson(Map<String, dynamic>.from(authorData)),
      content: json['content'],
      media: (mediaUrls is List) 
          ? mediaUrls.map((m) => MediaItem.fromJson(Map<String, dynamic>.from(m))).toList()
          : [],
      poll: json['poll'] != null ? Poll.fromJson(Map<String, dynamic>.from(json['poll'])) : null,
      createdAt: json['created_at'] ?? DateTime.now().toIso8601String(),
      updatedAt: json['updated_at'],
      likesCount: json['likes_count'] ?? json['like_count'] ?? 0,
      commentsCount: json['comments_count'] ?? json['comment_count'] ?? 0,
      repostsCount: json['reposts_count'] ?? json['repost_count'] ?? 0,
      viewsCount: json['views_count'] ?? json['view_count'] ?? 0,
      bookmarksCount: json['bookmarks_count'] ?? 0,
      likedBy: List<String>.from(json['liked_by'] ?? []),
      repostedBy: List<String>.from(json['reposted_by'] ?? []),
      savedBy: List<String>.from(json['saved_by'] ?? []),
      isPinned: json['pinned_at'] != null,
      isPromoted: json['is_promoted'] ?? false,
      quotedPost: json['quote_of'] != null 
          ? PostModel.fromJson(Map<String, dynamic>.from(json['quote_of'])) 
          : null,
    );
  }

  bool isLikedBy(String userId) => likedBy.contains(userId);
  bool isRepostedBy(String userId) => repostedBy.contains(userId);
  bool isSavedBy(String userId) => savedBy.contains(userId);
}

class CommentModel {
  final String id;
  final UserModel author;
  final String content;
  final String createdAt;
  final String? updatedAt;
  final int likesCount;
  final bool isPinned;
  final bool isHidden;
  final String? parentCommentId;
  final List<CommentModel> replies;
  final List<String> likedBy;

  CommentModel({
    required this.id,
    required this.author,
    required this.content,
    required this.createdAt,
    this.updatedAt,
    this.likesCount = 0,
    this.isPinned = false,
    this.isHidden = false,
    this.parentCommentId,
    this.replies = const [],
    this.likedBy = const [],
  });

  factory CommentModel.fromJson(Map<String, dynamic> json) {
    return CommentModel(
      id: (json['id'] ?? '').toString(),
      author: UserModel.fromJson(Map<String, dynamic>.from(json['profiles'] ?? json['author'] ?? {})),
      content: json['content'] ?? '',
      createdAt: json['created_at'] ?? DateTime.now().toIso8601String(),
      updatedAt: json['updated_at'],
      likesCount: json['likes_count'] ?? json['like_count'] ?? 0,
      isPinned: json['is_pinned'] ?? false,
      isHidden: json['is_hidden'] ?? false,
      parentCommentId: json['parent_comment_id']?.toString(),
      likedBy: List<String>.from(json['liked_by'] ?? []),
    );
  }
}
