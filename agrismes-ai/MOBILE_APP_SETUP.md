# SMEFlow Mobile App Setup Guide

This guide provides instructions for building and deploying the SMEFlow mobile app for both iOS and Android platforms.

## Prerequisites

- Node.js 18+ installed
- Git installed
- For iOS: macOS with Xcode 15+ installed
- For Android: Android Studio with Android SDK installed

## Initial Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository from GitHub
git clone <your-github-repo-url>
cd <project-folder>

# Install dependencies
npm install

# Build the web app
npm run build
```

### 2. Initialize Capacitor

Capacitor is already configured in `capacitor.config.ts`. The key settings are:
- **App ID**: `com.fundmysme.smeflow`
- **App Name**: `SMEFlow`
- **Web Directory**: `dist`

---

## iOS Setup

### Prerequisites
- macOS (required for iOS development)
- Xcode 15+ from the App Store
- Apple Developer Account (for App Store distribution)

### 1. Add iOS Platform

```bash
npx cap add ios
```

### 2. Update iOS Dependencies

```bash
npx cap update ios
```

### 3. Sync Web Assets

```bash
npm run build
npx cap sync ios
```

### 4. Add Required Permissions

The iOS project needs camera and photo library permissions. Add these to `ios/App/App/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>SMEFlow needs camera access for crop and commodity analysis</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>SMEFlow needs photo library access for commodity image analysis</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>SMEFlow needs permission to save analysis certificates</string>
```

### 5. Add App Icons

1. Open `ios/App/App/Assets.xcassets/AppIcon.appiconset`
2. Replace the icon images with the SMEFlow logo in required sizes:
   - 20pt (40px, 60px)
   - 29pt (58px, 87px)
   - 40pt (80px, 120px)
   - 60pt (120px, 180px)
   - 76pt (152px)
   - 83.5pt (167px)
   - 1024pt (1024px) - App Store icon

### 6. Configure Signing

1. Open `ios/App/App.xcworkspace` in Xcode
2. Select the "App" target
3. Go to "Signing & Capabilities"
4. Select your Team (Apple Developer account)
5. Ensure "Automatically manage signing" is checked
6. Update Bundle Identifier to `com.fundmysme.smeflow`

### 7. Build for Testing (Simulator)

```bash
npx cap run ios
```

Or open in Xcode:
```bash
npx cap open ios
```
Then click the Play button in Xcode.

### 8. Archive for App Store / TestFlight

1. Open `ios/App/App.xcworkspace` in Xcode
2. Select "Any iOS Device (arm64)" as the destination
3. Go to **Product > Archive**
4. Once archived, click **Distribute App**
5. Select **App Store Connect** for TestFlight/App Store distribution
6. Follow the prompts to upload

### Important iOS Notes

- Bundle ID: `com.fundmysme.smeflow`
- Minimum iOS version: 13.0
- Enable Associated Domains if needed for deep linking

---

## Android Setup

### Prerequisites
- Android Studio (latest version)
- Android SDK (API level 22+)
- Java Development Kit (JDK 17+)

### 1. Add Android Platform

```bash
npx cap add android
```

### 2. Update Android Dependencies

```bash
npx cap update android
```

### 3. Sync Web Assets

```bash
npm run build
npx cap sync android
```

### 4. Add Required Permissions

Permissions are typically auto-configured, but verify in `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### 5. Add App Icon

1. Place the SMEFlow logo (512x512 PNG) in your project
2. In Android Studio, right-click `res` folder > **New > Image Asset**
3. Select the logo and generate adaptive icons

Alternatively, replace files in:
- `android/app/src/main/res/mipmap-hdpi/`
- `android/app/src/main/res/mipmap-mdpi/`
- `android/app/src/main/res/mipmap-xhdpi/`
- `android/app/src/main/res/mipmap-xxhdpi/`
- `android/app/src/main/res/mipmap-xxxhdpi/`

### 6. Configure for Release

#### Create Release Keystore

```bash
keytool -genkey -v -keystore smeflow-release.keystore -alias smeflow -keyalg RSA -keysize 2048 -validity 10000
```

Keep this keystore file safe - you'll need it for all future updates!

#### Configure Signing in Gradle

Edit `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file("smeflow-release.keystore")
            storePassword "your-store-password"
            keyAlias "smeflow"
            keyPassword "your-key-password"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 7. Build for Testing

```bash
npx cap run android
```

Or open in Android Studio:
```bash
npx cap open android
```

### 8. Build Release AAB (for Play Store)

```bash
cd android
./gradlew bundleRelease
```

The AAB file will be at:
`android/app/build/outputs/bundle/release/app-release.aab`

### 9. Upload to Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app or select existing
3. Go to **Release > Production** (or Internal Testing)
4. Upload the `.aab` file
5. Complete the store listing
6. Submit for review

### Important Android Notes

- Application ID: `com.fundmysme.smeflow`
- Minimum SDK: 22 (Android 5.1)
- Target SDK: 34 (Android 14)

---

## Updating the App

After making changes to the web app:

```bash
# Build web assets
npm run build

# Sync to native platforms
npx cap sync

# Or sync specific platform
npx cap sync ios
npx cap sync android
```

## Troubleshooting

### iOS Issues
- If Xcode signing fails, ensure you have a valid Apple Developer account
- For camera issues, verify Info.plist permissions are correctly added

### Android Issues
- If build fails, try `./gradlew clean` in the android folder
- For permission issues, ensure all permissions are in AndroidManifest.xml

## App Store Metadata

### App Name
SMEFlow

### Category
Business

### Short Description
Agribusiness & Trade Tools

### Full Description
SMEFlow provides AI-powered agricultural analysis tools for SME traders and farmers. Access quality control, moisture analysis, and crop health assessments directly from your mobile device. Part of the FundMySME Trade Readiness Platform.

### Keywords
agriculture, farming, commodity trading, quality control, crop health, SME, trade, export

---

## Support

For technical support, contact the FundMySME development team.
