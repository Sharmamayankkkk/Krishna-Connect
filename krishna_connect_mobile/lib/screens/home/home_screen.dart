import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/app_provider.dart';
import '../../services/push_notification_service.dart';
import '../feed/feed_screen.dart';
import '../explore/explore_screen.dart';
import '../leela/leela_screen.dart';
import '../chat/chat_list_screen.dart';
import '../notifications/notifications_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  final _screens = const [
    FeedScreen(),
    ExploreScreen(),
    LeelaScreen(),
    ChatListScreen(),
    NotificationsScreen(),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().initializeData();
      _initPushNotifications();
    });
  }

  void _initPushNotifications() {
    final userId = context.read<AuthProvider>().userId;
    if (userId != null) {
      final pushService = context.read<PushNotificationService>();
      pushService.startListening(userId);
      pushService.onNotificationTap = (payload) {
        _handleNotificationTap(payload);
      };
    }
  }

  void _handleNotificationTap(String? payload) {
    if (payload == null || !mounted) return;
    try {
      final data = jsonDecode(payload) as Map<String, dynamic>;
      final type = data['type'] as String? ?? '';
      if (type == 'new_message') {
        setState(() => _currentIndex = 3); // Switch to chats tab
      } else {
        setState(() => _currentIndex = 4); // Switch to notifications tab
      }
    } catch (e) {
      debugPrint('Error parsing notification payload: $e');
      setState(() => _currentIndex = 4); // Default to notifications tab
    }
  }

  @override
  Widget build(BuildContext context) {
    final unread = context.watch<AppProvider>().unreadNotifications;

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppTheme.surfaceDark,
          border: Border(top: BorderSide(color: AppTheme.borderDark.withValues(alpha: 0.5))),
        ),
        child: SafeArea(
          child: SizedBox(
            height: 60,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(0, Icons.home_outlined, Icons.home, 'Feed'),
                _buildNavItem(1, Icons.explore_outlined, Icons.explore, 'Explore'),
                _buildNavItem(2, Icons.play_circle_outline, Icons.play_circle_filled, 'Leela'),
                _buildNavItem(3, Icons.chat_bubble_outline, Icons.chat_bubble, 'Chats'),
                _buildNavItem(4, Icons.notifications_outlined, Icons.notifications, 'Alerts', badge: unread),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, IconData activeIcon, String label, {int badge = 0}) {
    final isActive = _currentIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _currentIndex = index),
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 64,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 200),
                  child: Icon(
                    isActive ? activeIcon : icon,
                    key: ValueKey(isActive),
                    size: 24,
                    color: isActive ? AppTheme.primaryColor : AppTheme.textMuted,
                  ),
                ),
                if (badge > 0)
                  Positioned(
                    top: -4,
                    right: -8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                      decoration: BoxDecoration(
                        color: AppTheme.errorColor,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      constraints: const BoxConstraints(minWidth: 16),
                      child: Text(
                        badge > 99 ? '99+' : badge.toString(),
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                color: isActive ? AppTheme.primaryColor : AppTheme.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
