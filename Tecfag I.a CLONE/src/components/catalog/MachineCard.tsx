import { useState } from "react";
import { ChevronDown, ChevronUp, Edit2, Save, X, Wrench, DollarSign, Plus, Trash2, Hash, MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Machine } from "@/types/catalog";

interface MachineCardProps {
    machine: Machine;
    index: number;
    isAdmin: boolean;
    isExpanded: boolean;
    isEditing: boolean;
    editData: Partial<Machine>;
    globalTags: string[];
    setEditData: React.Dispatch<React.SetStateAction<Partial<Machine>>>;
    onExpand: () => void;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    onDelete: (e: React.MouseEvent) => void;
    toggleMachineTag: (tag: string) => void;
    onAskAboutMachine?: (machine: Machine) => void;
    children?: React.ReactNode;
}

export const MachineCard = ({
    machine,
    index,
    isAdmin,
    isExpanded,
    isEditing,
    editData,
    globalTags,
    setEditData,
    onExpand,
    onEdit,
    onSave,
    onCancel,
    onDelete,
    toggleMachineTag,
    onAskAboutMachine,
    children
}: MachineCardProps) => {
    return (
        <div
            className="glass-card overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            {/* Card Header & Compact View */}
            <div
                className={cn(
                    "p-4 cursor-pointer transition-colors",
                    isExpanded && "bg-secondary/30"
                )}
                onClick={onExpand}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {isEditing ? (
                                <Input
                                    value={editData.category || ""}
                                    onChange={(e) =>
                                        setEditData((prev) => ({ ...prev, category: e.target.value }))
                                    }
                                    className="text-xs w-48 h-6 bg-secondary/50"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <span className="text-xs font-mono text-primary uppercase tracking-wider mr-2">
                                    {machine.category}
                                </span>
                            )}

                            {/* Tags Rendering */}
                            {(!isEditing ? machine.tags : editData.tags)?.map(tag => (
                                <Badge key={tag} variant="outline" className="text-[10px] h-5 px-1.5 bg-red-500/10 text-red-500 border-red-500/20">
                                    {tag}
                                    {isEditing && (
                                        <X className="w-3 h-3 ml-1 cursor-pointer hover:text-red-700" onClick={() => toggleMachineTag(tag)} />
                                    )}
                                </Badge>
                            ))}
                            {isEditing && (
                                <Select onValueChange={toggleMachineTag}>
                                    <SelectTrigger className="h-5 w-5 p-0 border-dashed rounded-full">
                                        <Plus className="w-3 h-3 mx-auto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {globalTags.map(tag => (
                                            <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {isEditing ? (
                            <Input
                                value={editData.name || ""}
                                onChange={(e) =>
                                    setEditData((prev) => ({ ...prev, name: e.target.value }))
                                }
                                className="text-lg font-semibold bg-secondary/50 mt-1"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <h3 className="text-lg font-semibold truncate">{machine.name}</h3>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                        {/* Ask about machine - visible to all users */}
                        {!isEditing && onAskAboutMachine && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-blue-400"
                                title="Perguntar sobre esta máquina"
                                onClick={(e) => { e.stopPropagation(); onAskAboutMachine(machine); }}
                            >
                                <MessageCircleQuestion className="w-4 h-4" />
                            </Button>
                        )}
                        {isAdmin && !isEditing && (
                            <>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={onDelete}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </>
                        )}
                        {isEditing ? (
                            <>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500" onClick={(e) => { e.stopPropagation(); onSave(); }}>
                                    <Save className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={(e) => { e.stopPropagation(); onCancel(); }}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </>
                        ) : (
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Quick Info Line */}
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4" />
                        {isEditing ? (
                            <Input
                                value={editData.price || ""}
                                onChange={(e) => setEditData((prev) => ({ ...prev, price: e.target.value }))}
                                className="h-6 text-xs w-28"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span>{machine.price}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Wrench className="w-4 h-4" />
                        {isEditing ? (
                            <div className="flex items-center gap-1">
                                <span>Modelo:</span>
                                <Input
                                    value={editData.model || ""}
                                    onChange={(e) => setEditData((prev) => ({ ...prev, model: e.target.value }))}
                                    className="h-6 text-xs w-32"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        ) : (
                            <span>Modelo: {machine.model}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Hash className="w-4 h-4" />
                        {isEditing ? (
                            <div className="flex items-center gap-1">
                                <span>Next:</span>
                                <Input
                                    value={editData.next || ""}
                                    onChange={(e) => setEditData((prev) => ({ ...prev, next: e.target.value }))}
                                    className="h-6 text-xs w-36"
                                    placeholder="Código Next"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        ) : (
                            machine.next && <span>Next: {machine.next}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Expanded Content (Details) */}
            {isExpanded && (
                <div className="p-4 pt-0 border-t border-secondary/50 bg-secondary/10">
                    {children}
                </div>
            )}
        </div>
    );
};
