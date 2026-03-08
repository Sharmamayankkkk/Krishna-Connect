import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/user_model.dart';

class AuthService {
  final SupabaseClient _client;

  AuthService(this._client);

  User? get currentUser => _client.auth.currentUser;
  String? get currentUserId => currentUser?.id;
  bool get isAuthenticated => currentUser != null;

  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;

  Future<AuthResponse> signInWithEmail(String email, String password) async {
    return await _client.auth.signInWithPassword(email: email, password: password);
  }

  Future<AuthResponse> signUp(String email, String password) async {
    return await _client.auth.signUp(email: email, password: password);
  }

  Future<void> signInWithOtp(String phone) async {
    await _client.auth.signInWithOtp(phone: phone);
  }

  Future<AuthResponse> verifyOtp(String phone, String token) async {
    return await _client.auth.verifyOTP(phone: phone, token: token, type: OtpType.sms);
  }

  Future<bool> signInWithGoogle() async {
    return await _client.auth.signInWithOAuth(OAuthProvider.google);
  }

  Future<void> resetPassword(String email) async {
    await _client.auth.resetPasswordForEmail(email);
  }

  Future<void> updatePassword(String newPassword) async {
    await _client.auth.updateUser(UserAttributes(password: newPassword));
  }

  Future<void> signOut() async {
    await _client.auth.signOut();
  }

  Future<UserModel?> getProfile() async {
    if (currentUserId == null) return null;
    final data = await _client
        .from('profiles')
        .select()
        .eq('id', currentUserId!)
        .maybeSingle();
    if (data == null) return null;
    return UserModel.fromJson(data);
  }

  Future<void> updateProfile(Map<String, dynamic> updates) async {
    if (currentUserId == null) return;
    await _client.from('profiles').update(updates).eq('id', currentUserId!);
  }

  Future<bool> isProfileComplete() async {
    final profile = await getProfile();
    final username = profile?.username;
    return username != null && username.isNotEmpty;
  }
}
