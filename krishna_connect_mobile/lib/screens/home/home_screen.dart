import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../config/assets.dart';
import '../../providers/auth_provider.dart';
import '../../providers/app_provider.dart';
import '../../services/push_notification_service.dart';
import '../../widgets/user_avatar.dart';
import '../feed/feed_screen.dart';
import '../explore/explore_screen.dart';
import '../leela/leela_screen.dart';
import '../chat/chat_list_screen.dart';
import '../news/news_screen.dart';
import '../profile/profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  String? _lastUsername;
  late List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = _createScreens(null);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().initializeData();
      _initPushNotifications();
    });
  }

  List<Widget> _createScreens(String? username) {
    return [
      const FeedScreen(),
      const ExploreScreen(),
      const LeelaScreen(),
      const ChatListScreen(),
      const NewsScreen(),
      if (username != null && username.isNotEmpty)
        ProfileScreen(username: username)
      else
        const _ProfilePlaceholder(),
    ];
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
        // Navigate to notifications screen directly
        context.push('/notifications');
      }
    } catch (e) {
      debugPrint('Error parsing notification payload: $e');
      context.push('/notifications');
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final user = context.watch<AuthProvider>().user;

    // Rebuild screens only when username changes
    final currentUsername = user?.username;
    if (currentUsername != _lastUsername) {
      _lastUsername = currentUsername;
      _screens = _createScreens(currentUsername);
    }

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: theme.scaffoldBackgroundColor,
          border: Border(top: BorderSide(color: colorScheme.outline.withValues(alpha: 0.2))),
        ),
        child: SafeArea(
          child: SizedBox(
            height: 64,
            child: Row(
              children: [
                _buildNavItem(context, 0, Icons.home_outlined, Icons.home_rounded, 'Feed'),
                _buildNavItem(context, 1, Icons.explore_outlined, Icons.explore, 'Explore'),
                _buildLeelaNavItem(context, 2),
                _buildNavItem(context, 3, Icons.chat_bubble_outline, Icons.chat_bubble, 'Chats'),
                _buildNavItem(context, 4, Icons.newspaper_outlined, Icons.newspaper, 'News'),
                _buildProfileNavItem(context, 5, user),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(BuildContext context, int index, IconData icon, IconData activeIcon, String label) {
    final isActive = _currentIndex == index;
    final colorScheme = Theme.of(context).colorScheme;
    final activeColor = colorScheme.primary;
    final inactiveColor = colorScheme.onSurface.withValues(alpha: 0.4);

    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _currentIndex = index),
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 200),
              child: Icon(
                isActive ? activeIcon : icon,
                key: ValueKey('$index-$isActive'),
                size: 24,
                color: isActive ? activeColor : inactiveColor,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                color: isActive ? activeColor : inactiveColor,
              ),
              overflow: TextOverflow.ellipsis,
              maxLines: 1,
            ),
          ],
        ),
      ),
    );
  }

  /// Leela tab uses a custom image icon matching the webapp
  Widget _buildLeelaNavItem(BuildContext context, int index) {
    final isActive = _currentIndex == index;
    final colorScheme = Theme.of(context).colorScheme;
    final activeColor = colorScheme.primary;
    final inactiveColor = colorScheme.onSurface.withValues(alpha: 0.4);

    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _currentIndex = index),
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Opacity(
              opacity: isActive ? 1.0 : 0.5,
              child: Image.asset(
                AppAssets.iconLeela,
                width: 24,
                height: 24,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              'Leela',
              style: TextStyle(
                fontSize: 10,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                color: isActive ? activeColor : inactiveColor,
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Profile tab shows user avatar with ring indicator matching the webapp
  Widget _buildProfileNavItem(BuildContext context, int index, dynamic user) {
    final isActive = _currentIndex == index;
    final colorScheme = Theme.of(context).colorScheme;
    final activeColor = colorScheme.primary;
    final inactiveColor = colorScheme.onSurface.withValues(alpha: 0.4);

    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _currentIndex = index),
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 26,
              height: 26,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: isActive ? activeColor : colorScheme.outline.withValues(alpha: 0.3),
                  width: 2,
                ),
              ),
              child: ClipOval(
                child: UserAvatar(
                  imageUrl: user?.avatarUrlOrDefault,
                  size: 22,
                  fallbackName: user?.displayName,
                ),
              ),
            ),
            const SizedBox(height: 3),
            Text(
              'Profile',
              style: TextStyle(
                fontSize: 10,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                color: isActive ? activeColor : inactiveColor,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Placeholder shown in the Profile tab when user is not yet loaded.
class _ProfilePlaceholder extends StatelessWidget {
  const _ProfilePlaceholder();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: colorScheme.primary),
            const SizedBox(height: 16),
            Text(
              'Loading profile...',
              style: TextStyle(
                color: colorScheme.onSurface.withValues(alpha: 0.5),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
