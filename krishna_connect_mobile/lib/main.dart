import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:provider/provider.dart';
import 'app.dart';
import 'services/auth_service.dart';
import 'services/post_service.dart';
import 'services/chat_service.dart';
import 'services/profile_service.dart';
import 'services/services.dart';
import 'services/push_notification_service.dart';
import 'providers/auth_provider.dart';
import 'providers/app_provider.dart';
import 'providers/theme_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load .env file (falls back gracefully if not found)
  try {
    await dotenv.load(fileName: '.env');
  } catch (_) {
    // .env file not found — will use --dart-define values or defaults
  }

  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
    systemNavigationBarColor: Colors.white,
  ));

  // Resolve Supabase credentials:
  // 1. --dart-define values take priority (compile-time)
  // 2. .env file values as fallback (runtime)
  final supabaseUrl = const String.fromEnvironment('SUPABASE_URL').isNotEmpty
      ? const String.fromEnvironment('SUPABASE_URL')
      : dotenv.env['SUPABASE_URL'] ?? '';
  final supabaseAnonKey = const String.fromEnvironment('SUPABASE_ANON_KEY').isNotEmpty
      ? const String.fromEnvironment('SUPABASE_ANON_KEY')
      : dotenv.env['SUPABASE_ANON_KEY'] ?? '';

  if (supabaseUrl.isEmpty || supabaseAnonKey.isEmpty) {
    runApp(const _SetupErrorApp());
    return;
  }

  await Supabase.initialize(
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
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
  final groupService = GroupService(client);
  final analyticsService = AnalyticsService(client);
  final verificationService = VerificationService(client);

  // Initialize push notification service
  final pushService = PushNotificationService(client);
  await pushService.initialize();
  await pushService.requestPermission();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider(authService)),
        Provider.value(value: profileService),
        Provider.value(value: pushService),
        Provider.value(value: groupService),
        Provider.value(value: analyticsService),
        Provider.value(value: verificationService),
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

/// Shown when Supabase credentials are missing.
class _SetupErrorApp extends StatelessWidget {
  const _SetupErrorApp();

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        backgroundColor: Colors.white,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.warning_amber_rounded, size: 64, color: Color(0xFFF59E0B)),
                const SizedBox(height: 24),
                const Text(
                  'Supabase Not Configured',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                const Text(
                  'Create a .env file in the krishna_connect_mobile/ directory with your Supabase credentials:\n\n'
                  'SUPABASE_URL=https://your-project.supabase.co\n'
                  'SUPABASE_ANON_KEY=your-anon-key\n\n'
                  'Or pass them as build arguments:\n'
                  'flutter run --dart-define=SUPABASE_URL=... --dart-define=SUPABASE_ANON_KEY=...',
                  style: TextStyle(fontSize: 14, color: Colors.black54, height: 1.6),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
