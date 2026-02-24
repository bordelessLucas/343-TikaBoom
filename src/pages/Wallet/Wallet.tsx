import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '../../routes/NavigationContext';
import { styles } from './Wallet.styles';

interface Transaction {
    id: string;
    type: 'deposit' | 'withdrawal' | 'earned' | 'spent';
    amount: number;
    description: string;
    date: string;
    status: 'completed' | 'pending' | 'failed';
}

export const Wallet = () => {
    const { navigate } = useNavigation();
    const [balance] = useState(1250.50);
    const [totalEarned] = useState(3450.00);
    const [totalSpent] = useState(2199.50);

    // Dados mockados de transações
    const [transactions] = useState<Transaction[]>([
        {
            id: '1',
            type: 'earned',
            amount: 150.00,
            description: 'Ganhos de visualizações',
            date: '2024-01-15',
            status: 'completed',
        },
        {
            id: '2',
            type: 'spent',
            amount: 50.00,
            description: 'Compra de moedas',
            date: '2024-01-14',
            status: 'completed',
        },
        {
            id: '3',
            type: 'deposit',
            amount: 500.00,
            description: 'Depósito via PIX',
            date: '2024-01-12',
            status: 'completed',
        },
        {
            id: '4',
            type: 'earned',
            amount: 75.00,
            description: 'Ganhos de curtidas',
            date: '2024-01-10',
            status: 'completed',
        },
        {
            id: '5',
            type: 'withdrawal',
            amount: 200.00,
            description: 'Saque para conta bancária',
            date: '2024-01-08',
            status: 'completed',
        },
        {
            id: '6',
            type: 'earned',
            amount: 120.00,
            description: 'Ganhos de compartilhamentos',
            date: '2024-01-05',
            status: 'completed',
        },
        {
            id: '7',
            type: 'spent',
            amount: 30.00,
            description: 'Compra de moedas',
            date: '2024-01-03',
            status: 'completed',
        },
        {
            id: '8',
            type: 'deposit',
            amount: 1000.00,
            description: 'Depósito via cartão',
            date: '2024-01-01',
            status: 'completed',
        },
    ]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Hoje';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Ontem';
        } else {
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            });
        }
    };

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'deposit':
                return 'add-circle';
            case 'withdrawal':
                return 'remove-circle';
            case 'earned':
                return 'trending-up';
            case 'spent':
                return 'trending-down';
            default:
                return 'circle';
        }
    };

    const getTransactionColor = (type: string) => {
        switch (type) {
            case 'deposit':
            case 'earned':
                return '#4CAF50';
            case 'withdrawal':
            case 'spent':
                return '#FF6B6B';
            default:
                return '#999';
        }
    };

    const handleAddMoney = () => {
        Alert.alert(
            'Adicionar Dinheiro',
            'Escolha o método de pagamento:',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'PIX', onPress: () => Alert.alert('Em desenvolvimento', 'Integração de pagamento em breve.') },
                { text: 'Cartão', onPress: () => Alert.alert('Em desenvolvimento', 'Integração de pagamento em breve.') },
            ]
        );
    };

    const handleWithdraw = () => {
        Alert.alert(
            'Sacar Dinheiro',
            'Escolha o método de saque:',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'PIX', onPress: () => Alert.alert('Em desenvolvimento', 'Integração de saque em breve.') },
                { text: 'Conta Bancária', onPress: () => Alert.alert('Em desenvolvimento', 'Integração de saque em breve.') },
            ]
        );
    };

    const handleViewDetails = (transaction: Transaction) => {
        Alert.alert(
            'Detalhes da Transação',
            `Tipo: ${transaction.type === 'deposit' ? 'Depósito' : transaction.type === 'withdrawal' ? 'Saque' : transaction.type === 'earned' ? 'Ganhos' : 'Gastos'}\n` +
            `Valor: ${formatCurrency(transaction.amount)}\n` +
            `Descrição: ${transaction.description}\n` +
            `Data: ${formatDate(transaction.date)}\n` +
            `Status: ${transaction.status === 'completed' ? 'Concluído' : transaction.status === 'pending' ? 'Pendente' : 'Falhou'}`,
            [{ text: 'OK' }]
        );
    };

    const renderTransaction = ({ item }: { item: Transaction }) => {
        const isPositive = item.type === 'deposit' || item.type === 'earned';
        const iconColor = getTransactionColor(item.type);

        return (
            <TouchableOpacity
                style={styles.transactionItem}
                onPress={() => handleViewDetails(item)}
            >
                <View style={styles.transactionLeft}>
                    <View style={[styles.transactionIconContainer, { backgroundColor: `${iconColor}20` }]}>
                        <MaterialIcons name={getTransactionIcon(item.type) as any} size={24} color={iconColor} />
                    </View>
                    <View style={styles.transactionInfo}>
                        <Text style={styles.transactionDescription}>{item.description}</Text>
                        <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
                    </View>
                </View>
                <View style={styles.transactionRight}>
                    <Text style={[
                        styles.transactionAmount,
                        { color: isPositive ? '#4CAF50' : '#FF6B6B' }
                    ]}>
                        {isPositive ? '+' : '-'}{formatCurrency(Math.abs(item.amount))}
                    </Text>
                    {item.status === 'pending' && (
                        <View style={styles.pendingBadge}>
                            <Text style={styles.pendingText}>Pendente</Text>
                        </View>
                    )}
                    {item.status === 'failed' && (
                        <View style={styles.failedBadge}>
                            <Text style={styles.failedText}>Falhou</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <LinearGradient
            colors={['#28002b', '#1a1a2e', '#0a0a1a']}
            style={styles.container}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigate('MyProfile')} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Carteira</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Balance Card */}
                <View style={styles.balanceCard}>
                    <LinearGradient
                        colors={['rgba(111, 1, 117, 0.3)', 'rgba(111, 1, 117, 0.1)']}
                        style={styles.balanceCardGradient}
                    >
                        <Text style={styles.balanceLabel}>Saldo Disponível</Text>
                        <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
                        <View style={styles.balanceStats}>
                            <View style={styles.balanceStatItem}>
                                <MaterialIcons name="trending-up" size={16} color="#4CAF50" />
                                <Text style={styles.balanceStatText}>
                                    Ganhos: {formatCurrency(totalEarned)}
                                </Text>
                            </View>
                            <View style={styles.balanceStatItem}>
                                <MaterialIcons name="trending-down" size={16} color="#FF6B6B" />
                                <Text style={styles.balanceStatText}>
                                    Gastos: {formatCurrency(totalSpent)}
                                </Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.addButton]}
                        onPress={handleAddMoney}
                    >
                        <MaterialIcons name="add-circle" size={28} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Adicionar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.withdrawButton]}
                        onPress={handleWithdraw}
                    >
                        <MaterialIcons name="remove-circle" size={28} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Sacar</Text>
                    </TouchableOpacity>
                </View>

                {/* Quick Stats */}
                <View style={styles.quickStats}>
                    <View style={styles.quickStatCard}>
                        <MaterialIcons name="account-balance-wallet" size={24} color="#6F0175" />
                        <Text style={styles.quickStatValue}>{formatCurrency(balance)}</Text>
                        <Text style={styles.quickStatLabel}>Saldo</Text>
                    </View>
                    <View style={styles.quickStatCard}>
                        <MaterialIcons name="attach-money" size={24} color="#4CAF50" />
                        <Text style={styles.quickStatValue}>{formatCurrency(totalEarned)}</Text>
                        <Text style={styles.quickStatLabel}>Total Ganho</Text>
                    </View>
                    <View style={styles.quickStatCard}>
                        <MaterialIcons name="shopping-cart" size={24} color="#FF6B6B" />
                        <Text style={styles.quickStatValue}>{formatCurrency(totalSpent)}</Text>
                        <Text style={styles.quickStatLabel}>Total Gasto</Text>
                    </View>
                </View>

                {/* Transactions Header */}
                <View style={styles.transactionsHeader}>
                    <Text style={styles.transactionsTitle}>Histórico de Transações</Text>
                    <TouchableOpacity onPress={() => Alert.alert('Filtros', 'Filtros de transações em breve.')}>
                        <MaterialIcons name="filter-list" size={24} color="#999" />
                    </TouchableOpacity>
                </View>

                {/* Transactions List */}
                {transactions.length > 0 ? (
                    <View style={styles.transactionsList}>
                        {transactions.map((transaction) => (
                            <View key={transaction.id}>
                                {renderTransaction({ item: transaction })}
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyTransactions}>
                        <MaterialIcons name="account-balance-wallet" size={48} color="rgba(255,255,255,0.3)" />
                        <Text style={styles.emptyTransactionsText}>Nenhuma transação ainda</Text>
                        <Text style={styles.emptyTransactionsSubtext}>
                            Suas transações aparecerão aqui
                        </Text>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </LinearGradient>
    );
};
