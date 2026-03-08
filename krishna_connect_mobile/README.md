# Krishna Connect Mobile

**Krishna Connect — Where Devotees Unite** 🙏

A full-featured Flutter mobile app for the Krishna Connect social platform, supporting both iOS and Android. Built with Flutter, Supabase, and Material Design 3.

---

## 📱 Features

- **Authentication** — Email/password sign up & login, password reset, profile completion
- **Feed** — Create posts with text, images, polls; like, comment, repost, bookmark
- **Stories** — Create and view ephemeral stories with photos/videos
- **Chat** — Real-time direct messages and group chats with media attachments
- **Explore** — Discover trending content, hashtags, and suggested users
- **Search** — Search users and posts
- **Events** — Browse, create, and RSVP to community events
- **Challenges** — Join and create community challenges
- **Leela** — Short-form vertical video feed (TikTok-style)
- **Notifications** — Real-time push notifications for likes, comments, follows, messages, and more
- **Profile** — User profiles with posts, media grid, followers/following, verification badges
- **Bookmarks** — Save posts with collection management
- **Settings** — Theme toggle (dark/light), account settings, privacy controls

---

## 🛠 Prerequisites

Before you start, ensure you have the following installed:

### Required

| Tool | Version | Install Guide |
|------|---------|---------------|
| **Flutter SDK** | 3.24+ (Dart 3.11+) | [flutter.dev/get-started](https://docs.flutter.dev/get-started/install) |
| **Git** | Any recent version | [git-scm.com](https://git-scm.com/) |

### For Android Development

| Tool | Version | Install Guide |
|------|---------|---------------|
| **Android Studio** | Latest | [developer.android.com/studio](https://developer.android.com/studio) |
| **Android SDK** | API 21+ (minSdk) | Via Android Studio SDK Manager |
| **Java JDK** | 17 | Via Android Studio or [adoptium.net](https://adoptium.net/) |

### For iOS Development (macOS only)

| Tool | Version | Install Guide |
|------|---------|---------------|
| **Xcode** | 15+ | [Mac App Store](https://apps.apple.com/app/xcode/id497799835) |
| **CocoaPods** | Latest | `sudo gem install cocoapods` |

### Verify Installation

```bash
flutter doctor
```

You should see checkmarks (✓) for Flutter, Android toolchain, and (on macOS) Xcode.

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Sharmamayankkkk/Krishna-Connect.git
cd Krishna-Connect/krishna_connect_mobile
```

### 2. Install Dependencies

```bash
flutter pub get
```

### 3. Configure Supabase

This app connects to the same Supabase backend as the web app. You need your Supabase project credentials.

**Option A: Using a `.env` file (recommended for development)**

```bash
# Copy the example file
cp .env.example .env

# Edit .env and fill in your Supabase credentials
# SUPABASE_URL=https://your-project-id.supabase.co
# SUPABASE_ANON_KEY=your-anon-key-here
```

Then simply run:
```bash
flutter run
```

**Option B: Using `--dart-define` flags (recommended for CI/CD)**

```bash
flutter run \
  --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your-anon-key-here
```

> **Note:** `--dart-define` values take priority over `.env` file values.

**Option C: VS Code launch configuration**

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Krishna Connect (Debug)",
      "request": "launch",
      "type": "dart",
      "args": [
        "--dart-define=SUPABASE_URL=https://your-project.supabase.co",
        "--dart-define=SUPABASE_ANON_KEY=your-anon-key-here"
      ]
    }
  ]
}
```

> **Where to find your Supabase keys:**
> 1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
> 2. Select your project
> 3. Go to **Settings → API**
> 4. Copy `Project URL` → this is your `SUPABASE_URL`
> 5. Copy `anon/public` key → this is your `SUPABASE_ANON_KEY`
>
> These are the **same keys** used by the Next.js web app (`SUPABASE_URL` and `SUPABASE_ANON_KEY` in your web app's `.env`).

### 4. Run the App

```bash
# If you have a .env file configured:
flutter run

# Or with explicit credentials:
flutter run \
  --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your-anon-key-here

# Run on a specific device
flutter devices              # List available devices
flutter run -d <device-id>   # Run on specific device
```

> **If credentials are missing**, the app will show a setup screen explaining what's needed.

---

## 📂 Project Structure

```
krishna_connect_mobile/
├── lib/
│   ├── main.dart                    # App entry point, service initialization
│   ├── app.dart                     # MaterialApp.router with theming
│   ├── config/
│   │   ├── routes.dart              # GoRouter navigation (25+ routes)
│   │   ├── theme.dart               # Material Design 3 dark/light theme
│   │   └── supabase_config.dart     # Supabase client configuration
│   ├── models/
│   │   ├── user_model.dart          # User profile model
│   │   ├── post_model.dart          # Post, Comment, Media, Poll models
│   │   ├── chat_model.dart          # Chat, Message, Participant models
│   │   └── models.dart              # Event, Notification, Story, Challenge, Leela models
│   ├── providers/
│   │   ├── auth_provider.dart       # Authentication state
│   │   ├── app_provider.dart        # Feed, chats, events, notifications state
│   │   └── theme_provider.dart      # Theme mode toggle
│   ├── services/
│   │   ├── auth_service.dart        # Auth operations (login, signup, reset)
│   │   ├── post_service.dart        # Post CRUD, comments, search, polls
│   │   ├── chat_service.dart        # Chat, messages, realtime subscriptions
│   │   ├── profile_service.dart     # Profile, follows, avatar upload
│   │   ├── push_notification_service.dart  # Local push notifications
│   │   └── services.dart            # Event, Story, Challenge, Leela, Bookmark services
│   ├── widgets/
│   │   ├── post_card.dart           # Post display widget
│   │   ├── message_bubble.dart      # Chat message bubble
│   │   ├── user_avatar.dart         # Avatar, verification badge
│   │   └── story_widgets.dart       # Story circle, stories bar
│   └── screens/
│       ├── auth/                    # Login, signup, forgot password, complete profile
│       ├── home/                    # Main tab navigation
│       ├── feed/                    # Feed, post detail, create post
│       ├── chat/                    # Chat list, chat detail
│       ├── profile/                 # Profile view, edit profile
│       ├── explore/                 # Explore/discover screen
│       ├── search/                  # Search users & posts
│       ├── events/                  # Events list, event detail
│       ├── stories/                 # Create story, story viewer
│       ├── challenges/              # Challenges list, detail, create
│       ├── leela/                   # Short video feed
│       ├── notifications/           # Notifications list
│       ├── bookmarks/               # Saved posts & collections
│       └── settings/                # App settings
├── assets/
│   ├── images/                      # App images
│   └── icons/                       # Custom icons
├── android/                         # Android platform files
├── ios/                             # iOS platform files
├── test/                            # Unit & widget tests
└── pubspec.yaml                     # Dependencies & configuration
```

---

## 🏗 Building for Production

### Android APK (for testing)

```bash
# Using .env file:
flutter build apk --release

# Or with explicit credentials:
flutter build apk \
  --release \
  --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your-anon-key-here
```

Output: `build/app/outputs/flutter-apk/app-release.apk`

### Android App Bundle (for Play Store)

```bash
# Using .env file:
flutter build appbundle --release

# Or with explicit credentials:
flutter build appbundle \
  --release \
  --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your-anon-key-here
```

Output: `build/app/outputs/bundle/release/app-release.aab`

> **Before Play Store release**, you need to:
> 1. Create a signing key: `keytool -genkeypair -v -keystore ~/krishna-connect.jks -keyalg RSA -keysize 2048 -validity 10000 -alias krishna-connect`
> 2. Configure signing in `android/app/build.gradle.kts` — replace the debug signing config with your release config
> 3. Update `android/app/build.gradle.kts`:
>    ```kotlin
>    signingConfigs {
>        create("release") {
>            keyAlias = "krishna-connect"
>            keyPassword = System.getenv("KEY_PASSWORD")
>            storeFile = file(System.getenv("KEYSTORE_PATH") ?: "~/krishna-connect.jks")
>            storePassword = System.getenv("STORE_PASSWORD")
>        }
>    }
>    buildTypes {
>        release {
>            signingConfig = signingConfigs.getByName("release")
>        }
>    }
>    ```

### iOS (for App Store)

```bash
# Install iOS dependencies
cd ios && pod install && cd ..

# Using .env file:
flutter build ios --release

# Or with explicit credentials:
flutter build ios \
  --release \
  --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your-anon-key-here
```

> **Before App Store release**, you need to:
> 1. Open `ios/Runner.xcworkspace` in Xcode
> 2. Set your **Team** in Signing & Capabilities
> 3. Update the **Bundle Identifier** to your own (e.g., `com.yourcompany.krishnaconnect`)
> 4. Archive and upload to App Store Connect

---

## 🧪 Running Tests

```bash
# Run all unit tests
flutter test

# Run tests with coverage
flutter test --coverage

# Run a specific test file
flutter test test/widget_test.dart
```

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `supabase_flutter` | Backend (Auth, Database, Realtime, Storage) |
| `flutter_dotenv` | Load `.env` file for Supabase credentials |
| `provider` | State management |
| `go_router` | Declarative routing with auth guards |
| `cached_network_image` | Image caching and loading |
| `image_picker` | Camera and gallery access |
| `video_player` / `chewie` | Video playback |
| `flutter_local_notifications` | Push notifications |
| `google_fonts` | Inter typography (matching webapp) |
| `timeago` | Relative time formatting |
| `intl` | Date/number formatting |
| `url_launcher` | Opening external links |
| `share_plus` | Native share sheet |
| `photo_view` | Zoomable image viewer |
| `flutter_animate` | Animations |

---

## 🔧 Troubleshooting

### Common Issues

**"Supabase URL is empty" or "No host specified in URI" error**
- Create a `.env` file in the `krishna_connect_mobile/` directory: `cp .env.example .env`
- Fill in your `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Or pass them via `--dart-define` flags when running
- Verify the URL starts with `https://` and the key is the `anon` (public) key

**Android build fails with "SDK not found"**
- Run `flutter doctor` and follow any setup instructions
- Ensure Android SDK is installed via Android Studio → SDK Manager
- Accept SDK licenses: `flutter doctor --android-licenses`

**iOS build fails with "No signing certificate"**
- Open `ios/Runner.xcworkspace` in Xcode
- Select Runner → Signing & Capabilities → select your Team
- You need an Apple Developer account for device builds

**"CocoaPods not installed" on macOS**
```bash
sudo gem install cocoapods
cd ios && pod install && cd ..
```

**Gradle build errors on Android**
```bash
cd android && ./gradlew clean && cd ..
flutter clean
flutter pub get
flutter run
```

**Images not loading / broken network images**
- Ensure your device/emulator has internet access
- Check that the Supabase Storage bucket is set to public (for avatar/media URLs)

**Push notifications not showing**
- On Android 13+: the app will request notification permission at startup
- On iOS: accept the notification permission prompt when it appears
- Ensure your device is not in Do Not Disturb mode

### Reset Everything

```bash
flutter clean
flutter pub get
cd ios && pod install && cd ..  # macOS only
flutter run
```

---

## 🏛 Architecture

```
┌─────────────────────────────────────────────────┐
│                   Flutter App                    │
├─────────┬─────────┬─────────┬──────────────────┤
│ Screens │ Widgets │ Models  │ Config           │
│ (UI)    │ (Shared)│ (Data)  │ (Theme, Routes)  │
├─────────┴────┬────┴─────────┴──────────────────┤
│           Providers (State Management)           │
│   AuthProvider  │  AppProvider  │ ThemeProvider  │
├────────────────┬┴───────────────┴───────────────┤
│              Services (Business Logic)            │
│  Auth │ Post │ Chat │ Profile │ Push │ Event │.. │
├───────┴──────┴──────┴─────────┴──────┴───────┴──┤
│           Supabase Flutter SDK                    │
│     Auth  │  Database  │  Realtime  │  Storage   │
└───────────┴────────────┴───────────┴────────────┘
```

---

## 📋 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous/public key | `eyJhbGciOiJIUzI1NiIs...` |

These are passed via `--dart-define` at build time.

---

## 📄 License

Part of the Krishna Connect platform. See the root repository for license information.
