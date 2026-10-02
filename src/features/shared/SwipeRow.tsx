import { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { haptics } from '../../lib/haptics';
import { Icon, IconName } from '../../ui/Icon';
import { Text } from '../../ui/Text';

export type SwipeAction = {
  key: string;
  label: string;
  icon: IconName;
  color: string;
  onPress: () => void;
};

const ACTION_WIDTH = 78;

function renderActions(actions: SwipeAction[], methods: SwipeableMethods, side: 'left' | 'right') {
  return (
    <View style={{ flexDirection: 'row', gap: 8, paddingLeft: side === 'right' ? 8 : 0, paddingRight: side === 'left' ? 8 : 0 }}>
      {actions.map((action) => (
        <Pressable
          key={action.key}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={() => {
            haptics.tap();
            methods.close();
            action.onPress();
          }}
          style={{ width: ACTION_WIDTH, borderRadius: 22, backgroundColor: action.color, alignItems: 'center', justifyContent: 'center', gap: 4 }}
        >
          <Icon name={action.icon} size={22} color="#FFFFFF" />
          <Text variant="caption" weight="700" color="#FFFFFF" numberOfLines={1}>
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Optional swipe shortcuts – every action is also reachable from the long-press menu. */
export function SwipeRow({ left, right, children }: { left?: SwipeAction[]; right?: SwipeAction[]; children: ReactNode }) {
  if (!left?.length && !right?.length) {
    return <>{children}</>;
  }
  return (
    <ReanimatedSwipeable
      friction={2}
      overshootLeft={false}
      overshootRight={false}
      leftThreshold={40}
      rightThreshold={40}
      renderLeftActions={left?.length ? (_progress, _translation, methods) => renderActions(left, methods, 'left') : undefined}
      renderRightActions={right?.length ? (_progress, _translation, methods) => renderActions(right, methods, 'right') : undefined}
    >
      {children}
    </ReanimatedSwipeable>
  );
}
