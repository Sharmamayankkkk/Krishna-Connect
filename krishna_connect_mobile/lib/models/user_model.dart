class UserModel {
  final String id;
  final String? name;
  final String? username;
  final String? avatarUrl;
  final String? bannerUrl;
  final String? bio;
  final String? gender;
  final String? location;
  final String? website;
  final String? phone;
  final String verified;
  final bool isPrivate;
  final bool? hasSetPrivacy;
  final Map<String, dynamic>? settings;
  final int? challengePoints;
  final String? email;

  // Computed / joined fields
  final int followerCount;
  final int followingCount;
  final int postCount;
  final bool isFollowing;
  final String? followStatus;

  UserModel({
    required this.id,
    this.name,
    this.username,
    this.avatarUrl,
    this.bannerUrl,
    this.bio,
    this.gender,
    this.location,
    this.website,
    this.phone,
    this.verified = 'none',
    this.isPrivate = false,
    this.hasSetPrivacy,
    this.settings,
    this.challengePoints,
    this.email,
    this.followerCount = 0,
    this.followingCount = 0,
    this.postCount = 0,
    this.isFollowing = false,
    this.followStatus,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? '',
      name: json['name'],
      username: json['username'],
      avatarUrl: json['avatar_url'],
      bannerUrl: json['banner_url'],
      bio: json['bio'],
      gender: json['gender'],
      location: json['location'],
      website: json['website'],
      phone: json['phone'],
      verified: json['verified'] ?? 'none',
      isPrivate: json['is_private'] ?? false,
      hasSetPrivacy: json['has_set_privacy'],
      settings: json['settings'] is Map ? Map<String, dynamic>.from(json['settings']) : null,
      challengePoints: json['challenge_points'],
      email: json['email'],
      followerCount: json['follower_count'] ?? 0,
      followingCount: json['following_count'] ?? 0,
      postCount: json['post_count'] ?? 0,
      isFollowing: json['is_following'] ?? false,
      followStatus: json['follow_status'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'username': username,
    'avatar_url': avatarUrl,
    'banner_url': bannerUrl,
    'bio': bio,
    'gender': gender,
    'location': location,
    'website': website,
    'phone': phone,
    'verified': verified,
    'is_private': isPrivate,
    'settings': settings,
  };

  String get displayName => name ?? username ?? 'Unknown';

  String get avatarUrlOrDefault {
    if (avatarUrl != null && avatarUrl!.isNotEmpty) return avatarUrl!;
    final seed = username ?? id;
    return 'https://api.dicebear.com/7.x/avataaars/png?seed=$seed';
  }

  bool get isVerified => verified == 'verified' || verified == 'kcs';
  bool get isKCS => verified == 'kcs';

  UserModel copyWith({
    String? name,
    String? username,
    String? avatarUrl,
    String? bannerUrl,
    String? bio,
    String? location,
    String? website,
    String? phone,
    bool? isPrivate,
    Map<String, dynamic>? settings,
  }) {
    return UserModel(
      id: id,
      name: name ?? this.name,
      username: username ?? this.username,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      bannerUrl: bannerUrl ?? this.bannerUrl,
      bio: bio ?? this.bio,
      gender: gender,
      location: location ?? this.location,
      website: website ?? this.website,
      phone: phone ?? this.phone,
      verified: verified,
      isPrivate: isPrivate ?? this.isPrivate,
      hasSetPrivacy: hasSetPrivacy,
      settings: settings ?? this.settings,
      challengePoints: challengePoints,
      email: email,
      followerCount: followerCount,
      followingCount: followingCount,
      postCount: postCount,
      isFollowing: isFollowing,
      followStatus: followStatus,
    );
  }
}
