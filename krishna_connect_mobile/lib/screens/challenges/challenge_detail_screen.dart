import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../providers/app_provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/models.dart';
import '../../widgets/user_avatar.dart';

class ChallengeDetailScreen extends StatefulWidget {
  final int challengeId;
  const ChallengeDetailScreen({super.key, required this.challengeId});
  @override
  State<ChallengeDetailScreen> createState() => _ChallengeDetailScreenState();
}

class _ChallengeDetailScreenState extends State<ChallengeDetailScreen> {
  ChallengeModel? _challenge;
  bool _isLoading = true;
  bool _isJoining = false;

  @override
  void initState() {
    super.initState();
    _loadChallenge();
  }

  Future<void> _loadChallenge() async {
    final challenge = await context.read<AppProvider>().challengeService.getChallenge(widget.challengeId);
    setState(() { _challenge = challenge; _isLoading = false; });
  }

  @override
  Widget build(BuildContext context) {
    final userId = context.read<AuthProvider>().userId ?? '';

    return Scaffold(
      appBar: AppBar(title: const Text('Challenge')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _challenge == null
              ? const Center(child: Text('Challenge not found'))
              : SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Cover image
                      if (_challenge!.coverImage != null)
                        CachedNetworkImage(
                          imageUrl: _challenge!.coverImage!,
                          width: double.infinity,
                          height: 200,
                          fit: BoxFit.cover,
                          placeholder: (_, __) => Container(height: 200, color: AppTheme.cardDarkElevated),
                          errorWidget: (_, __, ___) => _buildDefaultCover(),
                        )
                      else
                        _buildDefaultCover(),

                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Title and badges
                            Row(
                              children: [
                                if (_challenge!.isFeatured)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    margin: const EdgeInsets.only(right: 8),
                                    decoration: BoxDecoration(
                                      color: AppTheme.primaryColor.withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: const Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(Icons.star, size: 12, color: AppTheme.primaryColor),
                                        SizedBox(width: 4),
                                        Text('Featured', style: TextStyle(fontSize: 11, color: AppTheme.primaryColor, fontWeight: FontWeight.w600)),
                                      ],
                                    ),
                                  ),
                                if (_challenge!.category != null)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: AppTheme.cardDarkElevated,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(_challenge!.category!, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 10),

                            Text(_challenge!.title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
                            const SizedBox(height: 12),

                            // Creator
                            if (_challenge!.creator != null)
                              Row(
                                children: [
                                  UserAvatar(imageUrl: _challenge!.creator!.avatarUrlOrDefault, size: 28, fallbackName: _challenge!.creator!.displayName),
                                  const SizedBox(width: 8),
                                  Text('by ${_challenge!.creator!.displayName}', style: const TextStyle(color: AppTheme.textSecondary, fontSize: 14)),
                                ],
                              ),
                            const SizedBox(height: 16),

                            // Stats row
                            Row(
                              children: [
                                _statChip(Icons.people_outline, '${_challenge!.participantCount} participants'),
                                const SizedBox(width: 12),
                                if (_challenge!.endDate != null)
                                  _statChip(Icons.timer_outlined, 'Ends ${_formatDate(_challenge!.endDate!)}'),
                              ],
                            ),
                            const SizedBox(height: 20),

                            // Description
                            if (_challenge!.description != null) ...[
                              const Text('Description', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                              const SizedBox(height: 8),
                              Text(_challenge!.description!, style: const TextStyle(fontSize: 14, height: 1.5, color: AppTheme.textSecondary)),
                              const SizedBox(height: 16),
                            ],

                            // Rules
                            if (_challenge!.rules != null) ...[
                              const Text('Rules', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                              const SizedBox(height: 8),
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: AppTheme.cardDarkElevated,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: AppTheme.borderDark),
                                ),
                                child: Text(_challenge!.rules!, style: const TextStyle(fontSize: 14, height: 1.5, color: AppTheme.textSecondary)),
                              ),
                              const SizedBox(height: 16),
                            ],

                            // Prize
                            if (_challenge!.prizeDescription != null) ...[
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [AppTheme.primaryColor.withValues(alpha: 0.1), AppTheme.accentColor.withValues(alpha: 0.05)],
                                  ),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: AppTheme.primaryColor.withValues(alpha: 0.3)),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Row(
                                      children: [
                                        Icon(Icons.emoji_events, color: AppTheme.primaryColor, size: 20),
                                        SizedBox(width: 8),
                                        Text('Prize', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.primaryColor)),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Text(_challenge!.prizeDescription!, style: const TextStyle(fontSize: 14, color: AppTheme.textSecondary)),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 20),
                            ],

                            // Join button
                            SizedBox(
                              width: double.infinity,
                              height: 50,
                              child: ElevatedButton.icon(
                                onPressed: _isJoining ? null : () async {
                                  setState(() => _isJoining = true);
                                  try {
                                    await context.read<AppProvider>().challengeService.joinChallenge(widget.challengeId);
                                    if (mounted) {
                                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Joined challenge!')));
                                    }
                                  } catch (e) {
                                    if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                                  }
                                  setState(() => _isJoining = false);
                                },
                                icon: _isJoining ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.flag_outlined),
                                label: Text(_isJoining ? 'Joining...' : 'Join Challenge'),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }

  Widget _buildDefaultCover() {
    return Container(
      width: double.infinity,
      height: 160,
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [AppTheme.primaryColor.withValues(alpha: 0.3), AppTheme.surfaceDark]),
      ),
      child: const Center(child: Icon(Icons.emoji_events, size: 48, color: AppTheme.primaryColor)),
    );
  }

  Widget _statChip(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppTheme.cardDarkElevated,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppTheme.textMuted),
          const SizedBox(width: 6),
          Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
        ],
      ),
    );
  }

  String _formatDate(String dateStr) {
    final date = DateTime.tryParse(dateStr);
    if (date == null) return dateStr;
    return DateFormat('MMM d, yyyy').format(date);
  }
}
