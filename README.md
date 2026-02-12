# Niv AI — Mobile App

<div align="center">
  <h1>📱 Niv AI</h1>
  <p><strong>Your ERPNext AI Assistant — On Your Phone</strong></p>
  
  <br>

  [![Download APK](https://img.shields.io/badge/⬇️_Download_APK-v1.0.0-8b5cf6?style=for-the-badge&logo=android&logoColor=white)](https://github.com/kulharir7/niv_ai_mobile/releases/latest/download/niv-ai.apk)

  <br>
  
  <a href="https://github.com/kulharir7/niv_ai_mobile/releases/latest/download/niv-ai.apk">
    <img src="https://img.shields.io/badge/Android-Download_APK-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Download APK" />
  </a>

  <br><br>

  ![Version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)
  ![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-lightgrey?style=flat-square)
  ![Expo SDK](https://img.shields.io/badge/Expo%20SDK-54-000020?style=flat-square)
  ![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
</div>

---

## 📥 Install

### Android
1. **Click the Download button above** — APK file download hogi
2. Phone pe file open karo
3. "Install from unknown sources" allow karo (ek baar)
4. Install karo ✅

### iOS (Coming Soon)
TestFlight link available soon.

### Development (Expo Go)
```bash
npm install
npx expo start
# Scan QR with Expo Go app
```

---

## 🔗 Connect to Server

1. Open Niv AI app
2. **Server URL** dalo (your ERPNext server address)
3. **Pairing Code** dalo:
   - **Admin**: ERPNext → Niv Settings → 📱 Mobile App → Generate Code
   - **Self-Service**: Go to `your-server.com/mobile-connect`
4. Tap **Connect** — Done! 🎉

---

## ✨ Features

### 💬 AI Chat
- SSE streaming responses (real-time)
- Markdown rendering — bold, italic, headers, code blocks, tables
- Tool call display with ⚡ chips
- Animated typing indicator

### 📂 Conversations
- Slide-out drawer with all chats
- Search, pin 📌, delete conversations
- Auto-save locally

### 🎯 Quick Actions
- Create **Customer**, **Sales Order**, **Invoice**, **ToDo**, **Note**
- One-tap document creation from ⚡ button

### 🔊 Voice
- Text-to-Speech on AI messages (Hindi + English)
- Tap 🔊 to hear any response

### 📋 Message Actions
- Long press → Copy, Share, Speak
- 👍👎 reactions on AI messages
- Stop streaming ■ button

### 🎨 Themes
- 🌙 Dark mode (AMOLED black)
- ☀️ Light mode
- Toggle from Settings

### 🔐 Security
- Biometric lock (Fingerprint / Face ID)
- Token-based authentication
- Auto-verify on app restart

### 🛠️ Developer Mode
- Error log viewer
- System info
- Toggle from Settings

### 📱 Multi-Server
- Recent servers saved
- Quick switch between connections

---

## 🏗️ Build APK

### Using EAS (Recommended)
```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

### Using GitHub Actions
Push to `main` → APK auto-builds → Available in Releases

---

## 📁 Project Structure
```
├── App.js              # Main app (1400+ lines, all screens)
├── src/
│   ├── theme.js        # Dark + Light theme colors
│   └── api.js          # API client with SSE streaming
├── app.json            # Expo config
├── eas.json            # EAS build profiles
└── assets/             # Icons and splash
```

## 🔧 Tech Stack
- **React Native** (Expo SDK 54)
- **AsyncStorage** — local data persistence
- **expo-haptics** — tactile feedback
- **expo-speech** — text-to-speech
- **expo-clipboard** — copy messages
- **expo-image-picker** — camera + gallery
- **expo-local-authentication** — biometric lock
- **react-native-markdown-display** — markdown rendering

---

## 📱 Screenshots

| Pairing | Chat | Drawer | Quick Actions |
|---------|------|--------|---------------|
| Clean N logo | Dark theme, markdown | Conversations list | Create documents |

---

<div align="center">
  <p>Built with ❤️ for ERPNext</p>
  <p>
    <a href="https://github.com/kulharir7/niv_ai">Niv AI Backend</a> •
    <a href="https://github.com/kulharir7/niv_ai_mobile/releases">All Releases</a>
  </p>
</div>
