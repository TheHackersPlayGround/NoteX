import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Platform, ActivityIndicator, StatusBar, Alert, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { createNote, updateNote } from '../api';
import { useTheme } from '../ThemeContext';
import { radius } from '../theme';

// ── Palettes ──────────────────────────────────────────────────────────────────
const BG_LIGHT = ['#FFFFFF','#FFF9C4','#DCEDC8','#BBDEFB','#F8BBD0','#E1BEE7','#FFCCBC'];
const BG_DARK  = ['#1C1C23','#3D3000','#1B3A1B','#0D2A40','#3A1A26','#2A1A3A','#3A1A0D'];
const TEXT_COLORS  = ['#111827','#EF4444','#3B82F6','#22C55E','#F59E0B','#8B5CF6','#EC4899','#FFFFFF'];
const HILIGHT_COLS = ['#FDE68A','#6EE7B7','#93C5FD','#FCA5A5','#C4B5FD','transparent'];
const FONT_SIZES   = [
  { label: 'XS', px: '11px' },
  { label: 'S',  px: '13px' },
  { label: 'M',  px: '15px' },
  { label: 'L',  px: '18px' },
  { label: 'XL', px: '22px' },
  { label: '2X', px: '28px' },
  { label: '3X', px: '36px' },
];

function resolveThemeColor(hex, isDark) {
  if (!hex) return isDark ? BG_DARK[0] : BG_LIGHT[0];
  const lightIdx = BG_LIGHT.indexOf(hex);
  if (lightIdx !== -1) return isDark ? BG_DARK[lightIdx] : hex;
  const darkIdx = BG_DARK.indexOf(hex);
  if (darkIdx !== -1) return isDark ? BG_DARK[darkIdx] : BG_LIGHT[darkIdx];
  return hex;
}

// ── Build the editor HTML injected into the WebView ───────────────────────────
function buildHtml(bg, fg, placeholder, initialHtml) {
  // Escape backticks in initialHtml so the template literal stays safe
  const safeHtml = (initialHtml || '').replace(/`/g, '\\`');
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:${bg};height:100%;-webkit-text-size-adjust:100%}
#ed{
  min-height:100vh;padding:8px 16px 120px;
  font-size:15px;line-height:1.7;color:${fg};
  font-family:-apple-system,'Helvetica Neue',sans-serif;
  outline:none;word-break:break-word;white-space:pre-wrap;
}
#ed:empty::before{content:'${placeholder}';color:#aaa;pointer-events:none}
ul,ol{padding-left:24px;margin-bottom:8px}
li{margin-bottom:4px}
</style>
</head>
<body>
<div id="ed" contenteditable="true">${safeHtml}</div>

<div id="ov" style="position:absolute;display:none;pointer-events:none;z-index:1000;">
  <div id="hnd" style="position:absolute;right:-12px;bottom:-12px;width:28px;height:28px;background:#6C63FF;border-radius:14px;pointer-events:auto;border:4px solid #fff;box-shadow:0 4px 10px rgba(108,99,255,0.4);"></div>
  <div id="btns" style="position:absolute;top:12px;right:12px;flex-direction:row;gap:10px;display:flex;pointer-events:auto;">
    <div id="btn-rep" style="width:40px;height:40px;background:rgba(255,255,255,0.95);border-radius:12px;align-items:center;justify-content:center;display:flex;box-shadow:0 4px 12px rgba(0,0,0,0.15);color:#111;border:1px solid rgba(0,0,0,0.05);">
      <svg width="20" height="20" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"><path d="M320 146s24.36-12-64-12a160 160 0 10160 160"/><path d="M384 144v-80M384 144h-80"/></svg>
    </div>
    <div id="btn-del" style="width:40px;height:40px;background:#FF4444;border-radius:12px;align-items:center;justify-content:center;display:flex;box-shadow:0 4px 12px rgba(255,68,68,0.3);color:#fff;">
      <svg width="20" height="20" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"><path d="M112 112l20 320c.95 18.49 14.4 32 32 32h184c17.67 0 30.87-13.51 32-32l20-320M80 112h352M192 112V72h128v40M256 176v224M184 176l8 224M328 176l-8 224"/></svg>
    </div>
  </div>
</div>
<script>
// Global variables
var ed = document.getElementById('ed');
var ov = document.getElementById('ov');
var hnd = document.getElementById('hnd');
var btnDel = document.getElementById('btn-del');
var btnRep = document.getElementById('btn-rep');
var last = '';
var selImg = null;
var isDragging = false;
var isMoving = false;
var moveTimer = null;
var startX, startW;

// Communication
function post(obj){ window.ReactNativeWebView.postMessage(JSON.stringify(obj)); }
function flush(){ var h=ed.innerHTML; if(h!==last){ last=h; post({type:'html',html:h}); } }

// This function will be called directly from React Native
window.handleMessage = function(data) {
  try {
    var m = JSON.parse(data);
    if(m.t==='cmd'){ ed.focus(); document.execCommand(m.cmd,false,m.val||null); flush(); }
    else if(m.t==='fontSize'){
      ed.focus();
      document.execCommand('fontSize',false,'7');
      var fonts=ed.querySelectorAll('font[size="7"]');
      fonts.forEach(function(f){
        var span=document.createElement('span');
        span.style.fontSize=m.px;
        while(f.firstChild)span.appendChild(f.firstChild);
        f.parentNode.replaceChild(span,f);
      });
      flush();
    }
    else if(m.t==='bg'){ document.body.style.background=m.c; ed.style.background=m.c; }
    else if(m.t==='fg'){ ed.style.color=m.c; }
    else if(m.t==='insertImage'){
      ed.focus();
      var img = document.createElement('img');
      img.id = 'img_' + Date.now();
      img.src = m.src;
      img.style.cssText = 'max-width:100%;width:100%;height:auto;border-radius:12px;margin:12px 0;display:block;transition:outline 0.2s;';
      
      var sel = window.getSelection();
      if(sel && sel.rangeCount > 0){
        var range = sel.getRangeAt(0);
        range.insertNode(img);
        var br = document.createElement('br');
        img.parentNode.insertBefore(br, img.nextSibling);
      } else {
        ed.appendChild(img);
        ed.appendChild(document.createElement('br'));
      }
      setTimeout(function(){ 
        img.scrollIntoView({behavior:'smooth',block:'center'}); 
        ed.focus();
      }, 100);
      flush();
    }
  } catch(e) { console.log('handleMessage error:', e); }
};

// Listeners for legacy support
window.addEventListener('message', function(e){ handleMessage(e.data); });
document.addEventListener('message', function(e){ handleMessage(e.data); });

function updateOv() {
  if (!selImg || isMoving) { ov.style.display='none'; return; }
  var r = selImg.getBoundingClientRect();
  ov.style.display = 'block';
  ov.style.top = (r.top + window.scrollY) + 'px';
  ov.style.left = (r.left + window.scrollX) + 'px';
  ov.style.width = r.width + 'px';
  ov.style.height = r.height + 'px';
}

ed.addEventListener('input', flush);
ed.addEventListener('blur', flush);
window.addEventListener('scroll', updateOv);
ed.addEventListener('input', updateOv);

ed.addEventListener('click', function(e) {
  if (e.target.tagName === 'IMG') {
    selImg = e.target;
    updateOv();
    ed.querySelectorAll('img').forEach(i => i.style.outline = 'none');
    selImg.style.outline = '3px solid #6C63FF';
    selImg.style.outlineOffset = '2px';
  } else {
    selImg = null;
    updateOv();
    ed.querySelectorAll('img').forEach(i => i.style.outline = 'none');
  }
});

btnDel.addEventListener('click', function(e) {
  if (selImg) {
    selImg.remove();
    selImg = null;
    updateOv();
    flush();
  }
});

btnRep.addEventListener('click', function(e) {
  if (selImg) { post({ type: 'imgReplace', id: selImg.id }); }
});

ed.addEventListener('touchstart', function(e) {
  if (e.target.tagName === 'IMG') {
    selImg = e.target;
    ed.querySelectorAll('img').forEach(i => i.style.outline = 'none');
    selImg.style.outline = '3px solid #6C63FF';
    selImg.style.outlineOffset = '2px';
    updateOv();
    moveTimer = setTimeout(function() {
      isMoving = true;
      selImg.style.opacity = '0.6';
      selImg.style.transform = 'scale(1.05)';
      ov.style.display = 'none';
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    }, 300);
  }
}, { passive: false });

hnd.addEventListener('touchstart', function(e) {
  if (selImg) {
    clearTimeout(moveTimer);
    isDragging = true;
    startX = e.touches[0].clientX;
    startW = selImg.clientWidth;
    e.preventDefault();
    e.stopPropagation();
  }
}, { passive: false });

window.addEventListener('touchmove', function(e) {
  if (isMoving && selImg) {
    e.preventDefault();
    var touch = e.touches[0];
    var x = touch.clientX;
    var y = touch.clientY;
    
    var target = document.elementFromPoint(x, y);
    if (target && ed.contains(target) && target !== selImg && !selImg.contains(target)) {
      var indicator = document.getElementById('move-indicator');
      if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'move-indicator';
        indicator.style.cssText = 'height:3px;background:#6C63FF;margin:4px 0;border-radius:2px;pointer-events:none;';
        ed.appendChild(indicator);
      }
      
      var rect = target.getBoundingClientRect();
      var midY = rect.top + rect.height / 2;
      
      if (target === ed) {
        ed.appendChild(indicator);
      } else if (y < midY) {
        target.parentNode.insertBefore(indicator, target);
      } else {
        target.parentNode.insertBefore(indicator, target.nextSibling);
      }
    }
  }
  if (isDragging && selImg) {
    e.preventDefault();
    var delta = e.touches[0].clientX - startX;
    var newW = startW + delta;
    var maxW = ed.clientWidth - 32;
    if (newW < 50) newW = 50;
    if (newW > maxW) newW = maxW;
    selImg.style.width = newW + 'px';
    updateOv();
  }
}, { passive: false });

window.addEventListener('touchend', function() {
  clearTimeout(moveTimer);
  if (isMoving && selImg) {
    var indicator = document.getElementById('move-indicator');
    if (indicator && indicator.parentNode) {
      indicator.parentNode.insertBefore(selImg, indicator);
      indicator.remove();
    }
    selImg.style.opacity = '1';
    selImg.style.transform = 'none';
    isMoving = false;
    updateOv();
    flush();
  }
  if (isDragging) {
    isDragging = false;
    flush();
  }
});

window.addEventListener('touchcancel', function() {
  clearTimeout(moveTimer);
  if (isMoving && selImg) {
    var indicator = document.getElementById('move-indicator');
    if (indicator) indicator.remove();
    selImg.style.opacity = '1';
    selImg.style.transform = 'none';
    isMoving = false;
    updateOv();
  }
  if (isDragging) isDragging = false;
});

post({type:'ready'});
</script>
</body>
</html>`;
}

// ── Toolbar button ────────────────────────────────────────────────────────────
function TBtn({ onPress, active, colors, children }) {
  return (
    <TouchableOpacity
      onPress={onPress} activeOpacity={0.7}
      style={{
        paddingHorizontal: 10, paddingVertical: 8, borderRadius: radius.sm,
        backgroundColor: active ? colors.accentLight : 'transparent',
        alignItems: 'center', justifyContent: 'center', minWidth: 38,
      }}
    >
      {children}
    </TouchableOpacity>
  );
}

const Sep = ({ colors }) => (
  <View style={{ width: 1, height: 22, backgroundColor: colors.border, marginHorizontal: 4 }} />
);

// ── Main screen ───────────────────────────────────────────────────────────────
export default function NoteEditorScreen({ route, navigation }) {
  const { colors, shadow, isDark } = useTheme();
  const bgPalette = isDark ? BG_DARK : BG_LIGHT;

  const note          = route.params?.note ?? null;
  const categoriesParam = route.params?.categories || [];
  const wvRef          = useRef(null);
  const htmlRef        = useRef(note?.body || '');

  const [title,      setTitle]      = useState(note?.title || '');
  const [noteBg,     setNoteBg]     = useState(resolveThemeColor(note?.color, isDark));
  const [categoryId, setCategoryId] = useState(note?.category_id ? parseInt(note.category_id) : null);
  const [isPinned,   setIsPinned]   = useState(note?.isPinned || false);
  const [categories, setCategories] = useState(categoriesParam);
  const [saving,     setSaving]     = useState(false);
  const [panel,      setPanel]      = useState(null); // null | 'textColor' | 'highlight' | 'align' | 'fontSize' | 'category'
  const [ready,      setReady]      = useState(false);

  const cardBg = noteBg;

  // ── WebView helpers ─────────────────────────────────────────────────────────
  const injectCmd = useCallback((cmd, val = null) => {
    const payload = JSON.stringify({ t: 'cmd', cmd, val });
    wvRef.current?.injectJavaScript(`handleMessage(${JSON.stringify(payload)});true;`);
  }, []);

  // Update WebView background when note color changes
  useEffect(() => {
    if (!ready) return;
    const payload = JSON.stringify({ t: 'bg', c: noteBg });
    wvRef.current?.injectJavaScript(`handleMessage(${JSON.stringify(payload)});true;`);
  }, [noteBg, ready]);

  // Sync color if dark mode is toggled while screen is active
  useEffect(() => {
    setNoteBg(prev => resolveThemeColor(prev, isDark));
  }, [isDark]);

  // Sync text color if dark mode is toggled
  useEffect(() => {
    if (!ready) return;
    const payload = JSON.stringify({ t: 'fg', c: colors.textPrimary });
    wvRef.current?.injectJavaScript(`handleMessage(${JSON.stringify(payload)});true;`);
  }, [colors.textPrimary, ready]);

  // ── Auto-save on back ───────────────────────────────────────────────────────
  const doSave = useCallback(async () => {
    const html = htmlRef.current;
    const t    = title.trim();
    const bodyText = (html || '').replace(/<[^>]*>/g, '').trim();
    if (!t && !bodyText) return;
    setSaving(true);
    try {
      if (note) {
        await updateNote({ ...note, title: t, body: html, color: noteBg, category_id: categoryId, isPinned });
      } else {
        await createNote(t, html, noteBg, categoryId, isPinned);
      }
    } catch (_) {}
    finally { setSaving(false); }
  }, [note, title, noteBg, categoryId, isPinned]);

  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      e.preventDefault();
      doSave().finally(() => navigation.dispatch(e.data.action));
    });
    return unsub;
  }, [navigation, doSave]);

  // ── Toolbar actions ─────────────────────────────────────────────────────────
  const bold        = () => injectCmd('bold');
  const italic      = () => injectCmd('italic');
  const underline   = () => injectCmd('underline');
  const strike      = () => injectCmd('strikeThrough');
  const listBullet  = () => injectCmd('insertUnorderedList');
  const listNumber  = () => injectCmd('insertOrderedList');
  const undo        = () => injectCmd('undo');
  const redo        = () => injectCmd('redo');

  const alignLeft   = () => { injectCmd('justifyLeft');   setPanel(null); };
  const alignCenter = () => { injectCmd('justifyCenter'); setPanel(null); };
  const alignRight  = () => { injectCmd('justifyRight');  setPanel(null); };
  const alignFull   = () => { injectCmd('justifyFull');   setPanel(null); };

  const applyColor  = (hex) => { injectCmd('foreColor',  hex); setPanel(null); };
  const applyHl     = (hex) => {
    injectCmd(hex === 'transparent' ? 'removeFormat' : 'backColor', hex === 'transparent' ? null : hex);
    setPanel(null);
  };

  // ── Image picker ────────────────────────────────────────────────────────────
  const pickImage = useCallback(async (replaceId = null) => {
    try {
      console.log('pickImage called, replaceId:', replaceId);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to attach images.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
        allowsMultipleSelection: false,
        maxWidth: 1200,
        maxHeight: 1200,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      if (!asset.base64) {
        throw new Error('Image data is missing.');
      }
      const mime  = asset.mimeType || 'image/jpeg';
      const src   = `data:${mime};base64,${asset.base64}`;

      if (!ready) {
        Alert.alert('Editor Not Ready', 'Please wait for the editor to load.');
        return;
      }

      if (replaceId) {
        const replaceSrc = JSON.stringify(src);
        wvRef.current?.injectJavaScript(`
          var el = document.getElementById('${replaceId}');
          if (el) { el.src = ${replaceSrc}; flush(); }
          true;
        `);
      } else {
        const payload = JSON.stringify({ t: 'insertImage', src });
        const script = `handleMessage(${JSON.stringify(payload)});true;`;
        wvRef.current?.injectJavaScript(script);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not handle image: ' + (e.message || 'Unknown error'));
    }
  }, [ready]);

  const applyFontSize = (px) => {
    const payload = JSON.stringify({ t: 'fontSize', px });
    wvRef.current?.injectJavaScript(`handleMessage(${JSON.stringify(payload)});true;`);
    setPanel(null);
  };

  const togglePanel = (name) => setPanel(p => (p === name ? null : name));

  // ── Export to PDF ───────────────────────────────────────────────────────────
  const exportPDF = async () => {
    try {
      setSaving(true);
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            h1 { font-size: 28px; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
            .content { font-size: 14px; }
            img { max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; }
            .footer { position: fixed; bottom: 20px; left: 0; right: 0; text-align: center; color: #999; font-size: 12px; font-style: italic; }
            ul, ol { padding-left: 24px; margin-bottom: 8px; }
            li { margin-bottom: 4px; }
          </style>
        </head>
        <body>
          <h1>${title || 'Untitled Note'}</h1>
          <div class="content">${htmlRef.current}</div>
          <div class="footer">Generated by NoteX</div>
        </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Sharing Unavailable', 'PDF saved to: ' + uri);
      }
    } catch (e) {
      Alert.alert('Export Failed', 'Could not generate PDF.');
    } finally {
      setSaving(false);
    }
  };

  // ── WebView onMessage ───────────────────────────────────────────────────────
  const onMessage = useCallback((e) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'html') htmlRef.current = msg.html;
      if (msg.type === 'ready') setReady(true);
      if (msg.type === 'imgReplace') {
        pickImage(msg.id);
      }
    } catch (_) {}
  }, [pickImage]);



  const editorHtml = buildHtml(cardBg, colors.textPrimary, 'Start typing\u2026', note?.body || '');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cardBg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={cardBg} />
      
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* ── Header bar ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingVertical: 6, backgroundColor: cardBg }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 10 }}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        {saving && <ActivityIndicator size="small" color={colors.textSecond} style={{ marginRight: 8 }} />}

        {/* Options Menu Button */}
        <TouchableOpacity onPress={() => togglePanel('options')} style={{ padding: 8, marginRight: 4 }}>
          <Ionicons name="ellipsis-vertical" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* Explicit Save Button — calls doSave() directly so errors surface immediately */}
        <TouchableOpacity
          onPress={async () => {
            await doSave();
            navigation.goBack();
          }}
          style={{ paddingHorizontal: 12, paddingVertical: 6, marginLeft: 4 }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.accent }}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* ── Title ── */}
      <TextInput
        style={{
          fontSize: 22, fontWeight: '800', color: colors.textPrimary,
          paddingHorizontal: 16, paddingTop: 2, paddingBottom: 8,
          backgroundColor: cardBg,
        }}
        placeholder="Title"
        placeholderTextColor={colors.textMuted}
        value={title}
        onChangeText={setTitle}
        multiline
        returnKeyType="next"
        onSubmitEditing={() => wvRef.current?.injectJavaScript("document.getElementById('ed').focus();true;")}
      />

      {/* ── Current category indicator ── */}
      {categoryId && categories.find(c => c.id === categoryId) ? (() => {
        const cat = categories.find(c => c.id === categoryId);
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 6, gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cat.color }} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: cat.color }}>{cat.name}</Text>
            <TouchableOpacity onPress={() => setCategoryId(null)} style={{ marginLeft: 4 }}>
              <Ionicons name="close-circle" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        );
      })() : null}

      {/* ── WebView rich editor ── */}
      <WebView
        ref={wvRef}
        style={{ flex: 1, backgroundColor: cardBg }}
        source={{ html: editorHtml }}
        onMessage={onMessage}
        scrollEnabled
        keyboardDisplayRequiresUserAction={false}
        showsVerticalScrollIndicator={false}
        originWhitelist={['*']}
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        mixedContentMode="always"
        javaScriptEnabled
      />

      {/* ── Formatting toolbar ── */}
      <View style={{ backgroundColor: cardBg, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.08)' }}>

        {/* Options panel */}
        {panel === 'options' && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 12, gap: 16 }}>
            {/* Action buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={exportPDF} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.inputBg, paddingVertical: 10, borderRadius: radius.sm }}>
                <Ionicons name="document-text-outline" size={18} color={colors.textPrimary} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary }}>Export PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsPinned(!isPinned)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: isPinned ? colors.accentLight : colors.inputBg, paddingVertical: 10, borderRadius: radius.sm }}>
                <Ionicons name={isPinned ? "pin" : "pin-outline"} size={18} color={isPinned ? colors.accent : colors.textPrimary} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: isPinned ? colors.accent : colors.textPrimary }}>{isPinned ? 'Pinned' : 'Pin Note'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPanel('category')} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: categoryId ? colors.accentLight : colors.inputBg, paddingVertical: 10, borderRadius: radius.sm }}>
                <Ionicons name={categoryId ? "folder" : "folder-outline"} size={18} color={categoryId ? colors.accent : colors.textPrimary} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: categoryId ? colors.accent : colors.textPrimary }}>Folder</Text>
              </TouchableOpacity>
            </View>
            
            {/* Background Color Picker */}
            <View>
              <Text style={{ fontSize: 12, color: colors.textSecond, marginBottom: 8, fontWeight: '600', textTransform: 'uppercase' }}>Note Color</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {bgPalette.map((c) => (
                  <TouchableOpacity
                    key={c} onPress={() => setNoteBg(c)}
                    style={{
                      width: 34, height: 34, borderRadius: 17, backgroundColor: c,
                      borderWidth: noteBg === c ? 2.5 : 1,
                      borderColor: noteBg === c ? colors.accent : 'rgba(0,0,0,0.2)',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {noteBg === c && <Ionicons name="checkmark" size={14} color={colors.accent} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Align panel */}
        {panel === 'align' && (
          <View style={{ flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 4 }}>
            <TBtn onPress={alignLeft}   colors={colors}><Ionicons name="reorder-three-outline" size={21} color={colors.textPrimary} /></TBtn>
            <TBtn onPress={alignCenter} colors={colors}><Ionicons name="menu-outline"          size={21} color={colors.textPrimary} /></TBtn>
            <TBtn onPress={alignRight}  colors={colors}><Ionicons name="reorder-two-outline"   size={21} color={colors.textPrimary} /></TBtn>
            <TBtn onPress={alignFull}   colors={colors}><Ionicons name="reorder-four-outline"  size={21} color={colors.textPrimary} /></TBtn>
          </View>
        )}

        {/* Text colour panel */}
        {panel === 'textColor' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8, flexDirection: 'row' }}>
            {TEXT_COLORS.map((c) => (
              <TouchableOpacity key={c} onPress={() => applyColor(c)}
                style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.2)' }}
              />
            ))}
          </ScrollView>
        )}

        {/* Highlight panel */}
        {panel === 'highlight' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8, flexDirection: 'row', alignItems: 'center' }}>
            {HILIGHT_COLS.map((c) => (
              <TouchableOpacity key={c} onPress={() => applyHl(c)}
                style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c === 'transparent' ? '#fff' : c,
                  borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' }}
              >
                {c === 'transparent' && <Ionicons name="close" size={14} color="#EF4444" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Font size panel */}
        {panel === 'fontSize' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 6, flexDirection: 'row', alignItems: 'center' }}>
            {FONT_SIZES.map((s) => (
              <TouchableOpacity
                key={s.px} onPress={() => applyFontSize(s.px)}
                style={{
                  paddingHorizontal: 12, paddingVertical: 6,
                  borderRadius: radius.sm,
                  backgroundColor: colors.inputBg,
                  borderWidth: 1.5, borderColor: colors.border,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: parseInt(s.px) > 22 ? 18 : parseInt(s.px) > 16 ? 15 : 13, fontWeight: '700', color: colors.textPrimary }}>
                  {s.label}
                </Text>
                <Text style={{ fontSize: 9, color: colors.textSecond, marginTop: 1 }}>{s.px}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Category panel */}
        {panel === 'category' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: 'row', alignItems: 'center' }}>
            {/* None */}
            <TouchableOpacity
              onPress={() => { setCategoryId(null); setPanel(null); }}
              style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1.5, borderColor: categoryId === null ? colors.accent : colors.border, backgroundColor: categoryId === null ? colors.accentLight : 'transparent' }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: categoryId === null ? colors.accent : colors.textSecond }}>None</Text>
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => { setCategoryId(cat.id); setPanel(null); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, backgroundColor: categoryId === cat.id ? cat.color : 'transparent', borderWidth: 1.5, borderColor: cat.color }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: categoryId === cat.id ? '#fff' : cat.color }}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
            {categories.length === 0 && (
              <Text style={{ fontSize: 13, color: colors.textMuted, fontStyle: 'italic' }}>No categories. Create them from the Notes list.</Text>
            )}
          </ScrollView>
        )}

        {/* Main toolbar row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' }}>

          <TBtn onPress={bold}      colors={colors}><Text style={{ fontSize: 17, fontWeight: '900', color: colors.textPrimary }}>B</Text></TBtn>
          <TBtn onPress={italic}    colors={colors}><Text style={{ fontSize: 17, fontStyle: 'italic', fontWeight: '700', color: colors.textPrimary }}>I</Text></TBtn>
          <TBtn onPress={underline} colors={colors}><Text style={{ fontSize: 17, fontWeight: '700', textDecorationLine: 'underline', color: colors.textPrimary }}>U</Text></TBtn>
          <TBtn onPress={strike}    colors={colors}><Text style={{ fontSize: 17, fontWeight: '700', textDecorationLine: 'line-through', color: colors.textPrimary }}>S</Text></TBtn>

          <Sep colors={colors} />
          
          <TBtn onPress={listBullet} colors={colors}><Ionicons name="list" size={21} color={colors.textPrimary} /></TBtn>
          <TBtn onPress={listNumber} colors={colors}><Ionicons name="list-circle-outline" size={21} color={colors.textPrimary} /></TBtn>

          <Sep colors={colors} />

          {/* Alignment toggle */}
          <TBtn onPress={() => togglePanel('align')} active={panel === 'align'} colors={colors}>
            <Ionicons name="reorder-three-outline" size={21} color={panel === 'align' ? colors.accent : colors.textPrimary} />
          </TBtn>

          <Sep colors={colors} />

          {/* Text colour */}
          <TBtn onPress={() => togglePanel('textColor')} active={panel === 'textColor'} colors={colors}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '900', color: panel === 'textColor' ? colors.accent : colors.textPrimary }}>A</Text>
              <View style={{ height: 3, width: 16, borderRadius: 2, backgroundColor: '#EF4444', marginTop: 1 }} />
            </View>
          </TBtn>

          {/* Highlight */}
          <TBtn onPress={() => togglePanel('highlight')} active={panel === 'highlight'} colors={colors}>
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="brush-outline" size={18} color={panel === 'highlight' ? colors.accent : colors.textPrimary} />
              <View style={{ height: 3, width: 16, borderRadius: 2, backgroundColor: '#FBBF24', marginTop: 1 }} />
            </View>
          </TBtn>

          {/* Font size */}
          <TBtn onPress={() => togglePanel('fontSize')} active={panel === 'fontSize'} colors={colors}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 11, fontWeight: '900', color: panel === 'fontSize' ? colors.accent : colors.textPrimary, letterSpacing: -0.5 }}>A</Text>
              <Text style={{ fontSize: 7,  fontWeight: '900', color: panel === 'fontSize' ? colors.accent : colors.textSecond, letterSpacing: -0.5 }}>A</Text>
            </View>
          </TBtn>

          <Sep colors={colors} />

          <TBtn onPress={undo} colors={colors}><Ionicons name="arrow-undo-outline"  size={20} color={colors.textPrimary} /></TBtn>
          <TBtn onPress={redo} colors={colors}><Ionicons name="arrow-redo-outline"  size={20} color={colors.textPrimary} /></TBtn>

          <Sep colors={colors} />

          {/* Attach image */}
          <TBtn onPress={() => pickImage()} colors={colors}>
            <Ionicons name="image-outline" size={21} color={colors.textPrimary} />
          </TBtn>

        </ScrollView>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
