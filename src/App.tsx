import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNavigation } from './components/BottomNavigation';
import { HeroSection } from './components/HeroSection';
import { WasteScanner } from './components/WasteScanner';
import { AIIdeaGenerator } from './components/AIIdeaGenerator';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { DiscoverFeed } from './components/DiscoverFeed';
import { CreateProjectModal } from './components/CreateProjectModal';
import { IdeaHub } from './components/IdeaHub';
import { BusinessHub } from './components/BusinessHub';
import { DonationHub } from './components/DonationHub';
import { UserProfile } from './components/UserProfile';
import { AdminPanel } from './components/AdminPanel';
import { SearchModal } from './components/SearchModal';
import { AuthModal } from './components/AuthModal';

export const App: React.FC = () => {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<string>('home');

  // Scanner & AI Idea states
  const [currentScannedMaterial, setCurrentScannedMaterial] = useState<string>('Cardboard');
  const [currentScanData, setCurrentScanData] = useState<any | null>(null);

  // Modals state
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectDetailData, setProjectDetailData] = useState<any | null>(null);
  const [showCreatePostModal, setShowCreatePostModal] = useState<boolean>(false);
  const [createPostPrefill, setCreatePostPrefill] = useState<any | null>(null);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Idea Hub prefill
  const [ideaHubPrefill, setIdeaHubPrefill] = useState<{ question: string; material: string } | null>(null);

  const handleScanComplete = (scan: any) => {
    setCurrentScanData(scan);
    setCurrentScannedMaterial(scan.detected_material);
  };

  const handleNavigateToIdeas = (material: string, scanData: any) => {
    setCurrentScannedMaterial(material);
    setCurrentScanData(scanData);
    setActiveTab('ideas');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProject = (projectId: string, ideaData?: any) => {
    setSelectedProjectId(projectId);
    setProjectDetailData(ideaData || null);
  };

  const handleStartProjectPost = (proj: any) => {
    setSelectedProjectId(null);
    setCreatePostPrefill(proj);
    setShowCreatePostModal(true);
  };

  // Section 14: "I Don't Like These Ideas" -> Ask Community
  const handleAskCommunity = (prefilledQuestion: string, materialName: string) => {
    setIdeaHubPrefill({ question: prefilledQuestion, material: materialName });
    setActiveTab('idea_hub');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Desktop Navbar */}
      <Navbar
        activeTab={activeTab}
        onNavigateTab={(tab) => { setActiveTab(tab); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onOpenSearch={() => setShowSearchModal(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenScan={() => { setActiveTab('scan'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
      />

      {/* Main Content Area */}
      <main className="main-content">
        <div className="app-container">
          {activeTab === 'home' && (
            <HeroSection
              onScanClick={() => setActiveTab('scan')}
              onAskAiClick={() => { setCurrentScannedMaterial('Cardboard'); setActiveTab('ideas'); }}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onSelectProject={handleSelectProject}
            />
          )}

          {activeTab === 'scan' && (
            <WasteScanner
              onScanComplete={handleScanComplete}
              onNavigateToIdeas={handleNavigateToIdeas}
            />
          )}

          {activeTab === 'ideas' && (
            <AIIdeaGenerator
              material={currentScannedMaterial}
              scanData={currentScanData}
              onSelectProject={handleSelectProject}
              onAskCommunity={handleAskCommunity}
            />
          )}

          {activeTab === 'discover' && (
            <DiscoverFeed
              onOpenCreateModal={() => { setCreatePostPrefill(null); setShowCreatePostModal(true); }}
              onSelectProject={handleSelectProject}
            />
          )}

          {activeTab === 'idea_hub' && (
            <IdeaHub
              initialQuestionPrefill={ideaHubPrefill?.question}
              initialMaterialPrefill={ideaHubPrefill?.material}
            />
          )}

          {activeTab === 'business' && (
            <BusinessHub />
          )}

          {activeTab === 'donations' && (
            <DonationHub />
          )}

          {activeTab === 'profile' && (
            <UserProfile
              onSelectProject={handleSelectProject}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'admin' && (
            <AdminPanel />
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (Section 4) */}
      <BottomNavigation
        activeTab={activeTab}
        onNavigateTab={(tab) => { setActiveTab(tab); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onOpenScan={() => { setActiveTab('scan'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
      />

      {/* Project Detail Modal ("Try This Idea") */}
      {selectedProjectId && (
        <ProjectDetailModal
          projectId={selectedProjectId}
          initialData={projectDetailData}
          onClose={() => setSelectedProjectId(null)}
          onStartProjectPost={handleStartProjectPost}
        />
      )}

      {/* Create Project Post Modal (Before & After transformation publisher) */}
      {showCreatePostModal && (
        <CreateProjectModal
          initialProjectData={createPostPrefill}
          onClose={() => setShowCreatePostModal(false)}
          onPostPublished={() => { setActiveTab('discover'); }}
        />
      )}

      {/* Global Search Modal (Section 36) */}
      {showSearchModal && (
        <SearchModal
          onClose={() => setShowSearchModal(false)}
          onSelectProject={handleSelectProject}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      )}

      {/* Auth & Demo Role Switcher Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
};
