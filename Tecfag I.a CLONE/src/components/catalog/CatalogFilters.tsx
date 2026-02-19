import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CatalogFiltersProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    categoryFilter: string;
    setCategoryFilter: (category: string) => void;
    tagFilter: string;
    setTagFilter: (tag: string) => void;
    categories: string[];
    globalTags: string[];
}

export const CatalogFilters = ({
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    tagFilter,
    setTagFilter,
    categories,
    globalTags,
}: CatalogFiltersProps) => {
    return (
        <div className="glass-card p-4 space-y-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nome, modelo ou categoria..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>
            <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Filtros:</span>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[160px] h-9 bg-secondary/50">
                        <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas categorias</SelectItem>
                        {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={tagFilter} onValueChange={setTagFilter}>
                    <SelectTrigger className="w-[160px] h-9 bg-secondary/50">
                        <SelectValue placeholder="Tags" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas tags</SelectItem>
                        {globalTags.map((tag) => (
                            <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};
