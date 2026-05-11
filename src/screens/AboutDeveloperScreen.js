import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { radius } from '../theme';

export default function AboutDeveloperScreen({ navigation }) {
  const { colors, shadow, isDark } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Custom Banner Header */}
        <View style={{ height: 140, backgroundColor: colors.accent, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <View style={{ position: 'absolute', bottom: -30, left: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.1)' }} />
          
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: radius.full }}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Card overlapping banner */}
        <View style={{ alignItems: 'center', marginTop: -60, marginBottom: 28, paddingHorizontal: 20 }}>
          <View style={{ ...shadow.md, borderRadius: 75, backgroundColor: colors.card, padding: 5, marginBottom: 14 }}>
            <Image 
              source={require('../../assets/developer.jpg')} 
              style={{ width: 130, height: 130, borderRadius: 65, resizeMode: 'cover' }} 
            />
          </View>
          <Text style={{ fontSize: 26, fontWeight: '800', color: colors.textPrimary, marginBottom: 6, textAlign: 'center' }}>Neil Micarandayo</Text>
          <View style={{ backgroundColor: colors.accentLight, paddingHorizontal: 16, paddingVertical: 6, borderRadius: radius.full }}>
            <Text style={{ fontSize: 12, color: colors.accent, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>BS-IT • Software Developer</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {/* Who I Am */}
          <Section icon="person" title="Who I Am" colors={colors} shadow={shadow}>
            I’m a developer who loves turning lines of code into functional tools. I focus on building software that feels natural to use while solving real-world problems.
          </Section>

        {/* Mission & Philosophy */}
        <Section icon="rocket" title="Mission & Philosophy" colors={colors} shadow={shadow}>
          My mission is to simplify productivity by creating efficient, high-performance tools. I believe technology should stay out of the way and just work, which is why I’m passionate about crafting clean user interfaces that make staying organized feel effortless.
        </Section>

        {/* Expertise & Tech Stack */}
        <View style={{ marginBottom: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <Ionicons name="hardware-chip" size={18} color={colors.accent} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.2 }}>Expertise & Tech Stack</Text>
          </View>
          <View style={{ backgroundColor: colors.card, padding: 20, borderRadius: radius.lg, ...shadow.sm }}>
            <Text style={{ fontSize: 14, color: colors.textSecond, lineHeight: 22, marginBottom: 16 }}>
              I specialize in full-stack and mobile development, building robust, cross-platform applications with a core focus on:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {['React Native (Expo)', 'React', 'PHP', 'MySQL', 'Full-Stack Dev', 'Mobile Dev'].map(skill => (
                <View key={skill} style={{ backgroundColor: isDark ? '#2A2A35' : '#F3F4F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary }}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Accolades & Milestones */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <Ionicons name="trophy" size={18} color={colors.accent} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.2 }}>Accolades & Milestones</Text>
          </View>
          <View style={{ backgroundColor: colors.accent, padding: 24, borderRadius: radius.lg, ...shadow.md, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 8 }}>DormDash</Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 22 }}>
              In addition to NoteX, I developed DormDash, a dormitory platform management system designed to streamline interactions between tenants and dormitory owners.
            </Text>
          </View>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ icon, title, children, colors, shadow }) {
  return (
    <View style={{ marginBottom: 28 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Ionicons name={icon} size={18} color={colors.accent} />
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.2 }}>{title}</Text>
      </View>
      <View style={{ backgroundColor: colors.card, padding: 20, borderRadius: radius.lg, ...shadow.sm }}>
        <Text style={{ fontSize: 15, color: colors.textSecond, lineHeight: 24 }}>{children}</Text>
      </View>
    </View>
  );
}
