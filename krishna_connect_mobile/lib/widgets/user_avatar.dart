import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../config/theme.dart';
import '../models/user_model.dart';

class UserAvatar extends StatelessWidget {
  final String? imageUrl;
  final double size;
  final String? fallbackName;
  final bool showBorder;
  final Color? borderColor;
  final bool isOnline;

  const UserAvatar({
    super.key,
    this.imageUrl,
    this.size = 40,
    this.fallbackName,
    this.showBorder = false,
    this.borderColor,
    this.isOnline = false,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: showBorder
                ? Border.all(color: borderColor ?? AppTheme.primaryColor, width: 2)
                : null,
          ),
          child: ClipOval(
            child: imageUrl != null && imageUrl!.isNotEmpty
                ? CachedNetworkImage(
                    imageUrl: imageUrl!,
                    fit: BoxFit.cover,
                    width: size,
                    height: size,
                    placeholder: (context, url) => Container(
                      color: AppTheme.cardDarkElevated,
                      child: Center(
                        child: Text(
                          _getInitials(),
                          style: TextStyle(
                            color: AppTheme.primaryColor,
                            fontSize: size * 0.35,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                    errorWidget: (context, url, error) => _buildFallback(),
                  )
                : _buildFallback(),
          ),
        ),
        if (isOnline)
          Positioned(
            bottom: 0,
            right: 0,
            child: Container(
              width: size * 0.28,
              height: size * 0.28,
              decoration: BoxDecoration(
                color: AppTheme.successColor,
                shape: BoxShape.circle,
                border: Border.all(
                  color: Theme.of(context).scaffoldBackgroundColor,
                  width: 2,
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildFallback() {
    return Container(
      color: AppTheme.cardDarkElevated,
      child: Center(
        child: Text(
          _getInitials(),
          style: TextStyle(
            color: AppTheme.primaryColor,
            fontSize: size * 0.35,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  String _getInitials() {
    if (fallbackName == null || fallbackName!.isEmpty) return '?';
    final parts = fallbackName!.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }
}

class VerificationBadge extends StatelessWidget {
  final String verified;
  final double size;

  const VerificationBadge({
    super.key,
    required this.verified,
    this.size = 16,
  });

  @override
  Widget build(BuildContext context) {
    if (verified == 'none') return const SizedBox.shrink();
    
    return Icon(
      Icons.verified,
      size: size,
      color: verified == 'kcs' ? AppTheme.kcsColor : AppTheme.verifiedColor,
    );
  }
}

class UserIdentity extends StatelessWidget {
  final UserModel user;
  final double avatarSize;
  final bool showUsername;
  final TextStyle? nameStyle;
  final TextStyle? usernameStyle;
  final Widget? trailing;
  final VoidCallback? onTap;

  const UserIdentity({
    super.key,
    required this.user,
    this.avatarSize = 40,
    this.showUsername = true,
    this.nameStyle,
    this.usernameStyle,
    this.trailing,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Row(
        children: [
          UserAvatar(
            imageUrl: user.avatarUrlOrDefault,
            size: avatarSize,
            fallbackName: user.displayName,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        user.displayName,
                        style: nameStyle ?? const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 15,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (user.isVerified) ...[
                      const SizedBox(width: 4),
                      VerificationBadge(verified: user.verified, size: 15),
                    ],
                  ],
                ),
                if (showUsername && user.username != null)
                  Text(
                    '@${user.username}',
                    style: usernameStyle ?? TextStyle(
                      color: AppTheme.textMuted,
                      fontSize: 13,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
              ],
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}
