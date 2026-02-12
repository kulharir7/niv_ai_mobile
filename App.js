import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator,
  SafeAreaView, Alert, Animated, Easing, Dimensions, Image,
  BackHandler,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { WebView } from 'react-native-webview';

const { width: SW } = Dimensions.get('window');

const C = {
  bg:        '#000000',
  surface:   '#0a0a0a',
  card:      '#141414',
  accent:    '#8b5cf6',
  accentMid: '#8b5cf640',
  green:     '#22c55e',
  greenDim:  '#22c55e20',
  red:       '#ef4444',
  t1:        '#f0f0f0',
  t3:        '#6b6b6b',
  t4:        '#333333',
};

// ════════════════════════════════════════
// APP
// ════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState('loading');
  const [session, setSession] = useState(null);

  useEffect(() => { init(); }, []);

  const init = async () => {
    try {
      const raw = await AsyncStorage.getItem('niv_session');
      if (raw) {
        const s = JSON.parse(raw);
        // Quick verify
        const res = await fetch(s.siteUrl + '/api/method/niv_ai.niv_core.api.mobile.verify_token', {
          method: 'POST',
          headers: { 'Authorization': s.token, 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const d = await res.json();
          if (d.message?.valid) {
            setSession({ ...s, companies: d.message.companies || s.companies });
            setScreen('app');
            return;
          }
        }
      }
    } catch (e) {}
    setScreen('pair');
  };

  const onPaired = async (data) => {
    await AsyncStorage.setItem('niv_session', JSON.stringify(data));
    setSession(data);
    setScreen('welcome');
    setTimeout(() => setScreen('app'), 2500);
  };

  const onLogout = async () => {
    await AsyncStorage.removeItem('niv_session');
    setSession(null);
    setScreen('pair');
  };

  if (screen === 'loading') return <LoadingScreen />;
  if (screen === 'pair') return <PairScreen onPaired={onPaired} />;
  if (screen === 'welcome') return <WelcomeScreen session={session} />;
  return <MainApp session={session} onLogout={onLogout} />;
}

// ════════════════════════════════════════
// LOADING — Pulsing N
// ════════════════════════════════════════
function LoadingScreen() {
  const pulse = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.3, duration: 800, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <View style={[s.fill, s.center, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <Animated.Text style={{ fontSize: 64, fontWeight: '800', color: C.accent, opacity: pulse }}>N</Animated.Text>
    </View>
  );
}

// ════════════════════════════════════════
// PAIR SCREEN — Minimal 2-step
// ════════════════════════════════════════
function PairScreen({ onPaired }) {
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [servers, setServers] = useState([]);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    AsyncStorage.getItem('niv_servers').then(r => { if (r) setServers(JSON.parse(r)); });
  }, []);

  useEffect(() => {
    fade.setValue(0); slide.setValue(30);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [step]);

  const goNext = () => {
    if (!url.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError(''); setStep(2);
  };

  const connect = async () => {
    if (!code.trim()) return;
    setLoading(true); setError('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    let base = url.trim().replace(/\/+$/, '');
    if (!base.startsWith('http')) base = 'https://' + base;

    // Save server
    const updated = [...new Set([base, ...servers])].slice(0, 5);
    setServers(updated);
    AsyncStorage.setItem('niv_servers', JSON.stringify(updated));

    try {
      const res = await fetch(base + '/api/method/niv_ai.niv_core.api.mobile.pair', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase(), device_name: Platform.OS }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msgs = data._server_messages ? JSON.parse(data._server_messages) : [];
        throw new Error(msgs.length ? JSON.parse(msgs[0]).message : 'Connection failed');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const m = data.message;
      onPaired({ siteUrl: base, token: m.auth.token, user: m.user, companies: m.companies || [], config: m.config });
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(e.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={[s.fill, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 32 }}>
          {/* N Logo */}
          <View style={{ alignItems: 'center', marginBottom: 56 }}>
            <View style={s.nCircle}><Text style={s.nLogo}>N</Text></View>
          </View>

          <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
            {step === 1 ? (
              <>
                <Text style={s.label}>SERVER</Text>
                <TextInput style={s.input} value={url} onChangeText={setUrl}
                  placeholder="your-company.com" placeholderTextColor={C.t4}
                  autoCapitalize="none" autoCorrect={false} keyboardType="url"
                  returnKeyType="next" onSubmitEditing={goNext} />
                {servers.length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ color: C.t3, fontSize: 11, marginBottom: 6 }}>RECENT</Text>
                    {servers.map((sv, i) => (
                      <TouchableOpacity key={i} onPress={() => setUrl(sv)}
                        style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: C.card, borderRadius: 10, marginBottom: 4 }}>
                        <Text style={{ color: C.t3, fontSize: 13 }}>{sv}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <TouchableOpacity style={s.btn} onPress={goNext} activeOpacity={0.8}>
                  <Text style={s.btnT}>Continue</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={s.label}>PAIRING CODE</Text>
                <TextInput style={[s.input, { fontSize: 28, fontWeight: '800', letterSpacing: 8, textAlign: 'center' }]}
                  value={code} onChangeText={t => setCode(t.toUpperCase())}
                  placeholder="• • • • • • • •" placeholderTextColor={C.t4}
                  autoCapitalize="characters" maxLength={8} autoFocus />
                {error ? <Text style={s.err}>{error}</Text> : null}
                <TouchableOpacity style={[s.btn, loading && { opacity: 0.5 }]}
                  onPress={connect} disabled={loading} activeOpacity={0.8}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnT}>Connect</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setStep(1); setError(''); }} style={{ marginTop: 20 }}>
                  <Text style={{ color: C.t3, textAlign: 'center' }}>← Back</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ════════════════════════════════════════
// WELCOME — N 🤝 Company
// ════════════════════════════════════════
function WelcomeScreen({ session }) {
  const s1 = useRef(new Animated.Value(0)).current;
  const s2 = useRef(new Animated.Value(0)).current;
  const line = useRef(new Animated.Value(0)).current;
  const txt = useRef(new Animated.Value(0)).current;
  const co = session?.companies?.[0];

  useEffect(() => {
    Animated.sequence([
      Animated.spring(s1, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.spring(s2, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(line, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(txt, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  return (
    <View style={[s.fill, s.center, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Animated.View style={[s.wCircle, { transform: [{ scale: s1 }] }]}>
          <Text style={{ fontSize: 36, fontWeight: '800', color: C.accent }}>N</Text>
        </Animated.View>
        <Animated.View style={{ opacity: line, marginHorizontal: 14 }}>
          <Text style={{ fontSize: 28 }}>🤝</Text>
        </Animated.View>
        <Animated.View style={[s.wCircle, { borderColor: C.greenDim }, { transform: [{ scale: s2 }] }]}>
          {co?.logo ? (
            <Image source={{ uri: co.logo }} style={{ width: 44, height: 44, borderRadius: 8 }} resizeMode="contain" />
          ) : (
            <Text style={{ fontSize: 22, fontWeight: '700', color: C.t1 }}>{co?.abbr || '🏢'}</Text>
          )}
        </Animated.View>
      </View>
      <Animated.View style={{ opacity: txt, marginTop: 36, alignItems: 'center' }}>
        <Text style={{ fontSize: 26, fontWeight: '700', color: C.green }}>Connected</Text>
        <Text style={{ fontSize: 17, color: C.t1, marginTop: 8, fontWeight: '600' }}>{co?.company_name || ''}</Text>
        <Text style={{ fontSize: 13, color: C.t3, marginTop: 4 }}>{session?.user?.full_name}</Text>
      </Animated.View>
    </View>
  );
}

// ════════════════════════════════════════
// MAIN APP — WebView with ERPNext Niv Chat
// ════════════════════════════════════════
function MainApp({ session, onLogout }) {
  const webRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);

  // Handle Android back button
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webRef.current) {
        webRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, [canGoBack]);

  // JavaScript to inject after page loads:
  // 1. Auto-login with API token
  // 2. Navigate to Niv Chat
  // 3. Hide unnecessary Frappe UI elements (navbar, sidebar)
  // 4. Make it feel like a native app
  const injectedJS = `
    (function() {
      // Set auth cookie/token
      if (typeof frappe !== 'undefined') {
        // Already logged in via cookie, just clean up UI
        cleanUI();
      } else {
        // Wait for frappe to load
        var checkInterval = setInterval(function() {
          if (typeof frappe !== 'undefined' && frappe.session) {
            clearInterval(checkInterval);
            cleanUI();
          }
        }, 500);
        
        // Timeout after 10s
        setTimeout(function() { clearInterval(checkInterval); }, 10000);
      }
      
      function cleanUI() {
        // Hide Frappe navbar, sidebar, footer for app-like feel
        var style = document.createElement('style');
        style.textContent = \`
          .navbar, .page-head, #page-sidebar, .footer,
          .standard-sidebar-section, .sidebar-menu,
          .page-container > .page-sidebar,
          header.navbar, .web-footer,
          .modal-backdrop { display: none !important; }
          
          .page-container { padding: 0 !important; margin: 0 !important; }
          .container { max-width: 100% !important; padding: 0 !important; }
          .main-section { padding: 0 !important; margin: 0 !important; }
          .page-body { margin: 0 !important; }
          .layout-main { padding: 0 !important; }
          
          body { 
            background: #1a1a2e !important;
            overflow-x: hidden !important;
          }
          
          /* Make Niv Chat fullscreen */
          .niv-chat-container, .niv-chat-panel {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            max-height: 100vh !important;
            border-radius: 0 !important;
            z-index: 9999 !important;
          }
          
          /* Hide the floating FAB since chat is fullscreen */
          .niv-fab, .niv-chat-fab { display: none !important; }
          
          /* Mobile input adjustments */
          .niv-input-area { 
            padding-bottom: env(safe-area-inset-bottom, 8px) !important;
          }
          
          /* Hide widget close button */
          .niv-close-btn, .niv-minimize-btn { display: none !important; }
        \`;
        document.head.appendChild(style);
        
        // Auto-open Niv Chat if it exists
        setTimeout(function() {
          // Try to open the chat panel
          if (window.nivChat && window.nivChat.open) {
            window.nivChat.open();
          }
          // Or click the FAB
          var fab = document.querySelector('.niv-fab, .niv-chat-fab, [data-niv-fab]');
          if (fab) fab.click();
        }, 1000);
        
        // Notify React Native
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
      }
    })();
    true;
  `;

  // Login URL with API token
  const loginUrl = session.siteUrl + '/api/method/login';
  
  // We'll use cookie-based auth by first calling login, then navigating
  const authJS = `
    (function() {
      // First, authenticate using the API token
      fetch('${session.siteUrl}/api/method/frappe.auth.get_logged_user', {
        headers: { 'Authorization': '${session.token}' }
      })
      .then(r => r.json())
      .then(d => {
        if (d.message) {
          // Authenticated! Now set the token for all future requests
          // Override fetch to always include auth header
          var origFetch = window.fetch;
          window.fetch = function(url, opts) {
            opts = opts || {};
            opts.headers = opts.headers || {};
            if (typeof opts.headers.set === 'function') {
              opts.headers.set('Authorization', '${session.token}');
            } else {
              opts.headers['Authorization'] = '${session.token}';
            }
            return origFetch.call(this, url, opts);
          };
          
          // Also set XMLHttpRequest
          var origOpen = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = function() {
            var result = origOpen.apply(this, arguments);
            this.setRequestHeader('Authorization', '${session.token}');
            return result;
          };
          
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'authenticated', user: d.message }));
        }
      })
      .catch(e => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'auth_error', error: e.message }));
      });
    })();
    true;
  `;

  const onMessage = (event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'ready') setLoading(false);
      if (msg.type === 'authenticated') setLoading(false);
      if (msg.type === 'logout') onLogout();
    } catch (e) {}
  };

  // Start URL — go directly to the page with Niv Chat widget
  // The widget auto-loads on every Frappe page
  const startUrl = session.siteUrl + '/app';

  return (
    <SafeAreaView style={[s.fill, { backgroundColor: '#1a1a2e' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      <WebView
        ref={webRef}
        source={{ 
          uri: startUrl,
          headers: { 'Authorization': session.token },
        }}
        injectedJavaScript={injectedJS}
        injectedJavaScriptBeforeContentLoaded={authJS}
        onMessage={onMessage}
        onNavigationStateChange={(nav) => setCanGoBack(nav.canGoBack)}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        allowsBackForwardNavigationGestures={true}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        mixedContentMode="compatibility"
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        cacheEnabled={true}
        userAgent="NivAI-Mobile/1.0"
        style={{ flex: 1, backgroundColor: '#1a1a2e' }}
        renderLoading={() => (
          <View style={[s.fill, s.center, { backgroundColor: '#1a1a2e', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}>
            <Text style={{ fontSize: 36, fontWeight: '800', color: C.accent, marginBottom: 16 }}>N</Text>
            <ActivityIndicator color={C.accent} size="large" />
            <Text style={{ color: C.t3, marginTop: 12, fontSize: 13 }}>Loading Niv AI...</Text>
          </View>
        )}
      />

      {/* Loading overlay */}
      {loading && (
        <View style={[s.fill, s.center, { backgroundColor: '#1a1a2e', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}>
          <Text style={{ fontSize: 36, fontWeight: '800', color: C.accent, marginBottom: 16 }}>N</Text>
          <ActivityIndicator color={C.accent} size="large" />
          <Text style={{ color: C.t3, marginTop: 12, fontSize: 13 }}>Loading...</Text>
        </View>
      )}

      {/* Floating logout button (long press) */}
      <TouchableOpacity
        style={{ position: 'absolute', top: Platform.OS === 'ios' ? 50 : 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8 }}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          Alert.alert('Niv AI', '', [
            { text: 'Reload', onPress: () => webRef.current?.reload() },
            { text: 'Logout', style: 'destructive', onPress: onLogout },
            { text: 'Cancel', style: 'cancel' },
          ]);
        }}
        delayLongPress={500}
        activeOpacity={0.7}
      >
        <Text style={{ fontSize: 16 }}>⚙️</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ════════════════════════════════════════
// STYLES
// ════════════════════════════════════════
const s = StyleSheet.create({
  fill: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  nCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: C.accentMid,
  },
  nLogo: { fontSize: 44, fontWeight: '800', color: C.accent },
  wCircle: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: C.accentMid,
  },
  label: { fontSize: 12, fontWeight: '700', color: C.t3, marginBottom: 10, letterSpacing: 2 },
  input: {
    backgroundColor: C.surface, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16,
    fontSize: 17, color: C.t1, borderWidth: 1, borderColor: C.t4,
  },
  btn: {
    backgroundColor: C.accent, borderRadius: 16, paddingVertical: 17, alignItems: 'center', marginTop: 28,
    shadowColor: C.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 8,
  },
  btnT: { color: '#fff', fontSize: 17, fontWeight: '700' },
  err: { color: C.red, fontSize: 13, textAlign: 'center', marginTop: 14 },
});
