# BGK Yadgiri - Android APK Build Guide 🚀

This project is fully configured as a native Android application using **Capacitor 8** and **Gradle**.

---

## ⚡ Method 1: Automatic Cloud Build via GitHub Actions (Zero Setup Required)

This repository includes a pre-configured GitHub Actions workflow in `.github/workflows/build-apk.yml`.

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Configure Android APK mobile build"
   git push origin main
   ```
2. Open your repository on GitHub and click the **"Actions"** tab.
3. Click on the running workflow: **"Build Android APK (BGK Yadgiri)"**.
4. Once completed (~2-3 minutes), scroll to the **Artifacts** section at the bottom.
5. Download **`BGK-Yadgiri-Omnitrix-Alarm-v1.0-debug.apk`** and install it directly on your Android phone!

---

## 💻 Method 2: Build Locally using Command Line

If you have JDK 17+ and the Android SDK installed on your computer:

```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Build the web distribution and sync to Android
npm run build:mobile

# 3. Compile the debug APK
npm run build:apk
```

The generated APK will be at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📱 Method 3: Open in Android Studio

To run directly on an emulator or connected physical Android device:

```bash
# Open the project in Android Studio
npm run mobile:open
```

Or open Android Studio manually, choose **"Open an Existing Project"**, and select the `android/` directory. Then click **Run (Shift + F10)**.

---

## 🛠 Project Structure & Configuration Details

- **Package ID / Application ID:** `com.bgkyadgiri.alarm`
- **App Name:** `BGK Yadgiri`
- **Capacitor Config:** `capacitor.config.json`
- **Android Manifest:** `android/app/src/main/AndroidManifest.xml`
  - Includes `WAKE_LOCK`, `VIBRATE`, `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`, and `RECEIVE_BOOT_COMPLETED` permissions so alarms ring reliably in the background.
- **Ben 10 / Omnitrix Theme Resources:** `android/app/src/main/res/values/colors.xml` configured with vibrant `#00FF66` neon green and `#070B12` deep space dark background.
