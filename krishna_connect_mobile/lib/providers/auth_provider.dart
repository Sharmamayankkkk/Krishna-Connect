import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService;
  UserModel? _user;
  bool _isLoading = true;
  String? _error;

  AuthProvider(this._authService) {
    _init();
  }

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _authService.isAuthenticated;
  String? get error => _error;
  String? get userId => _authService.currentUserId;

  void _init() {
    _authService.authStateChanges.listen((event) async {
      if (event.event == AuthChangeEvent.signedIn || event.event == AuthChangeEvent.tokenRefreshed) {
        await loadProfile();
      } else if (event.event == AuthChangeEvent.signedOut) {
        _user = null;
        notifyListeners();
      }
    });
    _checkSession();
  }

  Future<void> _checkSession() async {
    _isLoading = true;
    notifyListeners();
    
    if (_authService.isAuthenticated) {
      await loadProfile();
    }
    
    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadProfile() async {
    _user = await _authService.getProfile();
    notifyListeners();
  }

  Future<bool> signIn(String email, String password) async {
    _error = null;
    _isLoading = true;
    notifyListeners();

    try {
      await _authService.signInWithEmail(email, password);
      await loadProfile();
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('AuthException: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> signUp(
    String email,
    String password, {
    String? name,
    String? username,
    String? gender,
    String? avatarUrl,
  }) async {
    _error = null;
    _isLoading = true;
    notifyListeners();

    try {
      await _authService.signUp(
        email,
        password,
        name: name,
        username: username,
        gender: gender,
        avatarUrl: avatarUrl,
      );
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('AuthException: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> sendOtp(String phone) async {
    _error = null;
    try {
      await _authService.signInWithOtp(phone);
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<bool> verifyOtp(String phone, String token) async {
    _error = null;
    try {
      await _authService.verifyOtp(phone, token);
      await loadProfile();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<void> resetPassword(String email) async {
    _error = null;
    try {
      await _authService.resetPassword(email);
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<bool> signInWithGoogle() async {
    _error = null;
    try {
      return await _authService.signInWithGoogle();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<void> signOut() async {
    await _authService.signOut();
    _user = null;
    notifyListeners();
  }

  Future<void> updateProfile(Map<String, dynamic> updates) async {
    await _authService.updateProfile(updates);
    await loadProfile();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
