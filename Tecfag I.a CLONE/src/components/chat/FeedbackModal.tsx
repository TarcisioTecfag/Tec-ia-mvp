import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface FeedbackModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: { category?: string; comment?: string }) => void;
}

const feedbackCategories = [
    { value: 'incorrect', label: 'Informação incorreta' },
    { value: 'incomplete', label: 'Resposta incompleta' },
    { value: 'confusing', label: 'Informação confusa ou mal explicada' },
    { value: 'too_long', label: 'Resposta muito longa/curta' },
    { value: 'other', label: 'Outro' },
];

export function FeedbackModal({ open, onClose, onSubmit }: FeedbackModalProps) {
    const [category, setCategory] = useState<string>('');
    const [comment, setComment] = useState('');

    const handleSubmit = () => {
        onSubmit({
            category: category || undefined,
            comment: comment.trim() || undefined,
        });

        // Reset form
        setCategory('');
        setComment('');
    };

    const handleClose = () => {
        setCategory('');
        setComment('');
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Feedback sobre esta resposta</DialogTitle>
                    <DialogDescription>
                        Nos ajude a melhorar a qualidade das respostas da IA.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-3">
                        <Label>O que houve de errado?</Label>
                        <RadioGroup value={category} onValueChange={setCategory}>
                            {feedbackCategories.map((cat) => (
                                <div key={cat.value} className="flex items-center space-x-2">
                                    <RadioGroupItem value={cat.value} id={cat.value} />
                                    <Label htmlFor={cat.value} className="font-normal cursor-pointer">
                                        {cat.label}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="comment">Comentário adicional (opcional)</Label>
                        <Textarea
                            id="comment"
                            placeholder="Descreva o problema com mais detalhes..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit}>
                        Enviar Feedback
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
