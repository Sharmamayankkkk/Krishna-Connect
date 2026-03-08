import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../config/theme.dart';
import '../../providers/app_provider.dart';
import '../../models/models.dart';
import '../../widgets/user_avatar.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().loadNotifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppProvider>();
    final notifications = app.notifications;
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (app.unreadNotifications > 0)
            TextButton(
              onPressed: () async {
                await app.notificationService.markAllAsRead();
                await app.loadNotifications();
              },
              child: const Text('Mark all read', style: TextStyle(fontSize: 13)),
            ),
        ],
      ),
      body: notifications.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.notifications_none, size: 64, color: colorScheme.onSurface.withValues(alpha: 0.4)),
                  const SizedBox(height: 16),
                  Text('No notifications yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: colorScheme.onSurface.withValues(alpha: 0.7))),
                  const SizedBox(height: 6),
                  Text("You're all caught up!", style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.4))),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: () => app.loadNotifications(),
              child: ListView.builder(
                itemCount: notifications.length,
                itemBuilder: (context, index) {
                  final notif = notifications[index];
                  return _buildNotificationTile(context, notif);
                },
              ),
            ),
    );
  }

  Widget _buildNotificationTile(BuildContext context, NotificationModel notif) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final timeStr = timeago.format(DateTime.tryParse(notif.createdAt) ?? DateTime.now());

    IconData icon;
    Color iconColor;
    switch (notif.type) {
      case 'new_follower':
        icon = Icons.person_add;
        iconColor = AppTheme.verifiedColor;
        break;
      case 'follow_request':
        icon = Icons.person_add_outlined;
        iconColor = AppTheme.accentColor;
        break;
      case 'new_like':
        icon = Icons.favorite;
        iconColor = Colors.red;
        break;
      case 'new_comment':
        icon = Icons.chat_bubble;
        iconColor = AppTheme.successColor;
        break;
      case 'new_repost':
        icon = Icons.repeat;
        iconColor = AppTheme.successColor;
        break;
      case 'mention':
        icon = Icons.alternate_email;
        iconColor = colorScheme.primary;
        break;
      case 'collaboration_request':
        icon = Icons.handshake;
        iconColor = AppTheme.accentColor;
        break;
      case 'call_missed':
        icon = Icons.phone_missed;
        iconColor = AppTheme.errorColor;
        break;
      case 'call_incoming':
        icon = Icons.phone_callback;
        iconColor = AppTheme.successColor;
        break;
      case 'event_rsvp':
        icon = Icons.event_available;
        iconColor = AppTheme.warningColor;
        break;
      case 'challenge_joined':
        icon = Icons.emoji_events;
        iconColor = colorScheme.primary;
        break;
      case 'story_reaction':
        icon = Icons.emoji_emotions;
        iconColor = AppTheme.accentColor;
        break;
      default:
        icon = Icons.notifications;
        iconColor = colorScheme.onSurface.withValues(alpha: 0.4);
    }

    return Container(
      decoration: BoxDecoration(
        color: notif.isRead ? null : colorScheme.primary.withValues(alpha: 0.05),
        border: Border(bottom: BorderSide(color: colorScheme.outline.withValues(alpha: 0.15))),
      ),
      child: ListTile(
        onTap: () {
          context.read<AppProvider>().markNotificationRead(notif.id);
          if (notif.entityType == 'post' && notif.entityId != null) {
            context.push('/post/${notif.entityId}');
          } else if (notif.actor?.username != null) {
            context.push('/profile/${notif.actor!.username}');
          }
        },
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        leading: Stack(
          clipBehavior: Clip.none,
          children: [
            UserAvatar(
              imageUrl: notif.actor?.avatarUrlOrDefault,
              size: 44,
              fallbackName: notif.actor?.displayName,
            ),
            Positioned(
              bottom: -2,
              right: -2,
              child: Container(
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  color: theme.scaffoldBackgroundColor,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 14, color: iconColor),
              ),
            ),
          ],
        ),
        title: RichText(
          text: TextSpan(
            style: TextStyle(fontSize: 14, color: colorScheme.onSurface),
            children: [
              TextSpan(
                text: notif.actor?.displayName ?? 'Someone',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              TextSpan(text: ' ${notif.displayType}'),
            ],
          ),
        ),
        subtitle: Text(timeStr, style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.4), fontSize: 12)),
        trailing: !notif.isRead
            ? Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: colorScheme.primary,
                  shape: BoxShape.circle,
                ),
              )
            : null,
      ),
    );
  }
}
