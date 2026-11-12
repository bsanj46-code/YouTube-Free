# YouTube Free — Ютуб Фре

Personal Android fork of [NewPipe](https://github.com/TeamNewPipe/NewPipe), based on **v0.29.3**.
This is an independent project, not an official Google, YouTube or NewPipe release.

## Скачать на телефон или планшет

[Скачать YouTube-Free.apk](https://github.com/bsanj46-code/YouTube-Free/releases/latest/download/YouTube-Free.apk)

The same universal APK works on Android phones and tablets (Android 6.0+).
This link becomes available after the first successful build.

## Features inherited from NewPipe

- Search videos and channels; fullscreen and background audio playback.
- Local subscriptions, playlists and history without a Google account.
- Dark theme by default; tablet layouts.
- Direct media playback without YouTube advertising slots. Availability depends on changes made by YouTube; sponsored material embedded by video creators is not automatically removed.

## Changes in this fork

2026-11-12: renamed the app to YouTube Free, assigned a separate application ID
`ua.bashaiev.youtubefree`, enabled the dark default, added signed universal APK
builds and GitHub Releases downloads. Original NewPipe playback and local data features are preserved.

## Build and update

Push to `dev` or manually run **YouTube Free APK** in GitHub Actions.
JDK 21 and the Android SDK are configured by the workflow.
The two repository secrets `YT_KEYSTORE_B64` and `YT_KEYSTORE_PASSWORD`
contain the private signing key and password. They are never stored in source or release assets.
Keep these secrets unchanged to install future APK updates over the existing app without losing data.
Successful builds publish a signed APK and checksum; failing builds do not replace the latest release.

## License and source

Copyright belongs to the original NewPipe contributors and respective dependency authors.
This fork and its modifications are licensed under **GPL-3.0-or-later**.
The complete license is in [LICENSE](LICENSE). Existing source headers and dependency
license notices are retained. Complete corresponding source and build files for each APK
are available at its release tag using GitHub's source archives.

Original project documentation: [doc/README.md](doc/README.md).
