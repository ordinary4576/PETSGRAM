import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';

const STAGES = [
  'Submitted',
  'Reviewed',
  'Interview',
  'Meeting',
  'Approved',
  'Adopted'
];

interface AdoptionTimelineProps {
  currentStage: typeof STAGES[number];
}

export default function AdoptionTimeline({ currentStage }: AdoptionTimelineProps) {
  const activeIndex = STAGES.indexOf(currentStage);

  return (
    <View style={styles.container}>
      <Text style={styles.timelineTitle}>Adoption Progress Tracker 🐾</Text>
      
      <View style={styles.stepsContainer}>
        {STAGES.map((stage, index) => {
          const isCompleted = index < activeIndex;
          const isActive = index === activeIndex;
          const isFuture = index > activeIndex;

          return (
            <View key={stage} style={styles.stepRow}>
              {/* Node Column */}
              <View style={styles.nodeColumn}>
                <View
                  style={[
                    styles.nodeCircle,
                    isCompleted && styles.nodeCircleCompleted,
                    isActive && styles.nodeCircleActive,
                    isFuture && styles.nodeCircleFuture
                  ]}
                >
                  {isCompleted ? (
                    <Check color="#ffffff" size={12} />
                  ) : (
                    <View
                      style={[
                        styles.innerDot,
                        isActive && styles.innerDotActive,
                        isFuture && styles.innerDotFuture
                      ]}
                    />
                  )}
                </View>
                {index < STAGES.length - 1 && (
                  <View
                    style={[
                      styles.connectorLine,
                      index < activeIndex && styles.connectorLineCompleted
                    ]}
                  />
                )}
              </View>

              {/* Text Column */}
              <View style={styles.textColumn}>
                <Text
                  style={[
                    styles.stageLabel,
                    isActive && styles.stageLabelActive,
                    isCompleted && styles.stageLabelCompleted
                  ]}
                >
                  {stage}
                </Text>
                <Text style={styles.stageDesc}>
                  {isCompleted && 'Task verification cleared'}
                  {isActive && 'Active review stage ongoing'}
                  {isFuture && 'Pending prerequisite completions'}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eae3db',
    gap: 16
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#4a3f35'
  },
  stepsContainer: {
    paddingLeft: 4
  },
  stepRow: {
    flexDirection: 'row',
    gap: 16,
    minHeight: 56
  },
  nodeColumn: {
    alignItems: 'center'
  },
  nodeCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    zIndex: 2
  },
  nodeCircleCompleted: {
    backgroundColor: '#6aa84f',
    borderColor: '#6aa84f'
  },
  nodeCircleActive: {
    borderColor: '#d97452',
    backgroundColor: '#ffffff'
  },
  nodeCircleFuture: {
    borderColor: '#eae3db',
    backgroundColor: '#faf6f0'
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  innerDotActive: {
    backgroundColor: '#d97452'
  },
  innerDotFuture: {
    backgroundColor: '#eae3db'
  },
  connectorLine: {
    width: 2,
    flexGrow: 1,
    backgroundColor: '#eae3db',
    marginVertical: 2,
    zIndex: 1
  },
  connectorLineCompleted: {
    backgroundColor: '#6aa84f'
  },
  textColumn: {
    flex: 1,
    paddingTop: 1,
    gap: 2
  },
  stageLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8e8276'
  },
  stageLabelActive: {
    color: '#d97452'
  },
  stageLabelCompleted: {
    color: '#4a3f35'
  },
  stageDesc: {
    fontSize: 10,
    color: '#8e8276'
  }
});
