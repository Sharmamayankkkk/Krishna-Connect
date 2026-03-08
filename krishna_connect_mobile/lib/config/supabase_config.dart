import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseConfig {
  /// Resolved Supabase URL: prefers --dart-define, falls back to .env
  static String get supabaseUrl {
    const dartDefine = String.fromEnvironment('SUPABASE_URL');
    if (dartDefine.isNotEmpty) return dartDefine;
    return dotenv.env['SUPABASE_URL'] ?? '';
  }

  /// Resolved Supabase Anon Key: prefers --dart-define, falls back to .env
  static String get supabaseAnonKey {
    const dartDefine = String.fromEnvironment('SUPABASE_ANON_KEY');
    if (dartDefine.isNotEmpty) return dartDefine;
    return dotenv.env['SUPABASE_ANON_KEY'] ?? '';
  }

  static SupabaseClient get client => Supabase.instance.client;

  static Future<void> initialize({
    required String url,
    required String anonKey,
  }) async {
    await Supabase.initialize(
      url: url,
      anonKey: anonKey,
    );
  }
}
