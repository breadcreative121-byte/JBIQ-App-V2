/* Menu + Home + Spaces as one connected surface.

   A single horizontal pager: page 0 is the burger Menu, page 1 is the voice-led
   Home, pages 2–7 are the per-vertical Spaces. It opens on Home. The header and
   the bottom bar are FIXED overlays — only the body pushes as you swipe, and the
   header smoothly cross-fades between the Menu (BharatIQ · close), Home (menu ·
   Jio · grid) and Spaces (back · "Spaces" · filter) nav. So the burger opens with
   exactly the same gesture/feel as switching to Spaces. */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  AppState,
  Easing,
  PanResponder,
  Platform,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { fig } from '@/theme/figma';
import { font } from '@/theme/fonts';
import { IconButton } from '@/components/IconButton';
import { PhraseRow } from '@/components/PhraseRow';
import { Composer } from '@/components/Composer';
import { JioLogo } from '@/components/JioLogo';
import { JdsIcon } from '@/components/JdsIcon';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { TabStrip } from '@/components/TabStrip';
import { SpacesIntroSheet } from '@/components/SpacesIntroSheet';
import { MicPermissionSheet } from '@/components/MicPermissionSheet';
import { HomeMomentBanner } from '@/components/HomeMomentBanner';
import { HeroCard } from '@/components/HeroCard';
import { ActionCard } from '@/components/ActionCard';
import type { GlyphName } from '@/components/AccentIconChip';
import type { JdsName } from '@/theme/jdsIcons';
import type { RootStackParamList } from '@/navigation/RootStack';
import {
  getOnboardingComplete,
  setOnboardingComplete,
  getSpacesIntroSeen,
  setSpacesIntroSeen,
} from '@/lib/onboarding';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { VERTICALS, type Vertical, type VerticalDepth } from '../spaces/verticals';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type IoniconName = keyof typeof Ionicons.glyphMap;
type MciName = keyof typeof MaterialCommunityIcons.glyphMap;

// The signed-in user's name, when known. Personalised greetings are a
// shared-device leak if faked, so this is the single source: set it only from a
// real identity signal. `null` degrades to a plain "Namaste". 'Arjun' is the
// demo persona.
const USER_NAME: string | null = 'Arjun';

// App-level engagement stage (docs/home-spaces-engagement-v1.md §2/§5). Home
// consumes this — production reads it from the Consumer Lifecycle pod; here it's
// simulated. Density grows by stage; the trust ceiling (below) can override it.
type Stage = 'cold' | 'warm' | 'activated' | 'habitual' | 'power' | 'dormant';
// Demo cycle (long-press the greeting). 'cold' last = the untrusted / shared-device
// floor, so the leak fix is demonstrable in the same gesture.
const DEMO_STAGES: Stage[] = ['warm', 'activated', 'habitual', 'power', 'dormant', 'cold'];
// Per-vertical depth demo cycle (Astrology worked example).
const ASTRO_DEPTHS: VerticalDepth[] = ['new', 'casual', 'regular', 'invested'];

// Device-trust confidence. PRODUCTION wires this to the auth/identity-continuity
// signal and defaults DOWN (untrusted → floor) when uncertain — the homepage only
// consumes it (docs/home-spaces-engagement-v1.md §0/§4). The prototype assumes a
// trusted device so the warm state is demoable; the 'cold' stage flips it to prove
// the floor. This gate — not a device-scoped flag — is what contains the leak.
const TRUST_SIMULATED = true;

// Slot-1 lines. Low-sensitivity, beneficial nudges — never a balance, never
// auto-charged. TASK = transactional context line; JUMPBACK = habit resumption.
const TASK_LINE = 'Your recharge ends tomorrow — renew it?';
const JUMPBACK_LINE = 'Your horoscope — 5 days running. Hear today’s?';
const HEADER_H = 56;
const TAB_H = 44;
const MENU = 0;
const HOME = 1;
const SPACES = 2; // first Space page
const DOT_SIZE = 7;
const DOT_GAP = 9;
const DOT_STEP = DOT_SIZE + DOT_GAP;
const MOMENT_MIN_AWAY_MS = 1200; // ignore brief blips; only a real reopen counts
const DOT_WINDOW = 4; // max dots visible (iOS-style windowed indicator)
const DOT_CLIP_W = DOT_WINDOW * DOT_STEP;
const DOT_CENTER_X = DOT_CLIP_W / 2 - DOT_SIZE / 2;

type Phrase = { icon?: GlyphName; jds?: JdsName; text: string };

// Swipe up on Home cycles through these suggestion sets.
const PHRASE_SETS: Phrase[][] = [
  [
    { icon: 'lightbulb-on-outline', text: 'Pay the electricity bill' },
    { icon: 'newspaper-variant-outline', text: 'Read me the news brief' },
    { icon: 'cricket', text: 'How did yesterdays match go' },
    { icon: 'microphone-outline', text: 'How do I talk to you?' },
  ],
  [
    { icon: 'cellphone', text: 'Recharge my number' },
    { icon: 'movie-open-outline', text: 'What should I watch tonight?' },
    { icon: 'cart-outline', text: 'Order milk and bread' },
    { icon: 'bus', text: 'Book a bus to Pune' },
  ],
  [
    { icon: 'star-four-points', text: "Read tomorrow's horoscope" },
    { jds: 'ic_new_chat', text: 'Talk to me for a bit' },
    { icon: 'meditation', text: 'Guide me through breathing' },
    { icon: 'weather-partly-cloudy', text: "What's the weather today?" },
  ],
];

// A returning (habitual/power) user's "usuals" — their frequent asks worded as
// sentences, so slot 1+ becomes their actual next tasks, not a teaching set.
const USUALS: Phrase[] = [
  { icon: 'star-four-points', text: 'Read my horoscope' },
  { icon: 'lightbulb-on-outline', text: 'Pay the electricity bill' },
  { icon: 'cellphone', text: 'Recharge ₹239' },
  { icon: 'cricket', text: "How did yesterday's match go?" },
];

type MenuItem = {
  label: string;
  screen: keyof RootStackParamList;
  jds?: JdsName;
  ion?: IoniconName;
  mci?: MciName;
};
const NAV: MenuItem[] = [
  { label: 'Assistant', jds: 'ic_brain', screen: 'Saathi' },
  { label: 'Quick actions', ion: 'construct-outline', screen: 'Playbook' },
  { label: 'Media', mci: 'image-outline', screen: 'Playground' },
  { label: 'Chats', jds: 'ic_new_chat', screen: 'Saathi' },
];
const RECENTS = [
  'Kundali for Diwali',
  'Electricity bill — Adani',
  'Cricket: IND vs AUS',
  'Pediatrician near me',
  'Recharge ₹239 plan',
  'Panchang & muhurat',
  'English interview prep',
  'Order groceries',
];

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const reduced = useReducedMotion();
  const scrollRef = useRef<any>(null);
  const scrollX = useRef(new Animated.Value(width)).current; // start on Home
  const [active, setActive] = useState(HOME);
  // Progressive coaching: teach "tap to talk" first; only after the user has
  // opened the voice screen and come back do we teach "swipe for spaces".
  const [coachStage, setCoachStage] = useState<'talk' | 'spaces' | 'done'>('talk');
  const sawVoice = useRef(false);
  const [phraseSet, setPhraseSet] = useState(0);
  // Educational sheet on the first Spaces arrival (once per session).
  const [showSpacesIntro, setShowSpacesIntro] = useState(false);
  const seenSpaces = useRef(false);
  // First-run voice onboarding: the mic "warm ask" sheet, shown once per install.
  const [showPermit, setShowPermit] = useState(false);
  // Engagement model. `onboarded` + `returnedFromBg` derive the auto stage;
  // `demoStageIdx` is a hidden long-press override cycling the stages for pitching;
  // `taskDismissed` collapses the slot-1 card back to the phrase list.
  const [onboarded, setOnboarded] = useState(false);
  const [demoStageIdx, setDemoStageIdx] = useState<number | null>(null);
  const [taskDismissed, setTaskDismissed] = useState(false);
  // Demo: per-vertical depth for the Astrology Space (long-press its context line).
  const [astroDepthIdx, setAstroDepthIdx] = useState<number | null>(null);
  // Demo control sheet (opened from the Menu gear) to pick stage / depth directly.
  const [showDemo, setShowDemo] = useState(false);
  // Return-visit "live moment" banner: appears after the app has been
  // backgrounded and reopened; dismissed for the session with "Later".
  const [returnedFromBg, setReturnedFromBg] = useState(false);
  const [momentDismissed, setMomentDismissed] = useState(false);
  const backgroundedAt = useRef(0);
  const momentFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background') backgroundedAt.current = Date.now();
      else if (next === 'active' && backgroundedAt.current) {
        // Only a genuine reopen counts — ignore momentary background blips
        // (a permission prompt, a fast app-switch) that fire nearly instantly.
        const away = Date.now() - backgroundedAt.current;
        backgroundedAt.current = 0;
        if (away >= MOMENT_MIN_AWAY_MS) setReturnedFromBg(true);
      }
    });
    return () => sub.remove();
  }, []);

  // Derive the current engagement stage, then let the demo override win if set.
  const autoStage: Stage = !onboarded
    ? USER_NAME
      ? 'warm'
      : 'cold'
    : returnedFromBg
      ? 'activated'
      : 'warm';
  const stage: Stage = demoStageIdx == null ? autoStage : DEMO_STAGES[demoStageIdx];

  // Trust ceiling: 'cold' is the untrusted / shared-device floor. Every personal
  // element (name, earned card, "usuals") renders only when trusted — this is the
  // gate that stops the shared-device leak (docs …engagement-v1 §0).
  const trusted = TRUST_SIMULATED && stage !== 'cold';
  const showName = trusted && !!USER_NAME;
  const engaged = stage === 'activated' || stage === 'habitual' || stage === 'power' || stage === 'dormant';
  const showUsuals = trusted && (stage === 'habitual' || stage === 'power');

  // The return-visit moment banner leads on a real reopen (auto mode); it wins
  // slot 1, so the context/jump-back card stands down when it's showing.
  const momentEligible =
    trusted && returnedFromBg && demoStageIdx == null && !momentDismissed && !showPermit;

  // Slot-1 earned card: transactional context (activated/dormant) or a habit
  // jump-back (habitual/power). Suppressed when untrusted, dismissed, or the
  // moment banner owns the slot.
  const cardKind: 'none' | 'context' | 'jumpback' = !trusted
    ? 'none'
    : stage === 'habitual' || stage === 'power'
      ? 'jumpback'
      : stage === 'activated' || stage === 'dormant'
        ? 'context'
        : 'none';
  const showCard = cardKind !== 'none' && !taskDismissed && !momentEligible;
  useEffect(() => {
    if (momentEligible) {
      Animated.timing(momentFade, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [momentEligible, momentFade]);

  const dismissMoment = () =>
    Animated.timing(momentFade, {
      toValue: 0,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setMomentDismissed(true));

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      // Refresh onboarding status — the first-run scene may have completed it.
      getOnboardingComplete().then(setOnboarded);
      if (sawVoice.current) {
        sawVoice.current = false;
        if (!seenSpaces.current) setCoachStage('spaces');
      }
    });
    return unsub;
  }, [navigation]);

  const openVoice = (prompt?: string) => {
    sawVoice.current = true;
    navigation.navigate('Saathi', prompt ? { prompt } : {});
  };

  // First launch (never onboarded): slide up the mic "warm ask" over Home.
  // Also hydrate the "seen Spaces" flag so a returning user skips the intro.
  useEffect(() => {
    let alive = true;
    getOnboardingComplete().then((done) => {
      if (!alive) return;
      setOnboarded(done);
      if (!done) setShowPermit(true);
    });
    getSpacesIntroSeen().then((seen) => {
      if (alive && seen) seenSpaces.current = true;
    });
    return () => {
      alive = false;
    };
  }, []);

  // "Okay, listen" → permission already requested by the sheet → enter the
  // guided voice flow (real path, coached first turn).
  const startFirstRun = () => {
    setShowPermit(false);
    sawVoice.current = true;
    navigation.navigate('Saathi', { coach: 'firstRun' });
  };

  // Demo helper: wipe the persisted flag and replay onboarding from the top —
  // jump to Home and slide the "warm ask" back up, no reinstall needed.
  const replayOnboarding = () => {
    setOnboardingComplete(false);
    setSpacesIntroSeen(false);
    seenSpaces.current = false;
    scrollToPage(HOME);
    setShowPermit(true);
  };

  const scrollToPage = (page: number) =>
    // Animated paging scrollTo is unreliable on react-native-web's snap pager, so
    // jump instantly on web; keep the smooth animation on native.
    scrollRef.current?.scrollTo({ x: page * width, animated: Platform.OS !== 'web' });

  // react-native-web doesn't honour a horizontal ScrollView's initial
  // `contentOffset`, so on web the pager would land on the Menu page (0) instead
  // of Home (1). Jump to Home once the width is known. Native uses contentOffset.
  useEffect(() => {
    if (Platform.OS !== 'web' || !width) return;
    const id = requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ x: HOME * width, animated: false }),
    );
    return () => cancelAnimationFrame(id);
  }, [width]);

  // Header + bottom cross-fades, tied to scroll position (native-driven).
  const menuOpacity = scrollX.interpolate({
    inputRange: [0, width * 0.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const homeOpacity = scrollX.interpolate({
    inputRange: [width * 0.5, width, width * 1.5],
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });
  const spacesOpacity = scrollX.interpolate({
    inputRange: [width * 1.5, width * 2],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const composerOpacity = scrollX.interpolate({
    inputRange: [width * 0.5, width],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  // iOS-style windowed carousel dots: the strip slides to keep the active dot
  // centered, and dots shrink toward the edges of the window.
  const dotRowX = scrollX.interpolate({
    inputRange: [SPACES * width, (SPACES + VERTICALS.length - 1) * width],
    outputRange: [DOT_CENTER_X, DOT_CENTER_X - (VERTICALS.length - 1) * DOT_STEP],
    extrapolate: 'clamp',
  });
  const dotScale = (i: number) =>
    scrollX.interpolate({
      inputRange: [
        (SPACES + i - 2) * width,
        (SPACES + i - 1) * width,
        (SPACES + i) * width,
        (SPACES + i + 1) * width,
        (SPACES + i + 2) * width,
      ],
      outputRange: [0.25, 0.7, 1, 0.7, 0.25],
      extrapolate: 'clamp',
    });

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
    useNativeDriver: true,
    listener: (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const i = Math.round(e.nativeEvent.contentOffset.x / width);
      if (!seenSpaces.current && i >= SPACES) {
        seenSpaces.current = true;
        setSpacesIntroSeen(true); // once per install, not per session
        setShowSpacesIntro(true);
        setCoachStage('done'); // interacted with Spaces → no need to hint again
      }
      setActive((prev) => (prev === i ? prev : i));
    },
  });

  // Swipe up on the Home page — or tap the cue below the chips — cycles the set.
  const cyclePhrases = () => setPhraseSet((i) => (i + 1) % PHRASE_SETS.length);

  // Demo: long-press the greeting to cycle the engagement stages (incl. the
  // untrusted 'cold' floor), then back to auto — pitch the ladder without signals.
  const cycleDemo = () => {
    setTaskDismissed(false);
    setMomentDismissed(false);
    setDemoStageIdx((i) => (i == null ? 0 : i + 1 >= DEMO_STAGES.length ? null : i + 1));
  };
  const cycleAstroDepth = () =>
    setAstroDepthIdx((i) => (i == null ? 0 : i + 1 >= ASTRO_DEPTHS.length ? null : i + 1));
  // Demo sheet picks: apply, close, and jump to the surface it affects.
  const pickStage = (idx: number | null) => {
    setTaskDismissed(false);
    setMomentDismissed(false);
    setDemoStageIdx(idx);
    setShowDemo(false);
    scrollToPage(HOME);
  };
  const pickDepth = (idx: number | null) => {
    setAstroDepthIdx(idx);
    setShowDemo(false);
    scrollToPage(SPACES);
  };
  const swipeUp = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) =>
        g.dy < -16 && Math.abs(g.dy) > Math.abs(g.dx) * 1.7,
      onPanResponderRelease: (_e, g) => {
        if (g.dy < -55) cyclePhrases();
      },
    }),
  ).current;

  // A gentle, periodic lift on the "more" cue nudges the eye toward the gesture.
  const hintBounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(2200),
        Animated.timing(hintBounce, {
          toValue: -4,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(hintBounce, {
          toValue: 0,
          friction: 3,
          tension: 140,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [hintBounce, reduced]);

  // Staggered entrance for the phrase rows.
  const anims = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  useLayoutEffect(() => {
    anims.forEach((v) => v.setValue(0));
    Animated.stagger(
      70,
      anims.map((v) =>
        Animated.timing(v, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [phraseSet, anims]);

  const ask = (prompt: string) => navigation.navigate('Saathi', { prompt, mode: 'text' });
  const go = (screen: keyof RootStackParamList) => navigation.navigate(screen as never);
  const boardTop = insets.top + HEADER_H + TAB_H + 8;
  const menuTop = insets.top + HEADER_H + 8;

  return (
    <View style={styles.root}>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        contentOffset={{ x: width, y: 0 }}
        style={StyleSheet.absoluteFill}
      >
        {/* Page 0 — Menu */}
        <ScrollView
          style={{ width }}
          contentContainerStyle={[styles.menuScroll, { paddingTop: menuTop }]}
          showsVerticalScrollIndicator={false}
        >
          {NAV.map((item) => (
            <Pressable
              key={item.label}
              onPress={() => go(item.screen)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.navRow, pressed && styles.pressed]}
            >
              <View style={styles.navCircle}>
                {item.jds ? (
                  <JdsIcon name={item.jds} size={22} color={fig.brand} />
                ) : item.ion ? (
                  <Ionicons name={item.ion} size={22} color={fig.brand} />
                ) : item.mci ? (
                  <MaterialCommunityIcons name={item.mci} size={22} color={fig.brand} />
                ) : null}
              </View>
              <Text style={styles.navLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={fig.textLow} />
            </Pressable>
          ))}
          <Text style={styles.section}>Recents</Text>
          {RECENTS.map((title, i) => (
            <Pressable
              key={i}
              onPress={() => ask(title)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.recentRow, pressed && styles.pressed]}
            >
              <Text style={styles.recentTitle}>{title}</Text>
              <Text style={styles.recentMeta}>Domain · 9 minutes ago</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Page 1 — Home */}
        <View style={{ width }} {...swipeUp.panHandlers}>
          <View style={[styles.homeBody, { paddingTop: insets.top + HEADER_H }]}>
            <Pressable onLongPress={cycleDemo} delayLongPress={450}>
              <Text style={styles.greeting}>
                {showName ? `Namaste, ${USER_NAME}` : 'Namaste'}
              </Text>
            </Pressable>
            <Text style={styles.teach}>What can I do for you today?</Text>
            <View style={styles.phrases}>
              {showCard ? (
                <Animated.View
                  style={{
                    alignSelf: 'stretch',
                    opacity: anims[0],
                    transform: [
                      { translateY: anims[0].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
                    ],
                  }}
                >
                  <ContextLineCard
                    eyebrow={
                      cardKind === 'jumpback'
                        ? 'Pick up where you left off'
                        : stage === 'activated'
                          ? 'Because you’re on Jio'
                          : 'For you'
                    }
                    line={cardKind === 'jumpback' ? JUMPBACK_LINE : TASK_LINE}
                    yesLabel={cardKind === 'jumpback' ? 'Yes, play it' : 'Yes, renew'}
                    onYes={() =>
                      ask(cardKind === 'jumpback' ? 'Read my horoscope' : 'Renew my recharge')
                    }
                    onLater={() => setTaskDismissed(true)}
                  />
                </Animated.View>
              ) : null}
              {(showUsuals ? USUALS : PHRASE_SETS[phraseSet]).map((p, i) => {
                if (showCard && i === 0) return null; // slot 1 → the earned card
                return (
                  <Animated.View
                    key={i}
                    style={{
                      opacity: anims[i],
                      transform: [
                        { translateY: anims[i].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
                      ],
                    }}
                  >
                    <PhraseRow icon={p.icon} jds={p.jds} text={p.text} onPress={() => ask(p.text)} />
                  </Animated.View>
                );
              })}
            </View>
            {showUsuals ? null : (
            <Animated.View style={[styles.moreHint, { transform: [{ translateY: hintBounce }] }]}>
              <Pressable
                onPress={cyclePhrases}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Show more suggestions"
                style={styles.moreHintBtn}
              >
                <Ionicons name="chevron-up" size={14} color={fig.textLow} />
                <View style={styles.setDots}>
                  {PHRASE_SETS.map((_, i) => (
                    <View key={i} style={[styles.setDot, i === phraseSet && styles.setDotActive]} />
                  ))}
                </View>
              </Pressable>
            </Animated.View>
            )}
          </View>
        </View>

        {/* Pages 2–7 — Spaces */}
        {VERTICALS.map((v) => (
          <VerticalBoard
            key={v.id}
            vertical={v}
            width={width}
            topPad={boardTop}
            onAction={ask}
            depth={
              v.id === 'astrology' && astroDepthIdx != null ? ASTRO_DEPTHS[astroDepthIdx] : undefined
            }
            onCycleDepth={v.id === 'astrology' ? cycleAstroDepth : undefined}
          />
        ))}
      </Animated.ScrollView>

      {/* Fade scrim below the nav — content scrolls softly underneath it */}
      <View style={[styles.headerFade, { top: insets.top + HEADER_H }]} pointerEvents="none">
        <TopFade />
      </View>

      {/* Fixed shared header — cross-fades Menu ⇄ Home ⇄ Spaces */}
      <View style={[styles.headerWrap, { paddingTop: insets.top, height: insets.top + HEADER_H }]} pointerEvents="box-none">
        <FrostedBar />
        <Animated.View
          style={[styles.headerRow, styles.headerAbs, { opacity: menuOpacity }]}
          pointerEvents={active === MENU ? 'box-none' : 'none'}
        >
          <Text style={styles.brand}>BharatIQ</Text>
          <Pressable style={styles.circleBtn} onPress={() => scrollToPage(HOME)} accessibilityLabel="Close">
            <Ionicons name="close" size={20} color={fig.textHigh} />
          </Pressable>
        </Animated.View>

        <Animated.View
          style={[styles.headerRow, styles.headerAbs, { opacity: homeOpacity }]}
          pointerEvents={active === HOME ? 'box-none' : 'none'}
        >
          <View style={styles.headerStart}>
            <IconButton icon="menu" onPress={() => scrollToPage(MENU)} accessibilityLabel="Menu" />
            {/* Demo gesture: tap the Jio logo to reset & replay onboarding. */}
            <Pressable onPress={replayOnboarding} accessibilityRole="button" accessibilityLabel="Replay welcome" hitSlop={8}>
              <JioLogo size={40} />
            </Pressable>
          </View>
          <IconButton jds="ic_widgets" onPress={() => scrollToPage(SPACES)} accessibilityLabel="Spaces" />
        </Animated.View>

        <Animated.View
          style={[styles.headerRow, styles.headerAbs, { opacity: spacesOpacity }]}
          pointerEvents={active >= SPACES ? 'box-none' : 'none'}
        >
          <IconButton jds="ic_chevron_left" onPress={() => scrollToPage(HOME)} accessibilityLabel="Back" />
          <View style={styles.headerEnd}>
            <IconButton icon="options-outline" accessibilityLabel="Filter" />
            <IconButton icon="add" accessibilityLabel="New" />
          </View>
          <View style={styles.headerTitleWrap} pointerEvents="none">
            <Text style={styles.headerTitle}>Spaces</Text>
          </View>
        </Animated.View>
      </View>

      {/* Tab strip — fades in over the Spaces pages */}
      <Animated.View
        style={[styles.tabWrap, { top: insets.top + HEADER_H, opacity: spacesOpacity }]}
        pointerEvents={active >= SPACES ? 'auto' : 'none'}
      >
        <FrostedBar />
        <TabStrip
          tabs={VERTICALS.map((v) => v.tab)}
          active={Math.max(0, active - SPACES)}
          onSelect={(i) => scrollToPage(i + SPACES)}
        />
      </Animated.View>

      {/* iOS-style windowed carousel dots — swipe indicator for the Spaces pages */}
      <Animated.View style={[styles.dotsWrap, { opacity: spacesOpacity }]} pointerEvents="none">
        <View style={styles.dotsClip}>
          <Animated.View style={[styles.dotsRow, { transform: [{ translateX: dotRowX }] }]}>
            {VERTICALS.map((v, i) => (
              <Animated.View
                key={v.id}
                style={[styles.dot, { left: i * DOT_STEP, transform: [{ scale: dotScale(i) }] }]}
              />
            ))}
          </Animated.View>
          <View style={styles.dotActive} />
        </View>
      </Animated.View>

      {/* Scrim gradient behind the bottom bar (composer / menu bar) */}
      <View style={styles.bottomFrost} pointerEvents="none">
        <FrostedBar reversed />
      </View>

      {/* Composer — visible on Home + Spaces */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: composerOpacity }]}
        pointerEvents={active >= HOME ? 'box-none' : 'none'}
      >
        <Composer
          onMic={() => openVoice()}
          onSubmit={(text) => navigation.navigate('Saathi', { prompt: text })}
        />
      </Animated.View>

      {/* Menu bottom bar — visible on the Menu page */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: menuOpacity }]}
        pointerEvents={active === MENU ? 'box-none' : 'none'}
      >
        <View style={[styles.menuBar, { bottom: 24 }]}>
          <Pressable
            style={styles.gear}
            onPress={() => setShowDemo(true)}
            accessibilityRole="button"
            accessibilityLabel="Demo controls"
          >
            <Ionicons name="settings-outline" size={20} color={fig.textHigh} />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Saathi', {})}
            accessibilityRole="button"
            style={({ pressed }) => [styles.newChat, pressed && { backgroundColor: fig.brandPressed }]}
          >
            <Ionicons name="pencil" size={16} color={fig.textOnBrand} />
            <Text style={styles.newChatLabel}>New chat</Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* Coach tooltips (Home only, before the first interaction) */}
      {active === HOME && !engaged && !showPermit && coachStage ==='talk' ? (
        <CoachTip style={[styles.tipWrap, { bottom: 82 }]} delay={650} bounce="down">
          <Pressable style={styles.tipPill} onPress={() => setCoachStage('done')}>
            <Text style={styles.tipText}>Tap to talk</Text>
            <View style={styles.caretDown} />
          </Pressable>
        </CoachTip>
      ) : null}
      {active === HOME && !engaged && !showPermit && coachStage ==='spaces' ? (
        <CoachTip style={[styles.tipWrap, { top: insets.top + 54 }]} delay={650} bounce="up">
          <Pressable style={styles.tipPill} onPress={() => setCoachStage('done')}>
            <View style={styles.caretUp} />
            <Text style={styles.tipText}>Tap or swipe for spaces</Text>
          </Pressable>
        </CoachTip>
      ) : null}

      {/* Return-visit live moment — Home only, fades with the pager */}
      {momentEligible ? (
        <Animated.View
          style={[styles.momentWrap, { opacity: homeOpacity }]}
          pointerEvents={active === HOME ? 'box-none' : 'none'}
        >
          <Animated.View style={{ opacity: momentFade }}>
            <HomeMomentBanner
              onJoin={() => ask('Join the Kashi Vishwanath darshan')}
              onLater={dismissMoment}
            />
          </Animated.View>
        </Animated.View>
      ) : null}

      {showDemo ? (
        <DemoSheet
          stageIdx={demoStageIdx}
          depthIdx={astroDepthIdx}
          onStage={pickStage}
          onDepth={pickDepth}
          onClose={() => setShowDemo(false)}
          bottomInset={insets.bottom}
        />
      ) : null}

      {showSpacesIntro ? <SpacesIntroSheet onClose={() => setShowSpacesIntro(false)} /> : null}

      {showPermit ? (
        <MicPermissionSheet onAllow={startFirstRun} onDismiss={() => setShowPermit(false)} />
      ) : null}
    </View>
  );
}

// The returning-user "it already knows me" moment (docs §2 · Concept 2): a gated
// slot-1 line rendered as JBIQ speaking, with one-tap Haan / Baad mein. Framed as
// a question — Haan starts the flow in the assistant, it never charges anything.
function ContextLineCard({
  eyebrow = 'For you',
  line,
  yesLabel = 'Yes',
  onYes,
  onLater,
}: {
  eyebrow?: string;
  line: string;
  yesLabel?: string;
  onYes: () => void;
  onLater: () => void;
}) {
  return (
    <View style={styles.ctxCard}>
      <View style={styles.ctxHead}>
        <MaterialCommunityIcons name="lightning-bolt" size={13} color={fig.brand} />
        <Text style={styles.ctxEyebrow}>{eyebrow}</Text>
      </View>
      <Text style={styles.ctxLine}>{line}</Text>
      <View style={styles.ctxChips}>
        <Pressable
          onPress={onYes}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.ctxChip,
            styles.ctxChipPrimary,
            pressed && styles.ctxChipPressed,
          ]}
        >
          <Text style={styles.ctxChipPrimaryText}>{yesLabel}</Text>
        </Pressable>
        <Pressable
          onPress={onLater}
          accessibilityRole="button"
          style={({ pressed }) => [styles.ctxChip, pressed && styles.ctxChipPressed]}
        >
          <Text style={styles.ctxChipText}>Later</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Demo control sheet (opened from the Menu gear): pick an engagement stage or an
// Astrology depth directly, instead of the hidden long-press gestures. Local demo
// tooling — production has no such surface.
function DemoSheet({
  stageIdx,
  depthIdx,
  onStage,
  onDepth,
  onClose,
  bottomInset,
}: {
  stageIdx: number | null;
  depthIdx: number | null;
  onStage: (idx: number | null) => void;
  onDepth: (idx: number | null) => void;
  onClose: () => void;
  bottomInset: number;
}) {
  return (
    <View style={styles.sheetRoot}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} accessibilityLabel="Close demo controls" />
      <View style={[styles.sheetCard, { paddingBottom: bottomInset + 16 }]}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Demo controls</Text>
        <Text style={styles.sheetHint}>Preview how Home &amp; Spaces adapt by engagement.</Text>

        <Text style={styles.sheetLabel}>Home · app stage</Text>
        <View style={styles.sheetChips}>
          <DemoChip label="Auto" on={stageIdx == null} onPress={() => onStage(null)} />
          {DEMO_STAGES.map((s, i) => (
            <DemoChip key={s} label={s} on={stageIdx === i} onPress={() => onStage(i)} />
          ))}
        </View>

        <Text style={styles.sheetLabel}>Astrology · depth</Text>
        <View style={styles.sheetChips}>
          <DemoChip label="Auto" on={depthIdx == null} onPress={() => onDepth(null)} />
          {ASTRO_DEPTHS.map((d, i) => (
            <DemoChip key={d} label={d} on={depthIdx === i} onPress={() => onDepth(i)} />
          ))}
        </View>
      </View>
    </View>
  );
}

function DemoChip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={[styles.demoChip, on && styles.demoChipOn]}
    >
      <Text style={[styles.demoChipText, on && styles.demoChipTextOn]}>{label}</Text>
    </Pressable>
  );
}

// A coach tooltip that eases in (fade + rise + slight overshoot) on mount, then
// optionally gives a gentle periodic bounce to nudge the eye toward its target.
function CoachTip({
  style,
  children,
  delay = 90,
  bounce = 'none',
}: {
  style?: any;
  children: ReactNode;
  delay?: number;
  bounce?: 'up' | 'down' | 'none';
}) {
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  useEffect(() => {
    const enter = Animated.timing(a, {
      toValue: 1,
      duration: 300,
      delay,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: true,
    });
    let loop: Animated.CompositeAnimation | undefined;
    enter.start(({ finished }) => {
      if (finished && bounce !== 'none' && !reduced) {
        const dir = bounce === 'down' ? 1 : -1;
        loop = Animated.loop(
          Animated.sequence([
            Animated.delay(1200),
            Animated.timing(b, {
              toValue: dir * 5,
              duration: 150,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.spring(b, { toValue: 0, friction: 3, tension: 140, useNativeDriver: true }),
          ]),
        );
        loop.start();
      }
    });
    return () => {
      enter.stop();
      loop?.stop();
    };
  }, [a, b, delay, bounce, reduced]);
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        style,
        {
          opacity: a.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] }),
          transform: [
            { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
            { translateY: b },
            { scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// Scrim gradient behind the fixed chrome (header, tab strip, bottom bar): a
// vertical surface→transparent fade so scrolling content passes softly under
// the bars instead of sitting behind an opaque fill or a native blur. Uses
// react-native-svg (no native rebuild needed). `reversed` flips the fade for
// the bottom bar (transparent at top → surface at bottom).
function FrostedBar({ reversed = false }: { reversed?: boolean }) {
  const id = reversed ? 'scrimUp' : 'scrimDown';
  return (
    <Svg width="100%" height="100%" pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Defs>
        <SvgLinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={fig.surface} stopOpacity={reversed ? 0 : 1} />
          <Stop offset="1" stopColor={fig.surface} stopOpacity={reversed ? 1 : 0} />
        </SvgLinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

// A vertical surface→transparent gradient, so fixed nav can sit over scrolling
// content with a soft edge. Uses react-native-svg (no native rebuild needed).
function TopFade({ height = 28 }: { height?: number }) {
  return (
    <Svg width="100%" height={height} pointerEvents="none">
      <Defs>
        <SvgLinearGradient id="topFade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={fig.surface} stopOpacity={1} />
          <Stop offset="1" stopColor={fig.surface} stopOpacity={0} />
        </SvgLinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height={height} fill="url(#topFade)" />
    </Svg>
  );
}

// ── One vertical's board ──────────────────────────────────────────────────
function VerticalBoard({
  vertical,
  width,
  topPad,
  onAction,
  depth,
  onCycleDepth,
}: {
  vertical: Vertical;
  width: number;
  topPad: number;
  onAction: (prompt: string) => void;
  depth?: VerticalDepth;
  onCycleDepth?: () => void;
}) {
  let firstHeroSeen = false;
  // Per-vertical depth override (docs …engagement-v1 §6); falls back to the
  // default content when this vertical has no depth variants or none is set.
  const content = (depth && vertical.depth?.[depth]) || vertical;
  return (
    <ScrollView
      style={{ width }}
      contentContainerStyle={[styles.board, { paddingTop: topPad }]}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onLongPress={onCycleDepth} disabled={!onCycleDepth} delayLongPress={450}>
        <Text style={styles.contextLine}>{content.contextLine}</Text>
      </Pressable>

      {content.blocks.map((block, i) => {
        switch (block.kind) {
          case 'hero': {
            const isFirstHero = !firstHeroSeen;
            if (isFirstHero) firstHeroSeen = true;
            // The lead moment stays a hero card; any later "signature" hero
            // collapses into a row to match the list layout.
            if (!isFirstHero) {
              return (
                <View key={i} style={styles.rowGap}>
                  <ActionCard
                    icon={block.hero.icon}
                    jds={block.hero.jds}
                    title={block.hero.title}
                    subtitle={block.hero.body}
                    onPress={() => onAction(block.hero.prompt)}
                  />
                </View>
              );
            }
            return (
              <View key={i} style={styles.blockGap}>
                <HeroCard
                  icon={block.hero.icon}
                  jds={block.hero.jds}
                  live={block.hero.live}
                  eyebrow={block.hero.eyebrow}
                  title={block.hero.title}
                  body={block.hero.body}
                  tinted
                  button={{
                    label: block.hero.buttonLabel,
                    variant: block.hero.buttonVariant,
                    icon: block.hero.buttonIcon,
                    onPress: () => onAction(block.hero.prompt),
                  }}
                />
              </View>
            );
          }
          case 'grid':
            return (
              <View key={i} style={styles.grid}>
                {block.items.map((a) => (
                  <ActionCard
                    key={a.title}
                    icon={a.icon}
                    jds={a.jds}
                    title={a.title}
                    subtitle={a.subtitle}
                    soon={a.soon}
                    locked={a.locked}
                    onPress={() => onAction(a.prompt)}
                    onNotify={() => onAction(`${a.title} ke liye notify karo`)}
                  />
                ))}
              </View>
            );
          case 'action':
            return (
              <View key={i} style={styles.rowGap}>
                <ActionCard
                  icon={block.item.icon}
                  jds={block.item.jds}
                  title={block.item.title}
                  subtitle={block.item.subtitle}
                  soon={block.item.soon}
                  locked={block.item.locked}
                  onPress={() => onAction(block.item.prompt)}
                  onNotify={() => onAction(`${block.item.title} ke liye notify karo`)}
                />
              </View>
            );
          case 'label':
            return (
              <Text key={i} style={styles.sectionLabel}>
                {block.text}
              </Text>
            );
          case 'cricket':
            return (
              <View key={i} style={[styles.blockGap, styles.card]}>
                <View style={styles.eyebrowRow}>
                  <View style={styles.liveDot} />
                  <Text style={styles.eyebrowLive}>{block.eyebrow}</Text>
                </View>
                <Text style={styles.score}>{block.score}</Text>
                <Text style={styles.cricketMeta}>{block.meta}</Text>
                <View style={styles.chipRow}>
                  {block.chips.map((c) => (
                    <Pressable
                      key={c.label}
                      onPress={() => onAction(c.prompt)}
                      accessibilityRole="button"
                      style={styles.chip}
                    >
                      <Text style={styles.chipLabel}>{c.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          case 'disclaimer':
            return (
              <Text key={i} style={styles.disclaimer}>
                {block.text}
              </Text>
            );
          default:
            return null;
        }
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: fig.surface },

  // Menu page
  menuScroll: { paddingHorizontal: 16, paddingBottom: 96 },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  pressed: { opacity: 0.6 },
  navCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: fig.lilac,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: { flex: 1, fontSize: 17, fontWeight: '700', color: fig.textHigh, ...font('700') },
  section: { fontSize: 13, fontWeight: '700', color: fig.textLow, marginTop: 20, marginBottom: 6, ...font('700') },
  recentRow: { paddingVertical: 10, gap: 3 },
  recentTitle: { fontSize: 15, fontWeight: '700', color: fig.textHigh, ...font('700') },
  recentMeta: { fontSize: 13, color: fig.textLow, ...font('400') },

  // Home page
  homeBody: { flex: 1, paddingHorizontal: 16 },
  greeting: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 22,
    color: fig.textHigh,
    textAlign: 'center',
    marginTop: 72,
    ...font('800'),
  },
  teach: {
    fontSize: 16,
    lineHeight: 22,
    color: fig.textLow,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
    ...font('400'),
  },
  phrases: { gap: 12, alignItems: 'center' },
  demoTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: fig.textLow,
    textAlign: 'center',
    marginTop: 6,
    ...font('700'),
  },

  // Returning-user context line (slot 1)
  ctxCard: {
    alignSelf: 'stretch',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: fig.strokeCard,
    backgroundColor: fig.heroTint,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  ctxHead: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  ctxEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: fig.brand,
    ...font('800'),
  },
  ctxLine: { fontSize: 16, fontWeight: '700', lineHeight: 21, color: fig.textHigh, ...font('700') },
  ctxChips: { flexDirection: 'row', gap: 8, marginTop: 12 },
  ctxChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: fig.strokeCard,
    backgroundColor: fig.surface,
  },
  ctxChipPressed: { opacity: 0.7 },
  ctxChipPrimary: { backgroundColor: fig.brand, borderColor: fig.brand },
  ctxChipPrimaryText: { fontSize: 13, fontWeight: '800', color: fig.textOnBrand, ...font('800') },
  ctxChipText: { fontSize: 13, fontWeight: '700', color: fig.textHigh, ...font('700') },
  moreHint: { alignSelf: 'center', marginTop: 18 },
  moreHintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  setDots: { flexDirection: 'row', gap: 6 },
  setDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(12,13,16,0.18)' },
  setDotActive: { backgroundColor: fig.brand },

  // Fixed header
  headerWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden', // clip the scrim gradient to the bar
    zIndex: 10,
  },
  bottomFrost: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 84,
    overflow: 'hidden',
    // No zIndex: paints above the content ScrollView (JSX order) but below the
    // composer / menu bar, which are rendered after it.
  },
  headerRow: {
    height: HEADER_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerAbs: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  headerStart: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: '700', lineHeight: 16, color: fig.textHigh, ...font('700') },
  headerEnd: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerTitleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { fontSize: 20, fontWeight: '800', color: fig.textHigh, letterSpacing: -0.3, ...font('800') },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: fig.surfaceGhost,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tab strip overlay
  tabWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: TAB_H,
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 9,
  },

  // Menu bottom bar
  menuBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gear: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: fig.surfaceGhost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newChat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: fig.brand,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 999,
  },
  newChatLabel: { fontSize: 15, fontWeight: '800', color: fig.textOnBrand, ...font('800') },

  // Board
  board: { paddingHorizontal: 16, paddingBottom: 96 },
  contextLine: { fontSize: 20, fontWeight: '800', lineHeight: 22, color: fig.textHigh, marginBottom: 4, ...font('800') },
  depthTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: fig.textLow,
    marginBottom: 4,
    ...font('700'),
  },

  // Demo control sheet
  sheetRoot: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', zIndex: 50 },
  sheetBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(12,13,16,0.35)' },
  sheetCard: {
    backgroundColor: fig.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: fig.surfaceGhost, marginBottom: 12 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: fig.textHigh, ...font('800') },
  sheetHint: { fontSize: 13, color: fig.textLow, marginTop: 2, marginBottom: 8, ...font('400') },
  sheetLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: fig.textLow,
    marginTop: 12,
    marginBottom: 8,
    ...font('800'),
  },
  sheetChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  demoChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: fig.strokeCard,
    backgroundColor: fig.surface,
  },
  demoChipOn: { backgroundColor: fig.brand, borderColor: fig.brand },
  demoChipText: { fontSize: 13, fontWeight: '700', color: fig.textHigh, textTransform: 'capitalize', ...font('700') },
  demoChipTextOn: { color: fig.textOnBrand },
  blockGap: { marginTop: 12 },
  rowGap: { marginTop: 10 },
  grid: { marginTop: 10, gap: 10 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: fig.textLow,
    marginTop: 16,
    ...font('800'),
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: fig.strokeCard,
    backgroundColor: fig.surface,
    padding: 12,
  },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: fig.live },
  eyebrowLive: { fontSize: 13, fontWeight: '700', color: fig.live, ...font('700') },
  score: { fontSize: 22, fontWeight: '900', color: fig.textHigh, ...font('900') },
  cricketMeta: { fontSize: 13, color: fig.textLow, marginTop: 2, ...font('400') },
  chipRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: fig.strokeCard,
    backgroundColor: fig.surface,
  },
  chipLabel: { fontSize: 12.5, fontWeight: '700', color: fig.textHigh, ...font('700') },
  disclaimer: { fontSize: 10.5, color: fig.textLow, marginTop: 14, lineHeight: 15, ...font('400') },

  // Nav fade scrims
  headerFade: { position: 'absolute', left: 0, right: 0, height: 28, zIndex: 8 },

  // Return-visit live-moment banner (Home only)
  momentWrap: { position: 'absolute', left: 16, right: 16, bottom: 82, zIndex: 9 },

  // iOS-style windowed carousel dots (Spaces swipe indicator)
  dotsWrap: { position: 'absolute', left: 0, right: 0, bottom: 82, alignItems: 'center', zIndex: 9 },
  dotsClip: { width: DOT_CLIP_W, height: DOT_SIZE, overflow: 'hidden', justifyContent: 'center' },
  dotsRow: { position: 'absolute', left: 0, top: 0, height: DOT_SIZE },
  dot: {
    position: 'absolute',
    top: 0,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: 'rgba(12,13,16,0.22)',
  },
  dotActive: {
    position: 'absolute',
    left: DOT_CENTER_X,
    top: 0,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: fig.brand,
  },

  // Coach tooltips
  tipWrap: { position: 'absolute', right: 10, zIndex: 20 },
  tipPill: {
    backgroundColor: '#141414',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  tipText: { color: '#ffffff', fontSize: 13, fontWeight: '600', ...font('600') },
  caretUp: {
    position: 'absolute',
    top: -6,
    right: 26,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#141414',
  },
  caretDown: {
    position: 'absolute',
    bottom: -6,
    right: 26,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#141414',
  },
});
