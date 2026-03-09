/// Centralized asset paths for the Krishna Connect mobile app.
/// These mirror the webapp's public/ folder structure.
class AppAssets {
  AppAssets._();

  // Logos
  static const String logo = 'assets/logo/krishna_connect.png';
  static const String logoLight = 'assets/logo/light_KCS.png';
  static const String logoLightSvg = 'assets/logo/light_KCS.svg';
  static const String logoDark = 'assets/logo/dark_KCS.png';
  static const String gurudev = 'assets/logo/Gurudev.jpg';
  static const String srilaPrabhupada = 'assets/logo/Srila-Prabhupada.png';

  // User avatars (default placeholders)
  static const String avatarMale = 'assets/user_avatar/male.png';
  static const String avatarFemale = 'assets/user_avatar/female.png';
  static const String badgeVerified = 'assets/user_avatar/verified.png';
  static const String badgeKcsVerified = 'assets/user_avatar/KCS-verified.png';
  static const String placeholderUser = 'assets/images/placeholder-user.jpg';

  // Server avatar URLs (used when creating/updating profiles, matching webapp)
  static const String serverAvatarMale = '/user_Avatar/male.png';
  static const String serverAvatarFemale = '/user_Avatar/female.png';

  /// Returns the server avatar URL based on gender.
  static String serverAvatarForGender(String gender) {
    return gender == 'male' ? serverAvatarMale : serverAvatarFemale;
  }

  // Emoji
  static const String emoji1 = 'assets/emoji/1.png';
  static const String emoji2 = 'assets/emoji/2.png';
  static const String emoji3 = 'assets/emoji/3.png';

  // Backgrounds
  static const String bgBanner = 'assets/backgrounds/banner.png';
  static const String bgIndia = 'assets/backgrounds/india-bg.png';
  static const String bgC = 'assets/backgrounds/c.png';
  static const String bgC1 = 'assets/backgrounds/c1.png';
  static const String bgC2 = 'assets/backgrounds/c2.png';

  // Chat backgrounds
  static const String chatBgLight = 'assets/chat_bg/light.png';
  static const String chatBgDark = 'assets/chat_bg/dark.png';
  static const String chatBg3 = 'assets/chat_bg/BG_3.svg';
  static const String chatBg4 = 'assets/chat_bg/BG_4.png';

  // Icons
  static const String iconLeela = 'assets/icons/leela.png';
  static const String iconApp192 = 'assets/icons/android-chrome-192x192.png';
  static const String iconApp512 = 'assets/icons/android-chrome-512x512.png';
  static const String iconGoogle = 'assets/icons/google.svg';

  // Text / Media
  static const String krishnaImage = 'assets/text/krishna.jpg';
  // Note: krishna.mp4 is too large for bundling (52MB) — load from network URL instead

  // Data
  static const String promotedContent = 'assets/data/promoted_content.json';

  // Stickers directory (use with index)
  static const String stickersDir = 'assets/stickers/';

  /// Get sticker path by number (1-97).
  static String sticker(int number) {
    // Handle different extensions per sticker
    if (number <= 2 || (number >= 85 && number <= 97)) {
      return 'assets/stickers/STK_$number.jpg';
    }
    if (number >= 14 && number <= 26 || (number >= 78 && number <= 84)) {
      return 'assets/stickers/STK_$number.PNG';
    }
    if (number == 11 || number == 12 || number == 13) {
      // SVGs exist but PNGs too for 11
      return 'assets/stickers/STK_$number.svg';
    }
    return 'assets/stickers/STK_$number.png';
  }
}
