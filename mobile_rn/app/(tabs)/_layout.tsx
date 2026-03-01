import { Tabs } from 'expo-router';
import { View } from 'react-native';
import CustomTabBar from '../../components/CustomTabBar';

export default function TabsLayout() {
    return (
        <View className="flex-1 bg-transparent">
            <Tabs
                tabBar={props => <CustomTabBar {...props} />}
                screenOptions={{
                    headerShown: false,
                    tabBarShowLabel: false,
                    // Critical for floating tab bar to let background and content bleed through behind it
                    sceneStyle: { backgroundColor: 'transparent' }
                }}
            >
                <Tabs.Screen name="dashboard" />
                <Tabs.Screen name="vehicles" />
                <Tabs.Screen name="transactions" />
                <Tabs.Screen name="credit" />
                <Tabs.Screen name="more" />
                <Tabs.Screen name="superadmin" />
                <Tabs.Screen name="profile" />
            </Tabs>
        </View>
    );
}
