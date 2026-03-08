import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Handles local push notifications triggered by Supabase Realtime events.
/// Listens for new notifications, messages, and other actions, then displays
/// native push notifications on the device.
class PushNotificationService {
  final SupabaseClient _client;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  final List<RealtimeChannel> _channels = [];
  String? _currentUserId;

  // Notification channel IDs
  static const String _channelGeneral = 'krishna_connect_general';
  static const String _channelMessages = 'krishna_connect_messages';
  static const String _channelSocial = 'krishna_connect_social';
  static const String _channelEvents = 'krishna_connect_events';

  // Callback for notification taps
  void Function(String? payload)? onNotificationTap;

  PushNotificationService(this._client);

  /// Initialize the notification plugin and set up channels.
  Future<void> initialize() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    const settings = InitializationSettings(android: androidSettings, iOS: iosSettings);

    await _localNotifications.initialize(
      settings,
      onDidReceiveNotificationResponse: (response) {
        onNotificationTap?.call(response.payload);
      },
    );

    // Create Android notification channels
    final androidPlugin = _localNotifications.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    if (androidPlugin != null) {
      await androidPlugin.createNotificationChannel(const AndroidNotificationChannel(
        _channelGeneral, 'General',
        description: 'General notifications',
        importance: Importance.high,
      ));
      await androidPlugin.createNotificationChannel(const AndroidNotificationChannel(
        _channelMessages, 'Messages',
        description: 'Chat message notifications',
        importance: Importance.high,
      ));
      await androidPlugin.createNotificationChannel(const AndroidNotificationChannel(
        _channelSocial, 'Social',
        description: 'Likes, comments, follows',
        importance: Importance.defaultImportance,
      ));
      await androidPlugin.createNotificationChannel(const AndroidNotificationChannel(
        _channelEvents, 'Events & Challenges',
        description: 'Event and challenge notifications',
        importance: Importance.defaultImportance,
      ));
    }
  }

  /// Request notification permissions (especially for iOS / Android 13+).
  Future<bool> requestPermission() async {
    final androidPlugin = _localNotifications.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    if (androidPlugin != null) {
      final granted = await androidPlugin.requestNotificationsPermission();
      return granted ?? false;
    }
    final iosPlugin = _localNotifications.resolvePlatformSpecificImplementation<IOSFlutterLocalNotificationsPlugin>();
    if (iosPlugin != null) {
      final granted = await iosPlugin.requestPermissions(alert: true, badge: true, sound: true);
      return granted ?? false;
    }
    return true;
  }

  /// Start listening for realtime events for the given user.
  Future<void> startListening(String userId) async {
    _currentUserId = userId;
    await _subscribeToNotifications(userId);
    await _subscribeToMessages(userId);
  }

  /// Stop all realtime subscriptions.
  Future<void> stopListening() async {
    for (final channel in _channels) {
      await _client.removeChannel(channel);
    }
    _channels.clear();
    _currentUserId = null;
  }

  // -- Realtime subscriptions --

  Future<void> _subscribeToNotifications(String userId) async {
    final channel = _client.channel('push_notifs:$userId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'notifications',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'user_id',
            value: userId,
          ),
          callback: (payload) {
            _handleNewNotification(payload.newRecord);
          },
        ).subscribe();
    _channels.add(channel);
  }

  Future<void> _subscribeToMessages(String userId) async {
    final channel = _client.channel('push_msgs:$userId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'messages',
          callback: (payload) {
            final record = payload.newRecord;
            // Only show if the message is not from the current user
            if (record['user_id'] != userId) {
              _handleNewMessage(record);
            }
          },
        ).subscribe();
    _channels.add(channel);
  }

  // -- Notification handlers --

  Future<void> _handleNewNotification(Map<String, dynamic> record) async {
    final type = record['type'] as String? ?? '';
    final actorId = record['actor_id'] as String?;
    final entityId = record['entity_id'];

    // Fetch actor name
    String actorName = 'Someone';
    if (actorId != null) {
      try {
        final actor = await _client.from('profiles').select('name, username').eq('id', actorId).maybeSingle();
        if (actor != null) {
          actorName = actor['name'] ?? actor['username'] ?? 'Someone';
        }
      } catch (_) {}
    }

    String title;
    String body;
    String channelId = _channelSocial;

    switch (type) {
      case 'new_follower':
        title = 'New Follower';
        body = '$actorName started following you';
        break;
      case 'follow_request':
        title = 'Follow Request';
        body = '$actorName sent you a follow request';
        break;
      case 'new_like':
        title = 'New Like';
        body = '$actorName liked your post';
        break;
      case 'new_comment':
        title = 'New Comment';
        body = '$actorName commented on your post';
        break;
      case 'new_repost':
        title = 'Reposted';
        body = '$actorName reposted your post';
        break;
      case 'mention':
        title = 'Mention';
        body = '$actorName mentioned you';
        break;
      case 'collaboration_request':
        title = 'Collaboration Request';
        body = '$actorName wants to collaborate with you';
        break;
      case 'call_missed':
        title = 'Missed Call';
        body = 'You missed a call from $actorName';
        channelId = _channelGeneral;
        break;
      case 'call_incoming':
        title = 'Incoming Call';
        body = '$actorName is calling you';
        channelId = _channelGeneral;
        break;
      default:
        title = 'Krishna Connect';
        body = '$actorName ${type.replaceAll('_', ' ')}';
    }

    final payload = jsonEncode({
      'type': type,
      'entity_id': entityId?.toString(),
      'actor_id': actorId,
    });

    await _showNotification(
      id: record['id']?.hashCode ?? DateTime.now().millisecondsSinceEpoch,
      title: title,
      body: body,
      channelId: channelId,
      payload: payload,
    );
  }

  Future<void> _handleNewMessage(Map<String, dynamic> record) async {
    final senderId = record['user_id'] as String?;
    final chatId = record['chat_id'];
    final content = record['content'] as String?;

    String senderName = 'Someone';
    if (senderId != null) {
      try {
        final sender = await _client.from('profiles').select('name, username').eq('id', senderId).maybeSingle();
        if (sender != null) {
          senderName = sender['name'] ?? sender['username'] ?? 'Someone';
        }
      } catch (_) {}
    }

    final body = content?.isNotEmpty == true ? content! : 'Sent an attachment';

    final payload = jsonEncode({
      'type': 'new_message',
      'chat_id': chatId?.toString(),
      'sender_id': senderId,
    });

    await _showNotification(
      id: record['id']?.hashCode ?? DateTime.now().millisecondsSinceEpoch,
      title: senderName,
      body: body,
      channelId: _channelMessages,
      payload: payload,
    );
  }

  // -- Manual notification triggers for local actions --

  /// Show notification when a post is liked.
  Future<void> notifyPostLiked({required String likerName, required String postId}) async {
    await _showNotification(
      id: 'like_$postId'.hashCode,
      title: 'New Like',
      body: '$likerName liked your post',
      channelId: _channelSocial,
      payload: jsonEncode({'type': 'new_like', 'entity_id': postId}),
    );
  }

  /// Show notification for new comment.
  Future<void> notifyNewComment({required String commenterName, required String postId}) async {
    await _showNotification(
      id: 'comment_$postId'.hashCode,
      title: 'New Comment',
      body: '$commenterName commented on your post',
      channelId: _channelSocial,
      payload: jsonEncode({'type': 'new_comment', 'entity_id': postId}),
    );
  }

  /// Show notification for new follower.
  Future<void> notifyNewFollower({required String followerName, required String followerUsername}) async {
    await _showNotification(
      id: 'follow_$followerUsername'.hashCode,
      title: 'New Follower',
      body: '$followerName started following you',
      channelId: _channelSocial,
      payload: jsonEncode({'type': 'new_follower', 'username': followerUsername}),
    );
  }

  /// Show notification for new message.
  Future<void> notifyNewMessage({required String senderName, required String content, required int chatId}) async {
    await _showNotification(
      id: 'msg_$chatId'.hashCode,
      title: senderName,
      body: content.isNotEmpty ? content : 'Sent an attachment',
      channelId: _channelMessages,
      payload: jsonEncode({'type': 'new_message', 'chat_id': chatId.toString()}),
    );
  }

  /// Show notification for event RSVP.
  Future<void> notifyEventRsvp({required String userName, required String eventTitle, required String status}) async {
    await _showNotification(
      id: 'event_rsvp_$eventTitle'.hashCode,
      title: 'Event RSVP',
      body: '$userName is $status for "$eventTitle"',
      channelId: _channelEvents,
      payload: jsonEncode({'type': 'event_rsvp'}),
    );
  }

  /// Show notification for challenge join.
  Future<void> notifyChallengeJoined({required String userName, required String challengeTitle}) async {
    await _showNotification(
      id: 'challenge_$challengeTitle'.hashCode,
      title: 'Challenge Joined',
      body: '$userName joined "$challengeTitle"',
      channelId: _channelEvents,
      payload: jsonEncode({'type': 'challenge_joined'}),
    );
  }

  /// Show notification for story reaction.
  Future<void> notifyStoryReaction({required String reactorName, required String emoji}) async {
    await _showNotification(
      id: 'story_react_$reactorName'.hashCode,
      title: 'Story Reaction',
      body: '$reactorName reacted $emoji to your story',
      channelId: _channelSocial,
      payload: jsonEncode({'type': 'story_reaction'}),
    );
  }

  /// Show notification for post creation (for followers).
  Future<void> notifyNewPost({required String authorName}) async {
    await _showNotification(
      id: 'new_post_$authorName'.hashCode,
      title: 'New Post',
      body: '$authorName shared a new post',
      channelId: _channelSocial,
      payload: jsonEncode({'type': 'new_post'}),
    );
  }

  // -- Core notification display --

  Future<void> _showNotification({
    required int id,
    required String title,
    required String body,
    required String channelId,
    String? payload,
  }) async {
    final androidDetails = AndroidNotificationDetails(
      channelId,
      _channelName(channelId),
      channelDescription: _channelDescription(channelId),
      importance: channelId == _channelMessages ? Importance.high : Importance.defaultImportance,
      priority: channelId == _channelMessages ? Priority.high : Priority.defaultPriority,
      icon: '@mipmap/ic_launcher',
      color: const Color(0xFFE8A838),
      styleInformation: BigTextStyleInformation(body),
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    final details = NotificationDetails(android: androidDetails, iOS: iosDetails);

    await _localNotifications.show(id, title, body, details, payload: payload);
  }

  String _channelName(String channelId) {
    switch (channelId) {
      case _channelMessages: return 'Messages';
      case _channelSocial: return 'Social';
      case _channelEvents: return 'Events & Challenges';
      default: return 'General';
    }
  }

  String _channelDescription(String channelId) {
    switch (channelId) {
      case _channelMessages: return 'Chat message notifications';
      case _channelSocial: return 'Likes, comments, follows';
      case _channelEvents: return 'Event and challenge notifications';
      default: return 'General notifications';
    }
  }
}
