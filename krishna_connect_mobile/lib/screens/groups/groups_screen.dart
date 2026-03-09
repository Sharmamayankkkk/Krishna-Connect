import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../services/services.dart';
import '../../models/models.dart';

class GroupsScreen extends StatefulWidget {
  const GroupsScreen({super.key});
  @override
  State<GroupsScreen> createState() => _GroupsScreenState();
}

class _GroupsScreenState extends State<GroupsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<GroupModel> _allGroups = [];
  List<GroupModel> _myGroups = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadGroups();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadGroups() async {
    setState(() => _isLoading = true);
    try {
      final service = context.read<GroupService>();
      final all = await service.getGroups();
      final my = await service.getUserGroups();
      setState(() { _allGroups = all; _myGroups = my; _isLoading = false; });
    } catch (e) {
      debugPrint('Groups load error: $e');
      setState(() => _isLoading = false);
    }
  }

  void _showCreateGroupDialog() {
    final nameController = TextEditingController();
    final descController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Create Group'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: InputDecoration(
                labelText: 'Group Name',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: descController,
              decoration: InputDecoration(
                labelText: 'Description (optional)',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              maxLines: 2,
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              if (nameController.text.trim().isNotEmpty) {
                Navigator.pop(ctx);
                try {
                  await context.read<GroupService>().createGroup(
                    name: nameController.text.trim(),
                    description: descController.text.trim().isNotEmpty ? descController.text.trim() : null,
                  );
                  _loadGroups();
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                  }
                }
              }
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Groups'),
        actions: [
          IconButton(icon: const Icon(Icons.add), onPressed: _showCreateGroupDialog),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: 'All Groups (${_allGroups.length})'),
            Tab(text: 'My Groups (${_myGroups.length})'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildGroupList(_allGroups, 'No groups yet', 'Create the first group!', colorScheme),
                _buildGroupList(_myGroups, 'You haven\'t joined any groups', 'Browse groups to find your community', colorScheme),
              ],
            ),
    );
  }

  Widget _buildGroupList(List<GroupModel> groups, String emptyTitle, String emptySubtitle, ColorScheme colorScheme) {
    if (groups.isEmpty) {
      return RefreshIndicator(
        onRefresh: _loadGroups,
        child: ListView(
          children: [
            SizedBox(height: MediaQuery.of(context).size.height * 0.25),
            Icon(Icons.group_outlined, size: 64, color: colorScheme.onSurface.withValues(alpha: 0.2)),
            const SizedBox(height: 16),
            Center(child: Text(emptyTitle, style: TextStyle(fontSize: 16, color: colorScheme.onSurface.withValues(alpha: 0.5)))),
            const SizedBox(height: 8),
            Center(child: Text(emptySubtitle, style: TextStyle(fontSize: 13, color: colorScheme.onSurface.withValues(alpha: 0.3)))),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _loadGroups,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: groups.length,
        itemBuilder: (context, index) {
          final group = groups[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: () => context.push('/group/${group.id}'),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: colorScheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: colorScheme.outline.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 52, height: 52,
                      decoration: BoxDecoration(
                        color: colorScheme.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Center(
                        child: Text(
                          group.name.isNotEmpty ? group.name[0].toUpperCase() : 'G',
                          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: colorScheme.primary),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(group.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                          if (group.description != null && group.description!.isNotEmpty)
                            Text(
                              group.description!,
                              style: TextStyle(fontSize: 12, color: colorScheme.onSurface.withValues(alpha: 0.5)),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Icon(Icons.people_outline, size: 14, color: colorScheme.onSurface.withValues(alpha: 0.4)),
                              const SizedBox(width: 4),
                              Text(
                                '${group.memberCount} member${group.memberCount == 1 ? '' : 's'}',
                                style: TextStyle(fontSize: 11, color: colorScheme.onSurface.withValues(alpha: 0.4)),
                              ),
                              if (group.isPublic) ...[
                                const SizedBox(width: 12),
                                Icon(Icons.public, size: 14, color: colorScheme.onSurface.withValues(alpha: 0.4)),
                                const SizedBox(width: 4),
                                Text('Public', style: TextStyle(fontSize: 11, color: colorScheme.onSurface.withValues(alpha: 0.4))),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),
                    Icon(Icons.chevron_right, color: colorScheme.onSurface.withValues(alpha: 0.4)),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
