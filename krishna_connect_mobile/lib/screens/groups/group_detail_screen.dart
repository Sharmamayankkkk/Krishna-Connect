import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/services.dart';
import '../../models/models.dart';
import '../../models/user_model.dart';
import '../../widgets/user_avatar.dart';

class GroupDetailScreen extends StatefulWidget {
  final int groupId;
  const GroupDetailScreen({super.key, required this.groupId});
  @override
  State<GroupDetailScreen> createState() => _GroupDetailScreenState();
}

class _GroupDetailScreenState extends State<GroupDetailScreen> {
  GroupModel? _group;
  List<Map<String, dynamic>> _members = [];
  bool _isLoading = true;
  bool _isJoining = false;

  @override
  void initState() {
    super.initState();
    _loadGroup();
  }

  Future<void> _loadGroup() async {
    setState(() => _isLoading = true);
    try {
      final service = context.read<GroupService>();
      final group = await service.getGroup(widget.groupId);
      final members = await service.getGroupMembers(widget.groupId);
      setState(() { _group = group; _members = members; _isLoading = false; });
    } catch (e) {
      debugPrint('Group detail error: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _joinGroup() async {
    setState(() => _isJoining = true);
    try {
      await context.read<GroupService>().joinGroup(widget.groupId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Joined group!'), backgroundColor: Colors.green),
        );
        _loadGroup();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
    setState(() => _isJoining = false);
  }

  Future<void> _leaveGroup() async {
    try {
      await context.read<GroupService>().leaveGroup(widget.groupId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Left group'), backgroundColor: Colors.orange),
        );
        _loadGroup();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: Text(_group?.name ?? 'Group')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _group == null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.group_off, size: 64, color: colorScheme.onSurface.withValues(alpha: 0.2)),
                      const SizedBox(height: 16),
                      Text('Group not found', style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.5))),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadGroup,
                  child: ListView(
                    children: [
                      // Group header
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [colorScheme.primary.withValues(alpha: 0.15), colorScheme.primary.withValues(alpha: 0.05)],
                            begin: Alignment.topCenter, end: Alignment.bottomCenter,
                          ),
                        ),
                        child: Column(
                          children: [
                            Container(
                              width: 72, height: 72,
                              decoration: BoxDecoration(
                                color: colorScheme.primary.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Center(
                                child: Text(
                                  _group!.name.isNotEmpty ? _group!.name[0].toUpperCase() : 'G',
                                  style: TextStyle(fontSize: 32, fontWeight: FontWeight.w700, color: colorScheme.primary),
                                ),
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text(_group!.name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
                            if (_group!.description != null && _group!.description!.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              Text(
                                _group!.description!,
                                style: TextStyle(fontSize: 14, color: colorScheme.onSurface.withValues(alpha: 0.6)),
                                textAlign: TextAlign.center,
                              ),
                            ],
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.people_outline, size: 16, color: colorScheme.onSurface.withValues(alpha: 0.5)),
                                const SizedBox(width: 4),
                                Text(
                                  '${_members.length} member${_members.length == 1 ? '' : 's'}',
                                  style: TextStyle(fontSize: 13, color: colorScheme.onSurface.withValues(alpha: 0.5)),
                                ),
                                const SizedBox(width: 16),
                                Icon(
                                  _group!.isPublic ? Icons.public : Icons.lock_outline,
                                  size: 16,
                                  color: colorScheme.onSurface.withValues(alpha: 0.5),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  _group!.isPublic ? 'Public Group' : 'Private Group',
                                  style: TextStyle(fontSize: 13, color: colorScheme.onSurface.withValues(alpha: 0.5)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                FilledButton.icon(
                                  onPressed: _isJoining ? null : _joinGroup,
                                  icon: const Icon(Icons.group_add, size: 18),
                                  label: Text(_isJoining ? 'Joining...' : 'Join Group'),
                                  style: FilledButton.styleFrom(
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                OutlinedButton(
                                  onPressed: _leaveGroup,
                                  style: OutlinedButton.styleFrom(
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                  ),
                                  child: const Text('Leave'),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      // Members section
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Members (${_members.length})',
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                            ),
                            const SizedBox(height: 12),
                            if (_members.isEmpty)
                              Padding(
                                padding: const EdgeInsets.all(20),
                                child: Center(
                                  child: Text('No members yet', style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.5))),
                                ),
                              )
                            else
                              ..._members.map((m) {
                                final profile = m['profiles'];
                                if (profile == null) return const SizedBox.shrink();
                                final user = UserModel.fromJson(Map<String, dynamic>.from(profile));
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 8),
                                  child: Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: colorScheme.surface,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: colorScheme.outline.withValues(alpha: 0.3)),
                                    ),
                                    child: Row(
                                      children: [
                                        UserAvatar(imageUrl: user.avatarUrlOrDefault, size: 40, fallbackName: user.displayName),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(user.displayName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                                              if (user.username != null)
                                                Text('@${user.username}', style: TextStyle(fontSize: 12, color: colorScheme.onSurface.withValues(alpha: 0.4))),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              }),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }
}
