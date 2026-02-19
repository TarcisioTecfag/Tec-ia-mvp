import { useState } from "react";
import MindMapIntro from "./MindMapIntro";
import MindMapCategoryView from "./MindMapCategoryView";
import MindMapTab from "./MindMapTab";

type MindMapView = "intro" | "category" | "editor";

interface MindMapModuleProps {
    isAdmin: boolean;
}

const MindMapModule = ({ isAdmin }: MindMapModuleProps) => {
    const [currentView, setCurrentView] = useState<MindMapView>("intro");
    const [currentCategory, setCurrentCategory] = useState<string>("");
    const [selectedMapId, setSelectedMapId] = useState<string | null>(null);

    const handleNavigate = (slug: string) => {
        setCurrentCategory(slug);
        setCurrentView("category");
    };

    const handleBackToIntro = () => {
        setCurrentView("intro");
        setCurrentCategory("");
    };

    const handleSelectMap = (mapId: string) => {
        setSelectedMapId(mapId);
        setCurrentView("editor");
    };

    const handleBackToCategory = () => {
        setCurrentView("category");
        setSelectedMapId(null);
    };

    // If we are in 'editor', we render the old MindMapTab (renamed or reused)
    // We need to pass props to it to let it know it should load a specific map
    // or allow it to be blank if it's a new map from a "Create" action.

    return (
        <div className="h-full w-full">
            {currentView === "intro" && (
                <MindMapIntro onNavigate={handleNavigate} />
            )}

            {currentView === "category" && (
                <MindMapCategoryView
                    slug={currentCategory}
                    onBack={handleBackToIntro}
                    onSelectMap={handleSelectMap}
                    isAdmin={isAdmin}
                />
            )}

            {currentView === "editor" && (
                <MindMapTab
                    isAdmin={isAdmin}
                    initialMapId={selectedMapId}
                    onBack={handleBackToCategory}
                />
            )}
        </div>
    );
};

export default MindMapModule;
