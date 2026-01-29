import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Header from "@/components/layout/Header";
import TabNavigation from "@/components/layout/TabNavigation";
import ChatTab from "@/components/chat/ChatTab";
import MindMapTab from "@/components/mindmap/MindMapTab";
import CatalogTab from "@/components/catalog/CatalogTab";
import UsersTab from "@/components/users/UsersTab";
import MonitoringTab from "@/components/monitoring/MonitoringTab";
import DocumentsTab from "@/components/documents/DocumentsTab";
import SettingsTab from "@/components/settings/SettingsTab";
import { useAuth } from "@/contexts/AuthContext";

type TabType = "chat" | "mindmap" | "catalog" | "users" | "monitoring" | "documents" | "settings";

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const { isAdmin, user, logout, canView } = useAuth();

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
    <div className="min-h-screen flex flex-col">
      <Header
        isAdmin={isAdmin}
        user={user}
        onLogout={logout}
      />

      {/* Desktop Tab Navigation */}
      <div className="hidden md:block pt-16">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isAdmin} canView={canView} />
      </div>

      {/* Mobile spacer */}
      <div className="md:hidden h-16" />

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0">
        <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-10rem)]">
          <AnimatePresence mode="wait">
            {activeTab === "chat" && canView('chat') && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <ChatTab />
              </motion.div>
            )}
            {activeTab === "mindmap" && canView('mindmap') && (
              <motion.div
                key="mindmap"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <MindMapTab isAdmin={isAdmin} />
              </motion.div>
            )}
            {activeTab === "catalog" && canView('catalog') && (
              <motion.div
                key="catalog"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <CatalogTab isAdmin={isAdmin} />
              </motion.div>
            )}
            {activeTab === "users" && canView('users') && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <UsersTab />
              </motion.div>
            )}
            {activeTab === "monitoring" && canView('monitoring') && (
              <motion.div
                key="monitoring"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <MonitoringTab />
              </motion.div>
            )}
            {activeTab === "documents" && canView('documents') && (
              <motion.div
                key="documents"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <DocumentsTab />
              </motion.div>
            )}
            {activeTab === "settings" && canView('settings') && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <SettingsTab />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Tab Navigation */}
      <div className="md:hidden">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isAdmin} canView={canView} />
      </div>
    </div>
  );
};

export default Index;
