import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

// Lightweight football (soccer) logo without external deps.
// Uses simple geometry: circle + pentagon pattern approximation with styled views.
// On web we can optionally render an inline SVG if desired later.

const Logo: React.FC<{ size?: number; title?: string }> = ({ size = 120, title = 'FootballApp' }) => {
  const ballSize = size;
  const patch = ballSize * 0.28;
  return (
    <View style={[styles.container, { width: ballSize, height: ballSize }]}>
      <View style={[styles.ball, { width: ballSize, height: ballSize, borderRadius: ballSize / 2 }]}>
        <View style={[styles.patch, { width: patch, height: patch, top: ballSize * 0.18, left: ballSize * 0.36 }]} />
        <View style={[styles.patch, { width: patch * 0.82, height: patch * 0.82, top: ballSize * 0.55, left: ballSize * 0.12 }]} />
        <View style={[styles.patch, { width: patch * 0.82, height: patch * 0.82, top: ballSize * 0.55, left: ballSize * 0.58 }]} />
        <View style={[styles.patch, { width: patch * 0.7, height: patch * 0.7, top: ballSize * 0.42, left: ballSize * 0.05 }]} />
        <View style={[styles.patch, { width: patch * 0.7, height: patch * 0.7, top: ballSize * 0.42, left: ballSize * 0.75 }]} />
      </View>
      <Text style={[styles.title, { marginTop: 12 }]} accessibilityRole="header">{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  ball: { backgroundColor: '#fff', borderWidth: 4, borderColor: '#1d3557', position: 'relative', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, elevation: 4 },
  patch: { position: 'absolute', backgroundColor: '#222', borderRadius: 8, transform: [{ rotate: '20deg' }] },
  title: { fontSize: 20, fontWeight: '700', color: '#1d3557', letterSpacing: 0.5 },
});

export default Logo;
