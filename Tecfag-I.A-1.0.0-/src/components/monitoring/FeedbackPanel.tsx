import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ThumbsUp, ThumbsDown, MessageSquare, TrendingUp } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { feedbackApi, FeedbackStats, Feedback } from '@/lib/api';

const categoryLabels: Record<string, string> = {
    incorrect: 'Informação incorreta',
    incomplete: 'Resposta incompleta',
    confusing: 'Informação confusa',
    too_long: 'Resposta muito longa/curta',
    other: 'Outro',
};

export function FeedbackPanel() {
    const [stats, setStats] = useState<FeedbackStats | null>(null);
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchStats();
        fetchFeedbacks();
    }, [filter]);

    const fetchStats = async () => {
        try {
            const data = await feedbackApi.getStats();
            setStats(data);
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
        }
    };

    const fetchFeedbacks = async () => {
        setIsLoading(true);
        try {
            const ratingFilter = filter === 'all' ? undefined : filter;
            const data = await feedbackApi.getRecent(20, ratingFilter);
            setFeedbacks(data.feedbacks || []);
        } catch (error) {
            console.error('Erro ao buscar feedbacks:', error);
            setFeedbacks([]);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!stats) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-card/50 border-white/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total de Feedbacks</p>
                            <p className="text-2xl font-bold">{stats.total}</p>
                        </div>
                        <MessageSquare className="h-8 w-8 text-muted-foreground" />
                    </div>
                </Card>

                <Card className="p-4 bg-card/50 border-white/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Positivos</p>
                            <p className="text-2xl font-bold text-green-500">{stats.totalPositive}</p>
                        </div>
                        <ThumbsUp className="h-8 w-8 text-green-500" />
                    </div>
                </Card>

                <Card className="p-4 bg-card/50 border-white/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Negativos</p>
                            <p className="text-2xl font-bold text-red-500">{stats.totalNegative}</p>
                        </div>
                        <ThumbsDown className="h-8 w-8 text-red-500" />
                    </div>
                </Card>

                <Card className="p-4 bg-card/50 border-white/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Taxa de Satisfação</p>
                            <p className="text-2xl font-bold text-primary">{stats.satisfactionRate}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-primary" />
                    </div>
                </Card>
            </div>

            {/* Category Breakdown */}
            {stats.categoryBreakdown.length > 0 && (
                <Card className="p-4 bg-card/50 border-white/10">
                    <h3 className="text-lg font-semibold mb-4">Categorias de Problemas</h3>
                    <div className="space-y-2">
                        {stats.categoryBreakdown.map((item) => (
                            <div key={item.category} className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                    {categoryLabels[item.category] || item.category}
                                </span>
                                <span className="text-sm font-medium">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Recent Feedbacks */}
            <Card className="p-4 bg-card/50 border-white/10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Feedbacks Recentes</h3>
                    <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrar por" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="positive">Positivos</SelectItem>
                            <SelectItem value="negative">Negativos</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                    </div>
                ) : feedbacks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhum feedback encontrado
                    </p>
                ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                        {feedbacks.map((feedback) => (
                            <div
                                key={feedback.id}
                                className="border border-white/10 rounded-lg p-4 space-y-2"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        {feedback.rating === 'positive' ? (
                                            <ThumbsUp className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <ThumbsDown className="h-4 w-4 text-red-500" />
                                        )}
                                        <span className="text-sm font-medium">{feedback.user.name}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDate(feedback.createdAt)}
                                    </span>
                                </div>

                                {feedback.category && (
                                    <div className="text-xs text-muted-foreground">
                                        Categoria: {categoryLabels[feedback.category] || feedback.category}
                                    </div>
                                )}

                                <div className="text-sm">
                                    <div className="font-medium text-muted-foreground mb-1">Pergunta:</div>
                                    <div className="text-xs bg-white/5 rounded p-2 border border-white/5">
                                        {feedback.queryContent.length > 200
                                            ? `${feedback.queryContent.substring(0, 200)}...`
                                            : feedback.queryContent}
                                    </div>
                                </div>

                                {feedback.comment && (
                                    <div className="text-sm">
                                        <div className="font-medium text-muted-foreground mb-1">Comentário:</div>
                                        <div className="text-xs bg-white/5 rounded p-2 border border-white/5">
                                            {feedback.comment}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
