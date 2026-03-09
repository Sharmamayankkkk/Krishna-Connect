import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/post_model.dart';

class PostService {
  final SupabaseClient _client;

  PostService(this._client);

  String? get _userId => _client.auth.currentUser?.id;

  Future<List<PostModel>> getFeed({int page = 0, int limit = 10, String? filter}) async {
    final offset = page * limit;
    
    var query = _client.rpc('get_feed_posts', params: {
      'p_user_id': _userId,
      'p_limit': limit,
      'p_offset': offset,
    });

    final data = await query;
    if (data is List) {
      return data.map((p) => PostModel.fromJson(Map<String, dynamic>.from(p))).toList();
    }
    
    // Fallback: direct query
    final posts = await _client
        .from('posts')
        .select('*, profiles!posts_user_id_fkey(*)')
        .order('created_at', ascending: false)
        .range(offset, offset + limit - 1);
    
    return (posts as List).map((p) => PostModel.fromJson(Map<String, dynamic>.from(p))).toList();
  }

  Future<List<PostModel>> getExplorePosts({int page = 0, int limit = 10}) async {
    final offset = page * limit;
    final posts = await _client
        .from('posts')
        .select('*, profiles!posts_user_id_fkey(*)')
        .order('created_at', ascending: false)
        .range(offset, offset + limit - 1);
    
    return (posts as List).map((p) => PostModel.fromJson(Map<String, dynamic>.from(p))).toList();
  }

  Future<PostModel?> getPost(String postId) async {
    final data = await _client
        .from('posts')
        .select('*, profiles!posts_user_id_fkey(*)')
        .eq('id', int.parse(postId))
        .maybeSingle();
    if (data == null) return null;
    return PostModel.fromJson(data);
  }

  Future<List<PostModel>> getUserPosts(String userId, {int page = 0, int limit = 20}) async {
    final offset = page * limit;
    final posts = await _client
        .from('posts')
        .select('*, profiles!posts_user_id_fkey(*)')
        .eq('user_id', userId)
        .order('created_at', ascending: false)
        .range(offset, offset + limit - 1);
    
    return (posts as List).map((p) => PostModel.fromJson(Map<String, dynamic>.from(p))).toList();
  }

  Future<void> createPost({
    required String content,
    List<Map<String, dynamic>>? mediaUrls,
    Map<String, dynamic>? poll,
    int? quoteOfId,
  }) async {
    await _client.from('posts').insert({
      'user_id': _userId,
      'content': content,
      if (mediaUrls != null) 'media_urls': mediaUrls,
      if (poll != null) 'poll': poll,
      if (quoteOfId != null) 'quote_of_id': quoteOfId,
    });
  }

  Future<void> deletePost(String postId) async {
    await _client.from('posts').delete().eq('id', int.parse(postId));
  }

  Future<void> likePost(String postId) async {
    await _client.from('post_likes').insert({
      'user_id': _userId,
      'post_id': int.parse(postId),
    });
  }

  Future<void> unlikePost(String postId) async {
    await _client.from('post_likes')
        .delete()
        .eq('user_id', _userId!)
        .eq('post_id', int.parse(postId));
  }

  Future<void> repost(String postId) async {
    await _client.from('post_reposts').insert({
      'user_id': _userId,
      'post_id': int.parse(postId),
    });
  }

  Future<void> unrepost(String postId) async {
    await _client.from('post_reposts')
        .delete()
        .eq('user_id', _userId!)
        .eq('post_id', int.parse(postId));
  }

  Future<void> bookmarkPost(String postId) async {
    await _client.from('bookmarks').insert({
      'user_id': _userId,
      'post_id': int.parse(postId),
    });
  }

  Future<void> unbookmarkPost(String postId) async {
    await _client.from('bookmarks')
        .delete()
        .eq('user_id', _userId!)
        .eq('post_id', int.parse(postId));
  }

  // Comments
  Future<List<CommentModel>> getComments(String postId) async {
    final data = await _client
        .from('comments')
        .select('*, profiles!comments_user_id_fkey(*)')
        .eq('post_id', int.parse(postId))
        .order('created_at', ascending: true);
    
    return (data as List).map((c) => CommentModel.fromJson(Map<String, dynamic>.from(c))).toList();
  }

  Future<void> addComment(String postId, String content, {String? parentCommentId}) async {
    await _client.from('comments').insert({
      'user_id': _userId,
      'post_id': int.parse(postId),
      'content': content,
      if (parentCommentId != null) 'parent_comment_id': int.parse(parentCommentId),
    });
  }

  Future<void> deleteComment(String commentId) async {
    await _client.from('comments').delete().eq('id', int.parse(commentId));
  }

  // Search
  Future<List<PostModel>> searchPosts(String query, {int limit = 20}) async {
    final data = await _client
        .from('posts')
        .select('*, profiles!posts_user_id_fkey(*)')
        .ilike('content', '%$query%')
        .order('created_at', ascending: false)
        .limit(limit);
    
    return (data as List).map((p) => PostModel.fromJson(Map<String, dynamic>.from(p))).toList();
  }

  // Trending hashtags
  Future<List<Map<String, dynamic>>> getTrendingHashtags({int limit = 10}) async {
    final data = await _client
        .from('hashtags')
        .select()
        .order('usage_count', ascending: false)
        .limit(limit);
    return List<Map<String, dynamic>>.from(data);
  }

  // Posts by hashtag
  Future<List<PostModel>> getPostsByHashtag(String tag, {int limit = 30}) async {
    final hashtagData = await _client
        .from('hashtags')
        .select('id')
        .eq('tag', tag)
        .maybeSingle();
    if (hashtagData == null) return [];

    final data = await _client
        .from('post_hashtags')
        .select('post_id, posts(*, profiles!posts_user_id_fkey(*))')
        .eq('hashtag_id', hashtagData['id'])
        .limit(limit);

    return (data as List)
        .where((r) => r['posts'] != null)
        .map((r) => PostModel.fromJson(Map<String, dynamic>.from(r['posts'])))
        .toList();
  }

  // Poll voting
  Future<void> votePoll(String postId, String optionId) async {
    await _client.rpc('vote_poll', params: {
      'p_post_id': int.parse(postId),
      'p_option_id': optionId,
      'p_user_id': _userId,
    });
  }

  // Upload media
  Future<String> uploadMedia(String path, List<int> bytes, String mimeType) async {
    final fileName = '${_userId}_${DateTime.now().millisecondsSinceEpoch}_${path.split('/').last}';
    await _client.storage.from('post-media').uploadBinary(
      fileName,
      bytes as dynamic,
      fileOptions: FileOptions(contentType: mimeType),
    );
    return _client.storage.from('post-media').getPublicUrl(fileName);
  }
}
