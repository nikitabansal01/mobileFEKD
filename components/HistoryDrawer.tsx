/**
 * HistoryDrawer - Slide-in panel showing per-flow chat history
 * 
 * Like ChatGPT's sidebar but for each individual chat type.
 */

import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { moderateScale } from 'react-native-size-matters';
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';

import { chatService } from '@/services/chatService';

interface Thread {
    id: string;
    flow_type: string;
    local_date: string;
    summary: string | null;
    message_count: number;
    created_at: string;
    updated_at: string;
    is_active: boolean;
}

interface HistoryDrawerProps {
    visible: boolean;
    onClose: () => void;
    flowType: string;
    flowTitle: string;
    onSelectThread: (threadId: string, messages: any[]) => void;
    onNewChat: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.85;

const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
    visible,
    onClose,
    flowType,
    flowTitle,
    onSelectThread,
    onNewChat,
}) => {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [loading, setLoading] = useState(false);
    const slideAnim = useState(new Animated.Value(DRAWER_WIDTH))[0];

    useEffect(() => {
        if (visible) {
            loadThreads();
            // Slide in
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                friction: 8,
            }).start();
        } else {
            // Slide out
            Animated.timing(slideAnim, {
                toValue: DRAWER_WIDTH,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const loadThreads = async () => {
        setLoading(true);
        try {
            const result = await chatService.getThreadsByFlow(flowType);
            setThreads(result.threads || []);
        } catch (error) {
            console.error('Failed to load threads:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectThread = async (thread: Thread) => {
        try {
            const data = await chatService.getThreadMessages(flowType, thread.id);
            if (data && data.messages) {
                onSelectThread(thread.id, data.messages);
                onClose();
            }
        } catch (error) {
            console.error('Failed to load thread messages:', error);
        }
    };

    const formatDateTime = (isoString: string) => {
        if (!isoString) return '';

        // Backend sends UTC timestamps from datetime.utcnow().isoformat() which lacks 'Z'
        // We must append 'Z' to treat it as UTC, otherwise JS treats it as local time.
        // We only do this if it has a time component ('T') and no timezone indication.
        let safeIso = isoString;
        if (isoString.includes('T') && !isoString.endsWith('Z') && !isoString.includes('+')) {
            safeIso = `${isoString}Z`;
        }

        const date = new Date(safeIso);
        const today = new Date();

        const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

        if (date.toDateString() === today.toDateString()) {
            return `Today • ${timeStr}`;
        }

        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${dateStr} • ${timeStr}`;
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            {/* Backdrop */}
            <TouchableOpacity
                style={styles.backdrop}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={styles.backdrop} />
            </TouchableOpacity>

            {/* Drawer */}
            <Animated.View
                style={[
                    styles.drawer,
                    { transform: [{ translateX: slideAnim }] }
                ]}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>{flowTitle} History</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color="#000" />
                    </TouchableOpacity>
                </View>

                {/* New Chat Button */}
                <TouchableOpacity
                    style={styles.newChatBtn}
                    onPress={() => {
                        onNewChat();
                        onClose();
                    }}
                >
                    <LinearGradient
                        colors={['#E8B4FF', '#FCC4DA']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.newChatGradient}
                    >
                        <Ionicons name="add-circle-outline" size={20} color="#000" />
                        <Text style={styles.newChatText}>New {flowTitle}</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Thread List */}
                <ScrollView style={styles.threadList} showsVerticalScrollIndicator={false}>
                    {loading ? (
                        <Text style={styles.loadingText}>Loading...</Text>
                    ) : threads.length === 0 ? (
                        <Text style={styles.emptyText}>No past conversations yet</Text>
                    ) : (
                        threads.map((thread) => (
                            <TouchableOpacity
                                key={thread.id}
                                style={styles.threadItem}
                                onPress={() => handleSelectThread(thread)}
                            >
                                <View style={styles.threadHeader}>
                                    <Text style={styles.threadDate}>{formatDateTime(thread.created_at || thread.local_date)}</Text>
                                    {/* Removed message count as requested */}
                                </View>
                                <Text style={styles.threadSummary} numberOfLines={2}>
                                    {thread.summary || 'Conversation started'}
                                </Text>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    drawer: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: DRAWER_WIDTH,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
        paddingTop: responsiveHeight(6),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: responsiveWidth(5),
        paddingBottom: responsiveHeight(2),
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    title: {
        fontSize: moderateScale(16, 1.2),
        fontFamily: 'Inter600',
        color: '#000',
    },
    closeBtn: {
        padding: 8,
    },
    newChatBtn: {
        margin: responsiveWidth(5),
        marginTop: responsiveHeight(2),
        borderRadius: 12,
        overflow: 'hidden',
    },
    newChatGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    newChatText: {
        fontSize: moderateScale(14, 1.1),
        fontFamily: 'Inter600',
        color: '#000',
    },
    threadList: {
        flex: 1,
        paddingHorizontal: responsiveWidth(5),
    },
    loadingText: {
        textAlign: 'center',
        color: '#999',
        marginTop: 20,
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        marginTop: 40,
        fontSize: moderateScale(14, 1),
    },
    threadItem: {
        backgroundColor: '#FFF5FA',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    threadHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    threadDate: {
        fontSize: moderateScale(12, 1),
        fontFamily: 'Inter600',
        color: '#000',
    },
    threadCount: {
        fontSize: moderateScale(10, 1),
        fontFamily: 'Inter400',
        color: '#666',
    },
    threadSummary: {
        fontSize: moderateScale(12, 1),
        fontFamily: 'Inter400',
        color: '#555',
        lineHeight: 18,
    },
});

export default HistoryDrawer;
