import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:provider/provider.dart';
import 'app.dart';
import 'services/auth_service.dart';
import 'services/post_service.dart';
import 'services/chat_service.dart';
import 'services/profile_service.dart';
import 'services/services.dart';
import 'providers/auth_provider.dart';
import 'providers/app_provider.dart';
import 'providers/theme_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: Color(0xFF0F0F14),
  ));

  // Initialize Supabase - replace with your actual credentials
  await Supabase.initialize(
    url: const String.fromEnvironment('SUPABASE_URL', defaultValue: 'YOUR_SUPABASE_URL'),
    anonKey: const String.fromEnvironment('SUPABASE_ANON_KEY', defaultValue: 'YOUR_SUPABASE_ANON_KEY'),
  );

  final client = Supabase.instance.client;

  // Initialize services
  final authService = AuthService(client);
  final postService = PostService(client);
  final chatService = ChatService(client);
  final profileService = ProfileService(client);
  final eventService = EventService(client);
  final notificationService = NotificationService(client);
  final storyService = StoryService(client);
  final challengeService = ChallengeService(client);
  final leelaService = LeelaService(client);
  final bookmarkService = BookmarkService(client);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider(authService)),
        Provider.value(value: profileService),
        ChangeNotifierProvider(
          create: (_) => AppProvider(
            postService: postService,
            chatService: chatService,
            eventService: eventService,
            notificationService: notificationService,
            storyService: storyService,
            challengeService: challengeService,
            leelaService: leelaService,
            bookmarkService: bookmarkService,
          ),
        ),
      ],
      child: const KrishnaConnectApp(),
    ),
  );
}
