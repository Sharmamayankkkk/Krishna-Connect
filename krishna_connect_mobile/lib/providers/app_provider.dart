import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/post_model.dart';
import '../models/chat_model.dart';
import '../models/models.dart';
import '../services/post_service.dart';
import '../services/chat_service.dart';
import '../services/services.dart';

class AppProvider extends ChangeNotifier {
  final PostService postService;
  final ChatService chatService;
  final EventService eventService;
  final NotificationService notificationService;
  final StoryService storyService;
  final ChallengeService challengeService;
  final LeelaService leelaService;
  final BookmarkService bookmarkService;

  List<PostModel> _feedPosts = [];
  List<ChatModel> _chats = [];
  List<EventModel> _events = [];
  List<NotificationModel> _notifications = [];
  List<StoryModel> _stories = [];
  List<ChallengeModel> _challenges = [];
  List<LeelaVideo> _leelaVideos = [];
  
  bool _isFeedLoading = false;
  bool _isChatsLoading = false;
  int _feedPage = 0;
  bool _hasMorePosts = true;
  int _unreadNotifications = 0;

  AppProvider({
    required this.postService,
    required this.chatService,
    required this.eventService,
    required this.notificationService,
    required this.storyService,
    required this.challengeService,
    required this.leelaService,
    required this.bookmarkService,
  });

  // Getters
  List<PostModel> get feedPosts => _feedPosts;
  List<ChatModel> get chats => _chats;
  List<EventModel> get events => _events;
  List<NotificationModel> get notifications => _notifications;
  List<StoryModel> get stories => _stories;
  List<ChallengeModel> get challenges => _challenges;
  List<LeelaVideo> get leelaVideos => _leelaVideos;
  bool get isFeedLoading => _isFeedLoading;
  bool get isChatsLoading => _isChatsLoading;
  bool get hasMorePosts => _hasMorePosts;
  int get unreadNotifications => _unreadNotifications;

  // Feed
  Future<void> loadFeed({bool refresh = false}) async {
    if (_isFeedLoading) return;
    if (refresh) {
      _feedPage = 0;
      _hasMorePosts = true;
    }
    _isFeedLoading = true;
    notifyListeners();

    try {
      final posts = await postService.getExplorePosts(page: _feedPage);
      if (refresh) {
        _feedPosts = posts;
      } else {
        _feedPosts.addAll(posts);
      }
      _hasMorePosts = posts.length >= 10;
      _feedPage++;
    } catch (e) {
      debugPrint('Error loading feed: $e');
    }

    _isFeedLoading = false;
    notifyListeners();
  }

  // Chats
  Future<void> loadChats() async {
    _isChatsLoading = true;
    notifyListeners();

    try {
      _chats = await chatService.getChats();
    } catch (e) {
      debugPrint('Error loading chats: $e');
    }

    _isChatsLoading = false;
    notifyListeners();
  }

  // Events
  Future<void> loadEvents() async {
    try {
      _events = await eventService.getEvents();
      notifyListeners();
    } catch (e) {
      debugPrint('Error loading events: $e');
    }
  }

  // Notifications
  Future<void> loadNotifications() async {
    try {
      _notifications = await notificationService.getNotifications();
      _unreadNotifications = _notifications.where((n) => !n.isRead).length;
      notifyListeners();
    } catch (e) {
      debugPrint('Error loading notifications: $e');
    }
  }

  Future<void> markNotificationRead(String id) async {
    await notificationService.markAsRead(id);
    final idx = _notifications.indexWhere((n) => n.id == id);
    if (idx >= 0) {
      _unreadNotifications = _notifications.where((n) => !n.isRead && n.id != id).length;
      notifyListeners();
    }
  }

  // Stories
  Future<void> loadStories() async {
    try {
      _stories = await storyService.getStories();
      notifyListeners();
    } catch (e) {
      debugPrint('Error loading stories: $e');
    }
  }

  // Challenges
  Future<void> loadChallenges() async {
    try {
      _challenges = await challengeService.getChallenges();
      notifyListeners();
    } catch (e) {
      debugPrint('Error loading challenges: $e');
    }
  }

  // Leela
  Future<void> loadLeelaVideos({bool refresh = false}) async {
    try {
      final videos = await leelaService.getVideos(offset: refresh ? 0 : _leelaVideos.length);
      if (refresh) {
        _leelaVideos = videos;
      } else {
        _leelaVideos.addAll(videos);
      }
      notifyListeners();
    } catch (e) {
      debugPrint('Error loading leela: $e');
    }
  }

  // Post interactions
  Future<void> toggleLike(PostModel post, String userId) async {
    try {
      if (post.isLikedBy(userId)) {
        await postService.unlikePost(post.id);
      } else {
        await postService.likePost(post.id);
      }
      await loadFeed(refresh: true);
    } catch (e) {
      debugPrint('Error toggling like: $e');
    }
  }

  Future<void> toggleBookmark(PostModel post, String userId) async {
    try {
      if (post.isSavedBy(userId)) {
        await postService.unbookmarkPost(post.id);
      } else {
        await postService.bookmarkPost(post.id);
      }
    } catch (e) {
      debugPrint('Error toggling bookmark: $e');
    }
  }

  Future<void> createPost(String content, {List<Map<String, dynamic>>? media}) async {
    await postService.createPost(content: content, mediaUrls: media);
    await loadFeed(refresh: true);
  }

  // Initialize all data
  Future<void> initializeData() async {
    await Future.wait([
      loadFeed(refresh: true),
      loadChats(),
      loadStories(),
      loadNotifications(),
    ]);
  }
}
