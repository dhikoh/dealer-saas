import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useTheme } from '../../components/ThemeContext';
import clsx from 'clsx';
import CustomTabBar from '../../components/CustomTabBar';

export default function TabsLayout() {
    const { colors } = useTheme();

    return (
        <View className={clsx("flex-1", colors.bgApp)}>
            <Tabs
                tabBar={props => <CustomTabBar {...props} />}
                screenOptions={{
                    headerShown: false,
                    tabBarShowLabel: false,
                    sceneStyle: { backgroundColor: 'transparent' } // Important for neumorphic bg
                }}
            >
                <Tabs.Screen name="dashboard" />
                <Tabs.Screen name="vehicles" />
                <Tabs.Screen name="credit" />
                <Tabs.Screen name="profile" />
            </Tabs>
        </View>
    );
}
