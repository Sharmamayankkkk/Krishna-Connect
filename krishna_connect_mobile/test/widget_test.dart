import 'package:flutter_test/flutter_test.dart';

// Model imports for unit testing
import 'package:krishna_connect_mobile/models/user_model.dart';
import 'package:krishna_connect_mobile/models/post_model.dart';
import 'package:krishna_connect_mobile/models/chat_model.dart';
import 'package:krishna_connect_mobile/models/models.dart';

void main() {
  group('UserModel', () {
    test('creates from JSON correctly', () {
      final json = {
        'id': 'user-123',
        'username': 'testuser',
        'name': 'Test User',
        'email': 'test@example.com',
        'avatar_url': 'https://example.com/avatar.jpg',
        'bio': 'Hello world',
        'verified': 'none',
        'is_private': false,
        'follower_count': 10,
        'following_count': 5,
      };
      final user = UserModel.fromJson(json);
      expect(user.id, 'user-123');
      expect(user.username, 'testuser');
      expect(user.displayName, 'Test User');
      expect(user.isVerified, false);
      expect(user.followerCount, 10);
    });

    test('displayName falls back to username when name is null', () {
      final json = {
        'id': 'user-456',
        'username': 'fallbackuser',
        'verified': 'none',
      };
      final user = UserModel.fromJson(json);
      expect(user.displayName, 'fallbackuser');
    });

    test('isVerified returns true for verified users', () {
      final json = {
        'id': 'user-789',
        'verified': 'standard',
      };
      final user = UserModel.fromJson(json);
      expect(user.isVerified, true);
    });
  });

  group('PostModel', () {
    test('creates from JSON correctly', () {
      final json = {
        'id': 'post-123',
        'content': 'Hello world!',
        'user_id': 'user-123',
        'created_at': '2024-01-01T00:00:00Z',
        'likes_count': 5,
        'comments_count': 2,
        'reposts_count': 1,
        'is_pinned': false,
        'type': 'post',
        'profiles': {
          'id': 'user-123',
          'username': 'testuser',
          'name': 'Test User',
          'verified': 'none',
        },
      };
      final post = PostModel.fromJson(json);
      expect(post.id, 'post-123');
      expect(post.content, 'Hello world!');
      expect(post.likesCount, 5);
      expect(post.author.username, 'testuser');
    });
  });

  group('NotificationModel', () {
    test('displayType returns correct strings', () {
      final jsonBase = {
        'id': 'notif-1',
        'user_id': 'user-1',
        'created_at': '2024-01-01T00:00:00Z',
        'is_read': false,
      };

      final followerNotif = NotificationModel.fromJson({
        ...jsonBase,
        'type': 'new_follower',
      });
      expect(followerNotif.displayType, 'started following you');

      final likeNotif = NotificationModel.fromJson({
        ...jsonBase,
        'type': 'new_like',
      });
      expect(likeNotif.displayType, 'liked your post');

      final commentNotif = NotificationModel.fromJson({
        ...jsonBase,
        'type': 'new_comment',
      });
      expect(commentNotif.displayType, 'commented on your post');

      final eventNotif = NotificationModel.fromJson({
        ...jsonBase,
        'type': 'event_rsvp',
      });
      expect(eventNotif.displayType, 'responded to your event');

      final challengeNotif = NotificationModel.fromJson({
        ...jsonBase,
        'type': 'challenge_joined',
      });
      expect(challengeNotif.displayType, 'joined your challenge');
    });
  });

  group('EventModel', () {
    test('creates from JSON correctly', () {
      final json = {
        'id': 1,
        'title': 'Test Event',
        'description': 'A test event',
        'date_time': '2024-06-01T10:00:00Z',
        'going_count': 10,
        'interested_count': 5,
      };
      final event = EventModel.fromJson(json);
      expect(event.id, 1);
      expect(event.title, 'Test Event');
      expect(event.goingCount, 10);
    });
  });

  group('ChallengeModel', () {
    test('creates from JSON correctly', () {
      final json = {
        'id': 1,
        'title': 'Test Challenge',
        'description': 'A test challenge',
        'is_active': true,
        'is_featured': false,
        'participant_count': 25,
      };
      final challenge = ChallengeModel.fromJson(json);
      expect(challenge.id, 1);
      expect(challenge.title, 'Test Challenge');
      expect(challenge.isActive, true);
      expect(challenge.participantCount, 25);
    });
  });

  group('ChatModel', () {
    test('getChatName returns correct name for DM', () {
      final json = {
        'id': 1,
        'is_group': false,
        'name': null,
        'participants': [
          {
            'user_id': 'me',
            'profiles': {'id': 'me', 'name': 'Me', 'verified': 'none'},
          },
          {
            'user_id': 'other',
            'profiles': {'id': 'other', 'name': 'Other User', 'verified': 'none'},
          },
        ],
        'messages': [],
      };
      final chat = ChatModel.fromJson(json);
      expect(chat.isGroup, false);
      expect(chat.getChatName('me'), 'Other User');
    });
  });
}
