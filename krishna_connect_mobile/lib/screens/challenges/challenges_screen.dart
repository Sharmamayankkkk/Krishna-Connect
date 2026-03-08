import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/theme.dart';
import '../../providers/app_provider.dart';
import '../../models/models.dart';
import '../../widgets/user_avatar.dart';

class ChallengesScreen extends StatefulWidget {
  const ChallengesScreen({super.key});
  @override
  State<ChallengesScreen> createState() => _ChallengesScreenState();
}

class _ChallengesScreenState extends State<ChallengesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().loadChallenges();
    });
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Challenges'),
        actions: [
          IconButton(icon: const Icon(Icons.add), onPressed: () => context.push('/create-challenge')),
        ],
      ),
      body: app.challenges.isEmpty
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.emoji_events_outlined, size: 64, color: AppTheme.textMuted),
                  SizedBox(height: 16),
                  Text('No challenges yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
                  SizedBox(height: 6),
                  Text('Challenges will appear here', style: TextStyle(color: AppTheme.textMuted)),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: () => app.loadChallenges(),
              child: ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: app.challenges.length,
                itemBuilder: (context, index) => _buildChallengeCard(context, app.challenges[index]),
              ),
            ),
    );
  }

  Widget _buildChallengeCard(BuildContext context, ChallengeModel challenge) {
    return GestureDetector(
      onTap: () => context.push('/challenge/${challenge.id}'),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: AppTheme.cardDark,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.borderDark),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (challenge.coverImage != null)
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
                child: CachedNetworkImage(
                  imageUrl: challenge.coverImage!,
                  width: double.infinity,
                  height: 140,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(height: 140, color: AppTheme.cardDarkElevated),
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      if (challenge.isFeatured)
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
                      if (challenge.category != null)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppTheme.cardDarkElevated,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(challenge.category!, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                        ),
                      const Spacer(),
                      if (!challenge.isActive)
                        const Text('Ended', style: TextStyle(color: AppTheme.textMuted, fontSize: 11)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(challenge.title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
                  if (challenge.description != null) ...[
                    const SizedBox(height: 4),
                    Text(challenge.description!, style: const TextStyle(color: AppTheme.textMuted, fontSize: 13), maxLines: 2, overflow: TextOverflow.ellipsis),
                  ],
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      if (challenge.creator != null) ...[
                        UserAvatar(imageUrl: challenge.creator!.avatarUrlOrDefault, size: 22, fallbackName: challenge.creator!.displayName),
                        const SizedBox(width: 6),
                        Text(challenge.creator!.displayName, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                      ],
                      const Spacer(),
                      const Icon(Icons.people_outline, size: 14, color: AppTheme.textMuted),
                      const SizedBox(width: 4),
                      Text('${challenge.participantCount}', style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
