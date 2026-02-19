import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Header from "@/components/layout/Header";
import TabNavigation from "@/components/layout/TabNavigation";
import ChatTab from "@/components/chat/ChatTab";
// import MindMapTab from "@/components/mindmap/MindMapTab"; // Kept for reference but not used directly
import MindMapModule from "@/components/mindmap/MindMapModule";
import CatalogTab from "@/components/catalog/CatalogTab";
import UsersTab from "@/components/users/UsersTab";
import MonitoringTab from "@/components/monitoring/MonitoringTab";
import DocumentsTab from "@/components/documents/DocumentsTab";
import SettingsTab from "@/components/settings/SettingsTab";
import { useAuth } from "@/contexts/AuthContext";

type TabType = "chat" | "mindmap" | "catalog" | "users" | "monitoring" | "documents" | "settings";

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isAdmin, user, logout, canView } = useAuth();

  const toggleCollapse = () => setIsCollapsed(prev => !prev);

  // Listen for tab switch events
  useEffect(() => {
    const handleTabSwitch = (e: CustomEvent<TabType>) => {
      if (canView(e.detail)) {
        setActiveTab(e.detail);
      }
    };

    window.addEventListener('switch-tab', handleTabSwitch as EventListener);
    return () => {
      window.removeEventListener('switch-tab', handleTabSwitch as EventListener);
    };
  }, [canView]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header
        isAdmin={isAdmin}
        user={user}
        onLogout={logout}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />

      {/* Desktop Tab Navigation */}
      {!isCollapsed && (
        <div className="hidden md:block pt-16">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isAdmin} canView={canView} />
        </div>
      )}

      {/* Mobile spacer */}
      {!isCollapsed && (
        <div className="md:hidden h-16" />
      )}

      {/* Main Content */}
      <main className="flex-1 min-h-0">
        <div className="h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {activeTab === "chat" && canView('chat') && <ChatTab />}
              {activeTab === "mindmap" && canView('mindmap') && <MindMapModule isAdmin={isAdmin} />}
              {activeTab === "catalog" && canView('catalog') && <CatalogTab isAdmin={isAdmin} />}
              {activeTab === "users" && canView('users') && <UsersTab />}
              {activeTab === "monitoring" && canView('monitoring') && <MonitoringTab />}
              {activeTab === "documents" && canView('documents') && <DocumentsTab />}
              {activeTab === "settings" && canView('settings') && <SettingsTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Tab Navigation */}
      {!isCollapsed && (
        <div className="md:hidden">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isAdmin} canView={canView} />
        </div>
      )}
    </div>
  );
};

export default Index;
