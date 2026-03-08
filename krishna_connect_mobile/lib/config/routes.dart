import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/signup_screen.dart';
import '../screens/auth/forgot_password_screen.dart';
import '../screens/auth/complete_profile_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/feed/post_detail_screen.dart';
import '../screens/feed/create_post_screen.dart';
import '../screens/chat/chat_detail_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/profile/edit_profile_screen.dart';
import '../screens/events/event_detail_screen.dart';
import '../screens/events/events_screen.dart';
import '../screens/search/search_screen.dart';
import '../screens/settings/settings_screen.dart';
import '../screens/stories/create_story_screen.dart';
import '../screens/stories/story_viewer_screen.dart';
import '../screens/challenges/challenge_detail_screen.dart';
import '../screens/challenges/create_challenge_screen.dart';
import '../screens/challenges/challenges_screen.dart';
import '../screens/bookmarks/bookmarks_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();

GoRouter createRouter(AuthProvider authProvider) {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/',
    redirect: (context, state) {
      final isAuthenticated = authProvider.isAuthenticated;
      final isAuthRoute = state.matchedLocation.startsWith('/auth');

      if (!isAuthenticated && !isAuthRoute) {
        return '/auth/login';
      }
      if (isAuthenticated && isAuthRoute) {
        return '/';
      }
      return null;
    },
    routes: [
      // Auth routes
      GoRoute(
        path: '/auth/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/auth/signup',
        builder: (context, state) => const SignupScreen(),
      ),
      GoRoute(
        path: '/auth/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/auth/complete-profile',
        builder: (context, state) => const CompleteProfileScreen(),
      ),

      // Main app shell
      GoRoute(
        path: '/',
        builder: (context, state) => const HomeScreen(),
      ),

      // Post routes
      GoRoute(
        path: '/post/:id',
        builder: (context, state) => PostDetailScreen(
          postId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: '/create-post',
        builder: (context, state) => const CreatePostScreen(),
      ),

      // Chat detail
      GoRoute(
        path: '/chat/:id',
        builder: (context, state) => ChatDetailScreen(
          chatId: int.parse(state.pathParameters['id']!),
        ),
      ),

      // Profile
      GoRoute(
        path: '/profile/:username',
        builder: (context, state) => ProfileScreen(
          username: state.pathParameters['username']!,
        ),
      ),
      GoRoute(
        path: '/edit-profile',
        builder: (context, state) => const EditProfileScreen(),
      ),

      // Events
      GoRoute(
        path: '/events',
        builder: (context, state) => const EventsScreen(),
      ),
      GoRoute(
        path: '/event/:id',
        builder: (context, state) => EventDetailScreen(
          eventId: int.parse(state.pathParameters['id']!),
        ),
      ),

      // Search
      GoRoute(
        path: '/search',
        builder: (context, state) => const SearchScreen(),
      ),

      // Settings
      GoRoute(
        path: '/settings',
        builder: (context, state) => const SettingsScreen(),
      ),

      // Stories
      GoRoute(
        path: '/create-story',
        builder: (context, state) => const CreateStoryScreen(),
      ),

      // Challenges
      GoRoute(
        path: '/challenges',
        builder: (context, state) => const ChallengesScreen(),
      ),
      GoRoute(
        path: '/challenge/:id',
        builder: (context, state) => ChallengeDetailScreen(
          challengeId: int.parse(state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/create-challenge',
        builder: (context, state) => const CreateChallengeScreen(),
      ),

      // Bookmarks
      GoRoute(
        path: '/bookmarks',
        builder: (context, state) => const BookmarksScreen(),
      ),
    ],
  );
}
