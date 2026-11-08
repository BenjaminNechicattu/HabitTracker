import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const palette = {
  bg: '#f3f5f7',
  panel: '#ffffff',
  panelLine: '#dfe3e7',
  text: '#202124',
  textSoft: '#5f6368',
  muted: '#8a8f96',
  blue: '#1a73e8',
  blueSoft: '#e8f0fe',
  green: '#188038',
  greenSoft: '#d7f5df',
  warning: '#f9ab00',
  warningSoft: '#fff3cd',
  shadow: 'rgba(32, 33, 36, 0.08)',
};

function Divider() {
  return <View style={styles.divider} />;
}

export function ProductionReleaseScreen() {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.page}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Create production release</Text>
        </View>

        <View style={styles.alertBanner}>
          <Text style={styles.warningGlyph}>⚠</Text>
          <Text style={styles.alertText}>We found some problems with your release</Text>
        </View>

        <View style={styles.stepperWrap}>
          <View style={styles.stepGroup}>
            <View style={styles.stepDone}>
              <Text style={styles.stepDoneText}>✓</Text>
            </View>
            <Text style={styles.stepComplete}>Create release</Text>
          </View>

          <View style={styles.stepGroup}>
            <View style={styles.stepCurrent}>
              <Text style={styles.stepCurrentText}>2</Text>
            </View>
            <Text style={styles.stepCurrentLabel}>Preview and confirm</Text>
          </View>

          <View style={styles.spacer} />

          <Text style={styles.discardLink}>Discard draft release</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Errors, warnings and messages</Text>

          <View style={styles.warningCard}>
            <View style={styles.warningHeaderMain}>
              <View style={styles.warningTitleWrap}>
                <Text style={styles.warningMainGlyph}>⚠</Text>
                <Text style={styles.warningMainTitle}>1 Warning</Text>
              </View>
              <Text style={styles.showToggle}>Show less</Text>
            </View>

            <View style={styles.messageBlock}>
              <Text style={styles.messageMeta}>1 MESSAGE FOR VERSION CODE 4</Text>
              <View style={styles.inlineWarningRow}>
                <Text style={styles.inlineWarningGlyph}>⚠</Text>
                <Text style={styles.inlineWarningText}>Warning</Text>
              </View>
              <Text style={styles.messageText}>
                There is no deobfuscation file associated with this App Bundle. If you use
                obfuscation code (R8/proguard), uploading a deobfuscation file will make crashes
                and ANRs easier to analyse and debug.{' '}
                <Text style={styles.linkInline}>Learn more</Text>
              </Text>
            </View>
          </View>
        </View>

        <Divider />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Release delivery</Text>

          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Size for new installs</Text>
              <Text style={styles.metricValue}>27.9 MB</Text>
            </View>

            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Time to download</Text>
              <Text style={styles.metricValue}>16 s</Text>
            </View>

            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Size for updates</Text>
              <View style={styles.progressTrack}>
                <View style={styles.progressFill} />
              </View>
            </View>
          </View>
        </View>

        <Divider />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>New app bundles</Text>

          <View style={styles.tableWrap}>
            <View style={styles.tableHeaderRow}>
              <Text style={styles.tableHeader}>File type</Text>
              <Text style={styles.tableHeader}>Version</Text>
              <Text style={styles.tableHeader}>API levels</Text>
              <Text style={styles.tableHeader}>Target SDK</Text>
              <Text style={styles.tableHeader}>Screen layouts</Text>
              <Text style={styles.tableHeader}>ABIs</Text>
              <Text style={styles.tableHeader}>Required features</Text>
            </View>

            <View style={styles.tableRow}>
              <View style={styles.cellFileType}>
                <Text style={styles.fileTypeText}>App bundle</Text>
                <View style={styles.enhancedPill}>
                  <Text style={styles.enhancedText}>Enhanced</Text>
                </View>
              </View>
              <Text style={styles.tableCell}>4 (4.0.0)</Text>
              <Text style={styles.tableCell}>24+</Text>
              <Text style={styles.tableCell}>36</Text>
              <Text style={styles.tableCell}>4</Text>
              <Text style={styles.tableCell}>4</Text>
              <Text style={styles.tableCell}>4</Text>
            </View>
          </View>
        </View>

        <Divider />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Release notes</Text>

          <View style={styles.notesBox}>
            <Text style={styles.notesLine}>Default language • en-GB</Text>
            <Text style={styles.notesLine}>• Please fix the issue where the app crashes on launch.</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: palette.bg,
    paddingVertical: 18,
  },
  page: {
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
    backgroundColor: palette.bg,
    paddingHorizontal: 28,
  },
  headerRow: {
    marginTop: 10,
    marginBottom: 14,
  },
  title: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '500',
    letterSpacing: -0.5,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    marginBottom: 18,
  },
  warningGlyph: {
    color: palette.warning,
    fontSize: 17,
    fontWeight: '700',
  },
  alertText: {
    color: palette.text,
    fontSize: 14,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: palette.panelLine,
    borderBottomWidth: 1,
    borderBottomColor: palette.panelLine,
    paddingVertical: 14,
    marginBottom: 20,
  },
  stepGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 28,
  },
  stepDone: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1d9d4d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDoneText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 12,
  },
  stepComplete: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '500',
  },
  stepCurrent: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#dfe3e7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCurrentText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 12,
  },
  stepCurrentLabel: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '500',
  },
  spacer: {
    flex: 1,
  },
  discardLink: {
    color: palette.blue,
    fontSize: 15,
    fontWeight: '500',
  },
  section: {
    paddingTop: 26,
    paddingBottom: 10,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '500',
    marginBottom: 18,
  },
  warningCard: {
    borderWidth: 1,
    borderColor: palette.panelLine,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  warningHeaderMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: palette.panelLine,
  },
  warningTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningMainGlyph: {
    color: palette.warning,
    fontSize: 16,
    fontWeight: '700',
  },
  warningMainTitle: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  showToggle: {
    color: palette.blue,
    fontSize: 14,
    fontWeight: '500',
  },
  messageBlock: {
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  messageMeta: {
    color: palette.textSoft,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  inlineWarningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  inlineWarningGlyph: {
    color: palette.warning,
    fontSize: 14,
    fontWeight: '700',
  },
  inlineWarningText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '600',
  },
  messageText: {
    color: palette.textSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  linkInline: {
    color: palette.blue,
    fontWeight: '500',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: palette.panelLine,
    marginTop: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    gap: 40,
  },
  metricBox: {
    flex: 1,
    minHeight: 70,
    justifyContent: 'flex-end',
  },
  metricLabel: {
    color: palette.textSoft,
    fontSize: 12,
    marginBottom: 8,
  },
  metricValue: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '500',
  },
  progressTrack: {
    width: '100%',
    maxWidth: 160,
    height: 12,
    borderRadius: 8,
    backgroundColor: '#e6e8eb',
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    width: '60%',
    height: '100%',
    backgroundColor: '#c2c7cc',
  },
  tableWrap: {
    borderTopWidth: 1,
    borderTopColor: palette.panelLine,
    borderBottomWidth: 1,
    borderBottomColor: palette.panelLine,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 20,
  },
  tableHeader: {
    flex: 1,
    color: palette.textSoft,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    minHeight: 52,
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: palette.panelLine,
  },
  cellFileType: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fileTypeText: {
    color: palette.text,
    fontSize: 14,
  },
  enhancedPill: {
    backgroundColor: palette.greenSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#a9e0b0',
  },
  enhancedText: {
    color: palette.green,
    fontSize: 12,
    fontWeight: '600',
  },
  tableCell: {
    flex: 1,
    color: palette.text,
    fontSize: 14,
  },
  notesBox: {
    paddingTop: 6,
  },
  notesLine: {
    color: palette.textSoft,
    fontSize: 14,
    lineHeight: 24,
  },
});
