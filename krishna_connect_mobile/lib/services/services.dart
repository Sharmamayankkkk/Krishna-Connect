import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/models.dart';

class EventService {
  final SupabaseClient _client;
  EventService(this._client);
  String? get _userId => _client.auth.currentUser?.id;

  Future<List<EventModel>> getEvents({int limit = 20}) async {
    final data = await _client
        .from('events')
        .select('*, profiles!events_creator_id_fkey(*), event_rsvps(*, profiles(*))')
        .eq('is_deleted', false)
        .order('date_time', ascending: true)
        .limit(limit);
    return (data as List).map((e) => EventModel.fromJson(Map<String, dynamic>.from(e))).toList();
  }

  Future<EventModel?> getEvent(int eventId) async {
    final data = await _client
        .from('events')
        .select('*, profiles!events_creator_id_fkey(*), event_rsvps(*, profiles(*))')
        .eq('id', eventId)
        .maybeSingle();
    if (data == null) return null;
    return EventModel.fromJson(data);
  }

  Future<void> createEvent({required String title, String? description, required String dateTime, String? meetLink, String? thumbnail}) async {
    await _client.from('events').insert({
      'creator_id': _userId, 'title': title, 'description': description,
      'date_time': dateTime, 'meet_link': meetLink, 'thumbnail': thumbnail,
    });
  }

  Future<void> rsvpEvent(int eventId, String status) async {
    await _client.from('event_rsvps').upsert({
      'event_id': eventId, 'user_id': _userId, 'status': status,
    });
    // Notify event creator about the RSVP
    final event = await _client.from('events').select('creator_id').eq('id', eventId).maybeSingle();
    if (event != null && event['creator_id'] != _userId) {
      await _client.from('notifications').insert({
        'user_id': event['creator_id'],
        'actor_id': _userId,
        'type': 'event_rsvp',
        'entity_id': eventId,
        'entity_type': 'event',
      }).onError((error, stackTrace) => null); // Ignore if type not in enum
    }
  }

  Future<void> deleteEvent(int eventId) async {
    await _client.from('events').update({'is_deleted': true}).eq('id', eventId);
  }
}

class NotificationService {
  final SupabaseClient _client;
  NotificationService(this._client);
  String? get _userId => _client.auth.currentUser?.id;

  Future<List<NotificationModel>> getNotifications({int limit = 30}) async {
    final data = await _client
        .from('notifications')
        .select('*, actor:profiles!notifications_actor_id_fkey(*)')
        .eq('user_id', _userId!)
        .order('created_at', ascending: false)
        .limit(limit);
    return (data as List).map((n) => NotificationModel.fromJson(Map<String, dynamic>.from(n))).toList();
  }

  Future<void> markAsRead(String notifId) async {
    await _client.from('notifications').update({'is_read': true}).eq('id', int.parse(notifId));
  }

  Future<void> markAllAsRead() async {
    await _client.from('notifications').update({'is_read': true}).eq('user_id', _userId!).eq('is_read', false);
  }

  Future<int> getUnreadCount() async {
    final data = await _client.from('notifications').select().eq('user_id', _userId!).eq('is_read', false);
    return (data as List).length;
  }

  RealtimeChannel subscribeToNotifications(void Function(NotificationModel) onNotification) {
    return _client.channel('notifications:$_userId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public', table: 'notifications',
          filter: PostgresChangeFilter(type: PostgresChangeFilterType.eq, column: 'user_id', value: _userId!),
          callback: (payload) {
            onNotification(NotificationModel.fromJson(Map<String, dynamic>.from(payload.newRecord)));
          },
        ).subscribe();
  }
}

class StoryService {
  final SupabaseClient _client;
  StoryService(this._client);
  String? get _userId => _client.auth.currentUser?.id;

  Future<List<StoryModel>> getStories() async {
    final data = await _client
        .from('statuses')
        .select('*, profiles(*)')
        .gt('expires_at', DateTime.now().toIso8601String())
        .order('created_at', ascending: false);
    return (data as List).map((s) => StoryModel.fromJson(Map<String, dynamic>.from(s))).toList();
  }

  Future<void> createStory({required String mediaUrl, String mediaType = 'image', String? caption}) async {
    await _client.from('statuses').insert({
      'user_id': _userId, 'media_url': mediaUrl, 'media_type': mediaType, 'caption': caption,
    });
  }

  Future<void> viewStory(String storyId) async {
    await _client.from('status_views').upsert({
      'status_id': int.parse(storyId), 'viewer_id': _userId,
    });
  }

  Future<void> reactToStory(String storyId, String emoji) async {
    await _client.from('story_reactions').upsert({
      'status_id': int.parse(storyId), 'user_id': _userId, 'emoji': emoji,
    });
    // Notify story owner
    final story = await _client.from('statuses').select('user_id').eq('id', int.parse(storyId)).maybeSingle();
    if (story != null && story['user_id'] != _userId) {
      await _client.from('notifications').insert({
        'user_id': story['user_id'],
        'actor_id': _userId,
        'type': 'story_reaction',
        'entity_id': int.parse(storyId),
        'entity_type': 'story',
      }).onError((error, stackTrace) => null); // Ignore if type not in enum
    }
  }

  Future<String> uploadStoryMedia(List<int> bytes, String mimeType) async {
    final path = '$_userId/story_${DateTime.now().millisecondsSinceEpoch}';
    await _client.storage.from('stories').uploadBinary(path, bytes as dynamic, fileOptions: FileOptions(contentType: mimeType));
    return _client.storage.from('stories').getPublicUrl(path);
  }
}

class ChallengeService {
  final SupabaseClient _client;
  ChallengeService(this._client);
  String? get _userId => _client.auth.currentUser?.id;

  Future<List<ChallengeModel>> getChallenges({int limit = 20}) async {
    final data = await _client
        .from('challenges')
        .select('*, profiles!challenges_created_by_fkey(*)')
        .eq('is_active', true)
        .order('created_at', ascending: false)
        .limit(limit);
    return (data as List).map((c) => ChallengeModel.fromJson(Map<String, dynamic>.from(c))).toList();
  }

  Future<ChallengeModel?> getChallenge(int id) async {
    final data = await _client
        .from('challenges')
        .select('*, profiles!challenges_created_by_fkey(*)')
        .eq('id', id)
        .maybeSingle();
    if (data == null) return null;
    return ChallengeModel.fromJson(data);
  }

  Future<void> joinChallenge(int challengeId) async {
    await _client.from('challenge_participants').insert({
      'challenge_id': challengeId, 'user_id': _userId,
    });
    // Notify challenge creator
    final challenge = await _client.from('challenges').select('created_by').eq('id', challengeId).maybeSingle();
    if (challenge != null && challenge['created_by'] != _userId) {
      await _client.from('notifications').insert({
        'user_id': challenge['created_by'],
        'actor_id': _userId,
        'type': 'challenge_joined',
        'entity_id': challengeId,
        'entity_type': 'challenge',
      }).onError((error, stackTrace) => null); // Ignore if type not in enum
    }
  }

  Future<void> createChallenge({required String title, String? description, String? rules, String? coverImage, String? endDate}) async {
    await _client.from('challenges').insert({
      'created_by': _userId, 'title': title, 'description': description,
      'rules': rules, 'cover_image': coverImage,
      if (endDate != null) 'end_date': endDate,
    });
  }
}

class LeelaService {
  final SupabaseClient _client;
  LeelaService(this._client);
  String? get _userId => _client.auth.currentUser?.id;

  Future<List<LeelaVideo>> getVideos({int limit = 20, int offset = 0}) async {
    final data = await _client
        .from('leela_videos')
        .select('*, profiles(*)')
        .eq('is_published', true)
        .order('created_at', ascending: false)
        .range(offset, offset + limit - 1);
    return (data as List).map((v) => LeelaVideo.fromJson(Map<String, dynamic>.from(v))).toList();
  }

  Future<void> likeVideo(String videoId) async {
    await _client.from('leela_likes').insert({'user_id': _userId, 'video_id': videoId});
    await _client.rpc('increment_leela_likes', params: {'p_video_id': videoId});
  }

  Future<void> unlikeVideo(String videoId) async {
    await _client.from('leela_likes').delete().eq('user_id', _userId!).eq('video_id', videoId);
  }

  Future<void> recordView(String videoId, {int watchedSeconds = 0}) async {
    await _client.from('leela_views').upsert({
      'user_id': _userId, 'video_id': videoId, 'watched_seconds': watchedSeconds,
    });
  }
}

class BookmarkService {
  final SupabaseClient _client;
  BookmarkService(this._client);
  String? get _userId => _client.auth.currentUser?.id;

  Future<List<Map<String, dynamic>>> getBookmarks({int limit = 30}) async {
    final data = await _client
        .from('bookmarks')
        .select('*, posts(*, profiles!posts_user_id_fkey(*))')
        .eq('user_id', _userId!)
        .order('created_at', ascending: false)
        .limit(limit);
    return List<Map<String, dynamic>>.from(data);
  }

  Future<List<Map<String, dynamic>>> getCollections() async {
    final data = await _client
        .from('bookmark_collections')
        .select()
        .eq('user_id', _userId!)
        .order('created_at', ascending: false);
    return List<Map<String, dynamic>>.from(data);
  }

  Future<void> createCollection(String name, {bool isPrivate = true}) async {
    await _client.from('bookmark_collections').insert({
      'user_id': _userId, 'name': name, 'is_private': isPrivate,
    });
  }

  Future<void> addToCollection(int collectionId, int postId) async {
    await _client.from('bookmark_collection_items').insert({
      'collection_id': collectionId, 'post_id': postId,
    });
  }
}
