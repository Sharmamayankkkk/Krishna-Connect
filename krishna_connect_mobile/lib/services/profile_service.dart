import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/user_model.dart';

class ProfileService {
  final SupabaseClient _client;

  ProfileService(this._client);

  String? get _userId => _client.auth.currentUser?.id;

  Future<UserModel?> getProfileByUsername(String username) async {
    final data = await _client
        .from('profiles')
        .select()
        .eq('username', username)
        .maybeSingle();
    if (data == null) return null;

    final profile = UserModel.fromJson(data);
    
    // Get follower/following counts
    final followers = await _client
        .from('relationships')
        .select()
        .eq('user_two_id', profile.id)
        .eq('status', 'approved');
    final following = await _client
        .from('relationships')
        .select()
        .eq('user_one_id', profile.id)
        .eq('status', 'approved');
    
    // Check if current user follows
    bool isFollowing = false;
    String? followStatus;
    if (_userId != null && _userId != profile.id) {
      final rel = await _client
          .from('relationships')
          .select()
          .eq('user_one_id', _userId!)
          .eq('user_two_id', profile.id)
          .maybeSingle();
      if (rel != null) {
        isFollowing = rel['status'] == 'approved';
        followStatus = rel['status'];
      }
    }

    return UserModel(
      id: profile.id,
      name: profile.name,
      username: profile.username,
      avatarUrl: profile.avatarUrl,
      bannerUrl: profile.bannerUrl,
      bio: profile.bio,
      gender: profile.gender,
      location: profile.location,
      website: profile.website,
      phone: profile.phone,
      verified: profile.verified,
      isPrivate: profile.isPrivate,
      hasSetPrivacy: profile.hasSetPrivacy,
      settings: profile.settings,
      challengePoints: profile.challengePoints,
      followerCount: (followers as List).length,
      followingCount: (following as List).length,
      isFollowing: isFollowing,
      followStatus: followStatus,
    );
  }

  Future<UserModel?> getProfileById(String userId) async {
    final data = await _client
        .from('profiles')
        .select()
        .eq('id', userId)
        .maybeSingle();
    if (data == null) return null;
    return UserModel.fromJson(data);
  }

  Future<void> followUser(String targetUserId) async {
    final targetProfile = await getProfileById(targetUserId);
    final status = targetProfile?.isPrivate == true ? 'pending' : 'approved';
    
    await _client.from('relationships').upsert({
      'user_one_id': _userId,
      'user_two_id': targetUserId,
      'status': status,
    });

    // Create notification
    if (_userId != targetUserId) {
      await _client.from('notifications').insert({
        'user_id': targetUserId,
        'actor_id': _userId,
        'type': status == 'pending' ? 'follow_request' : 'new_follower',
      });
    }
  }

  Future<void> unfollowUser(String targetUserId) async {
    await _client.from('relationships')
        .delete()
        .eq('user_one_id', _userId!)
        .eq('user_two_id', targetUserId);
  }

  Future<void> acceptFollowRequest(String fromUserId) async {
    await _client.from('relationships')
        .update({'status': 'approved'})
        .eq('user_one_id', fromUserId)
        .eq('user_two_id', _userId!);
  }

  Future<void> blockUser(String targetUserId) async {
    await _client.from('blocked_users').insert({
      'blocker_id': _userId,
      'blocked_id': targetUserId,
    });
  }

  Future<void> unblockUser(String targetUserId) async {
    await _client.from('blocked_users')
        .delete()
        .eq('blocker_id', _userId!)
        .eq('blocked_id', targetUserId);
  }

  Future<List<UserModel>> getFollowers(String userId, {int limit = 50}) async {
    final data = await _client
        .from('relationships')
        .select('user_one_id, profiles!relationships_user_one_id_fkey(*)')
        .eq('user_two_id', userId)
        .eq('status', 'approved')
        .limit(limit);
    
    return (data as List)
        .map((r) => UserModel.fromJson(Map<String, dynamic>.from(r['profiles'])))
        .toList();
  }

  Future<List<UserModel>> getFollowing(String userId, {int limit = 50}) async {
    final data = await _client
        .from('relationships')
        .select('user_two_id, profiles!relationships_user_two_id_fkey(*)')
        .eq('user_one_id', userId)
        .eq('status', 'approved')
        .limit(limit);
    
    return (data as List)
        .map((r) => UserModel.fromJson(Map<String, dynamic>.from(r['profiles'])))
        .toList();
  }

  Future<List<UserModel>> searchUsers(String query, {int limit = 20}) async {
    final data = await _client
        .from('profiles')
        .select()
        .or('name.ilike.%$query%,username.ilike.%$query%')
        .limit(limit);
    
    return (data as List).map((u) => UserModel.fromJson(Map<String, dynamic>.from(u))).toList();
  }

  Future<List<UserModel>> getSuggestedUsers({int limit = 10}) async {
    final data = await _client
        .from('profiles')
        .select()
        .neq('id', _userId ?? '')
        .limit(limit);
    
    return (data as List).map((u) => UserModel.fromJson(Map<String, dynamic>.from(u))).toList();
  }

  Future<void> updateProfile(Map<String, dynamic> updates) async {
    await _client.from('profiles').update(updates).eq('id', _userId!);
  }

  Future<String> uploadAvatar(List<int> bytes, String mimeType) async {
    final path = '$_userId/avatar_${DateTime.now().millisecondsSinceEpoch}';
    await _client.storage.from('avatars').uploadBinary(
      path, bytes as dynamic,
      fileOptions: FileOptions(contentType: mimeType),
    );
    return _client.storage.from('avatars').getPublicUrl(path);
  }

  Future<String> uploadBanner(List<int> bytes, String mimeType) async {
    final path = '$_userId/banner_${DateTime.now().millisecondsSinceEpoch}';
    await _client.storage.from('banners').uploadBinary(
      path, bytes as dynamic,
      fileOptions: FileOptions(contentType: mimeType),
    );
    return _client.storage.from('banners').getPublicUrl(path);
  }
}
