# The Android app

The site, packed into an Android app with [Capacitor](https://capacitorjs.com) (`apps/android`). It's the
same build as the website, soundtrack included, reading the same API, so the story data stays current
without a new APK; a change to the pages or the look needs a new release.

| Part                     | Where                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------- |
| Capacitor settings       | [`apps/android/capacitor.config.ts`](../apps/android/capacitor.config.ts)              |
| Builds the site for it   | [`apps/android/scripts/build-web.ts`](../apps/android/scripts/build-web.ts)            |
| The Android project      | [`apps/android/android`](../apps/android/android) (generated once, then kept)          |
| Back button, music pause | [`apps/web/src/native/android.ts`](../apps/web/src/native/android.ts), only in the app |
| Releases                 | [`.github/workflows/android.yml`](../.github/workflows/android.yml)                    |

The launcher icon (`res/mipmap-*`) and the opening screen (`res/drawable*/splash.png`, the icon on
night blue) are made from one 1024×1024 PNG, for now a placeholder until the final icon is done.

Inside the app, the page sits clear of the status and navigation bars (`--safe-area-inset-*` from
Capacitor, with a night-dark strip under each so the page scrolls beneath them), the back button closes search or the menu, then goes back a page, then home, then leaves
the app, and the music rests while the app is out of sight.

## Releasing

Push a tag named for the version, e.g. `v1.0.0`. The workflow builds the APK, signs it, and attaches it
to a GitHub Release of that name. Each part of the version goes up to 99; a higher version installs over
a lower one.

## The signing key (once)

Android only installs an update over an app signed with the same key, so this key signs every release.
**Keep a backup of it and its password somewhere safe (a password manager); if it's lost, people have to
uninstall the app before installing a newer one.**

1. Make the key, in PowerShell, in a folder outside this repository (Documents here). It asks for a
   password (twice) and a few name questions (Enter skips them):

   ```powershell
   cd $HOME\Documents
   & "D:\Java\jdk-21.0.13+9\bin\keytool.exe" -genkeypair -keystore ffvii-release.jks -alias ffvii -keyalg RSA -keysize 4096 -validity 10000
   ```

2. Hand it to GitHub as the first secret with the GitHub CLI, straight from the file (no clipboard, so
   nothing can be pasted in its place). The full path matters: .NET doesn't follow PowerShell's `cd`.

   ```powershell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("$HOME\Documents\ffvii-release.jks")) | gh secret set ANDROID_KEYSTORE_BASE64
   ```

3. On GitHub, open the repository's **Settings → Secrets and variables → Actions → New repository
   secret** and add the other three:

   | Name                        | Value                                         |
   | --------------------------- | --------------------------------------------- |
   | `ANDROID_KEYSTORE_PASSWORD` | the password from step 1                      |
   | `ANDROID_KEY_ALIAS`         | `ffvii`                                       |
   | `ANDROID_KEY_PASSWORD`      | the same password (keytool uses one for both) |

`*.jks` files are git-ignored, but keep the key outside the repository anyway.

## Building on this PC

Needs the JDK 21 and the Android SDK (Android Studio's, or its command-line tools).

```bash
pnpm --filter @ffvii/android sync
```

builds the site and copies it into the Android project. Then, in `apps/android/android`, with
`JAVA_HOME` pointing at the JDK, `gradlew assembleDebug` makes a debug APK in
`app/build/outputs/apk/debug/` that installs on an emulator or a phone with USB debugging
(`adb install -r app-debug.apk`). A file `local.properties` there, with
`sdk.dir=C:/Users/<you>/AppData/Local/Android/Sdk`, tells Gradle where the SDK is (it's git-ignored).
