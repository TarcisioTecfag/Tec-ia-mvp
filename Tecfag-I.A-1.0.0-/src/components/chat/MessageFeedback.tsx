import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { FeedbackModal } from './FeedbackModal';
import { feedbackApi } from '@/lib/api';

interface MessageFeedbackProps {
    messageContent: string;
    queryContent: string;
    messageId?: string;
    model?: string;
    catalogId?: string;
}

export function MessageFeedback({
    messageContent,
    queryContent,
    messageId,
    model,
    catalogId
}: MessageFeedbackProps) {
    const [showModal, setShowModal] = useState(false);
    const [rating, setRating] = useState<'positive' | 'negative' | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitFeedback = async (feedbackData: {
        rating: 'positive' | 'negative';
        category?: string;
        comment?: string;
    }) => {
        setIsSubmitting(true);
        try {
            await feedbackApi.submit({
                messageId,
                messageContent,
                queryContent,
                rating: feedbackData.rating,
                category: feedbackData.category,
                comment: feedbackData.comment,
                model,
                catalogId,
            });

            setRating(feedbackData.rating);
            toast.success('Obrigado pelo feedback!');
        } catch (error) {
            console.error('Erro ao enviar feedback:', error);
            toast.error('Erro ao enviar feedback');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQuickFeedback = async (feedbackRating: 'positive' | 'negative') => {
        await submitFeedback({ rating: feedbackRating });
    };

    const handleDetailedFeedback = async (data: {
        category?: string;
        comment?: string;
    }) => {
        await submitFeedback({
            rating: 'negative', // Modal de feedback detalhado é apenas para negativo
            ...data,
        });
        setShowModal(false);
    };

    return (
        <>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <span>Esta resposta foi útil?</span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickFeedback('positive')}
                    disabled={isSubmitting || rating !== null}
                    className="h-8 px-2"
                >
                    <ThumbsUp
                        className={cn(
                            'h-4 w-4',
                            rating === 'positive' && 'text-green-500 fill-green-500'
                        )}
                    />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickFeedback('negative')}
                    disabled={isSubmitting || rating !== null}
                    className="h-8 px-2"
                >
                    <ThumbsDown
                        className={cn(
                            'h-4 w-4',
                            rating === 'negative' && 'text-red-500 fill-red-500'
                        )}
                    />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowModal(true)}
                    disabled={isSubmitting || rating !== null}
                    className="h-8 px-2"
                >
                    <MessageSquare className="h-4 w-4" />
                </Button>
            </div>

            <FeedbackModal
                open={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={handleDetailedFeedback}
            />
        </>
    );
}
