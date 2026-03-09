import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/services.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});
  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  Map<String, dynamic>? _stats;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    setState(() => _isLoading = true);
    try {
      final service = context.read<AnalyticsService>();
      final stats = await service.getProfileStats();
      setState(() { _stats = stats; _isLoading = false; });
    } catch (e) {
      debugPrint('Analytics error: $e');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Analytics'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadStats),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadStats,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Summary header
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [colorScheme.primary, colorScheme.primary.withValues(alpha: 0.7)],
                        begin: Alignment.topLeft, end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      children: [
                        const Icon(Icons.analytics, size: 40, color: Colors.white),
                        const SizedBox(height: 8),
                        const Text('Your Dashboard', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white)),
                        const SizedBox(height: 4),
                        Text(
                          'Overview of your account performance',
                          style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: 0.8)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Stats grid
                  Row(
                    children: [
                      Expanded(child: _buildStatCard('Posts', '${_stats?['total_posts'] ?? 0}', Icons.article_outlined, colorScheme)),
                      const SizedBox(width: 12),
                      Expanded(child: _buildStatCard('Followers', '${_stats?['total_followers'] ?? 0}', Icons.people_outline, colorScheme)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _buildStatCard('Following', '${_stats?['total_following'] ?? 0}', Icons.person_add_outlined, colorScheme)),
                      const SizedBox(width: 12),
                      Expanded(child: _buildStatCard('Engagement', '${_stats?['engagement_rate'] ?? '0.0'}', Icons.trending_up, colorScheme)),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Engagement section
                  const Text('Engagement Breakdown', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 12),
                  _buildEngagementRow(Icons.favorite, 'Total Likes', '${_stats?['total_likes'] ?? 0}', Colors.red, colorScheme),
                  _buildEngagementRow(Icons.chat_bubble_outline, 'Total Comments', '${_stats?['total_comments'] ?? 0}', Colors.blue, colorScheme),
                  _buildEngagementRow(Icons.article_outlined, 'Total Posts', '${_stats?['total_posts'] ?? 0}', Colors.green, colorScheme),
                  const SizedBox(height: 24),

                  // Tips section
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: colorScheme.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: colorScheme.outline.withValues(alpha: 0.3)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.lightbulb_outline, color: Colors.amber.shade700, size: 20),
                            const SizedBox(width: 8),
                            const Text('Tips to Grow', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                          ],
                        ),
                        const SizedBox(height: 12),
                        _buildTip('Post consistently to keep your followers engaged', colorScheme),
                        _buildTip('Use trending hashtags to reach a wider audience', colorScheme),
                        _buildTip('Engage with others by liking and commenting on their posts', colorScheme),
                        _buildTip('Share stories daily to stay visible', colorScheme),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, ColorScheme colorScheme) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colorScheme.outline.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, color: colorScheme.primary, size: 28),
          const SizedBox(height: 8),
          Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: colorScheme.onSurface)),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(fontSize: 12, color: colorScheme.onSurface.withValues(alpha: 0.5))),
        ],
      ),
    );
  }

  Widget _buildEngagementRow(IconData icon, String label, String value, Color iconColor, ColorScheme colorScheme) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: colorScheme.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: colorScheme.outline.withValues(alpha: 0.3)),
        ),
        child: Row(
          children: [
            Icon(icon, color: iconColor, size: 22),
            const SizedBox(width: 12),
            Expanded(child: Text(label, style: const TextStyle(fontWeight: FontWeight.w500))),
            Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: colorScheme.onSurface)),
          ],
        ),
      ),
    );
  }

  Widget _buildTip(String text, ColorScheme colorScheme) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('•  ', style: TextStyle(color: colorScheme.primary, fontWeight: FontWeight.w700)),
          Expanded(child: Text(text, style: TextStyle(fontSize: 13, color: colorScheme.onSurface.withValues(alpha: 0.7)))),
        ],
      ),
    );
  }
}
