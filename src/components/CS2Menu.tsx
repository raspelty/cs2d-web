import React, { useState, useEffect } from 'react';
import { GAME_MODES, MAPS_BY_MODE, getModeByType } from '@/game/gameModes';
import { GameMode } from '@/game/types';

interface CS2MenuProps {
  onStartGame: (mode: GameMode, map: string, team: 'ct' | 't') => void;
  onOpenInventory: () => void;
  onOpenLoadout: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
}

const CS2Menu: React.FC<CS2MenuProps> = ({
  onStartGame,
  onOpenInventory,
  onOpenLoadout,
  onOpenSettings,
  onOpenProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'play' | 'inventory' | 'loadout' | 'settings' | 'profile'>('play');
  const [selectedMainMode, setSelectedMainMode] = useState<'casual' | 'deathmatch' | 'competitive'>('casual');
  const [selectedMode, setSelectedMode] = useState<GameMode>(GAME_MODES[0]);
  const [selectedMap, setSelectedMap] = useState<string>('DUST II');
  const [selectedTeam, setSelectedTeam] = useState<'ct' | 't'>('ct');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    // Update selected mode when main mode changes
    if (selectedMainMode === 'casual') {
      setSelectedMode(getModeByType('casual'));
      setSelectedMap(MAPS_BY_MODE.casual[0]);
    } else if (selectedMainMode === 'deathmatch') {
      setSelectedMode(getModeByType('deathmatch'));
      setSelectedMap(MAPS_BY_MODE.deathmatch[0]);
    } else if (selectedMainMode === 'competitive') {
      setSelectedMode(getModeByType('competitive'));
      setSelectedMap(MAPS_BY_MODE.competitive[0]);
    }
  }, [selectedMainMode]);

  const handlePlayClick = () => {
    onStartGame(selectedMode, selectedMap, selectedTeam);
  };

  const renderPlayTab = () => (
    <div className="play-container">
      {/* Left Sidebar - Main Mode Selection */}
      <div className="mode-sidebar">
        <button 
          className={`mode-main-btn ${selectedMainMode === 'casual' ? 'active' : ''}`}
          onClick={() => setSelectedMainMode('casual')}
        >
          <span className="mode-icon">🎮</span>
          <span className="mode-label">CASUAL</span>
        </button>
        <button 
          className={`mode-main-btn ${selectedMainMode === 'deathmatch' ? 'active' : ''}`}
          onClick={() => setSelectedMainMode('deathmatch')}
        >
          <span className="mode-icon">⚡</span>
          <span className="mode-label">DEATHMATCH</span>
        </button>
        <button 
          className={`mode-main-btn ${selectedMainMode === 'competitive' ? 'active' : ''}`}
          onClick={() => setSelectedMainMode('competitive')}
        >
          <span className="mode-icon">🏆</span>
          <span className="mode-label">COMPETITIVE</span>
        </button>
        <div className="mode-sidebar-footer">
          <button className="mode-main-btn">
            <span className="mode-icon">🎯</span>
            <span className="mode-label">WINGMAN</span>
          </button>
          <button className="mode-main-btn">
            <span className="mode-icon">🧟</span>
            <span className="mode-label">ZOMBIE</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="play-main">
        {/* Mode Info Header */}
        <div className="mode-header">
          <h1 className="mode-title">{selectedMode.name}</h1>
          <p className="mode-description">{selectedMode.description}</p>
        </div>

        {/* Map Selection */}
        <div className="map-section">
          <h2 className="section-title">SELECT MAP</h2>
          <div className="map-grid">
            {MAPS_BY_MODE[selectedMode.type]?.map(map => (
              <button
                key={map}
                className={`map-card ${selectedMap === map ? 'selected' : ''}`}
                onClick={() => setSelectedMap(map)}
              >
                <div className="map-thumbnail">
                  <div className="map-placeholder">{map.charAt(0)}</div>
                </div>
                <div className="map-name">{map}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Team Selection */}
        <div className="team-section">
          <h2 className="section-title">CHOOSE TEAM</h2>
          <div className="team-row">
            <button
              className={`team-card ct ${selectedTeam === 'ct' ? 'selected' : ''}`}
              onClick={() => setSelectedTeam('ct')}
            >
              <div className="team-emblems">
                <span className="team-emblem">🛡️</span>
                <span className="team-emblem-large">CT</span>
              </div>
              <div className="team-info">
                <div className="team-name">COUNTER-TERRORIST</div>
                <div className="team-desc">Defuse bombs • Rescue hostages</div>
              </div>
            </button>
            
            <button
              className={`team-card t ${selectedTeam === 't' ? 'selected' : ''}`}
              onClick={() => setSelectedTeam('t')}
            >
              <div className="team-emblems">
                <span className="team-emblem">💣</span>
                <span className="team-emblem-large">T</span>
              </div>
              <div className="team-info">
                <div className="team-name">TERRORIST</div>
                <div className="team-desc">Plant bombs • Eliminate CTs</div>
              </div>
            </button>
          </div>
        </div>

        {/* Game Info and Play Button */}
        <div className="game-info-bar">
          <div className="game-stats">
            <div className="stat-item">
              <span className="stat-label">Mode</span>
              <span className="stat-value">{selectedMode.name}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Map</span>
              <span className="stat-value">{selectedMap}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Team</span>
              <span className="stat-value team-text">{selectedTeam === 'ct' ? 'CT' : 'T'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Players</span>
              <span className="stat-value">5/10</span>
            </div>
          </div>
          <button className="play-big-btn" onClick={handlePlayClick}>
            PLAY
          </button>
        </div>
      </div>

      {/* Right Panel - 2D Sprite */}
      <div className="sprite-panel">
        <div 
          className="floating-sprite"
          style={{
            transform: `translate(${(mousePos.x - window.innerWidth + 200) * 0.02}px, ${(mousePos.y - window.innerHeight/2) * 0.02}px)`
          }}
        >
          <div className="sprite-character">
            <div className="sprite-image">
              {/* This would be your 2D sprite image */}
              <div className="sprite-placeholder">
                <span className="sprite-emoji">🪖</span>
              </div>
            </div>
            <div className="sprite-name">CS2D OPERATOR</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInventoryTab = () => (
    <div className="tab-container inventory-container">
      <h1 className="tab-title">INVENTORY</h1>
      <div className="inventory-grid">
        <div className="inventory-category">
          <h2>RIFLES</h2>
          <div className="skin-list">
            <div className="skin-item">
              <div className="skin-icon">🔫</div>
              <div className="skin-details">
                <div className="skin-name">AK-47 | Inheritance</div>
                <div className="skin-rarity">Covert</div>
              </div>
            </div>
            <div className="skin-item">
              <div className="skin-icon">🔫</div>
              <div className="skin-details">
                <div className="skin-name">M4A4 | Temukau</div>
                <div className="skin-rarity">Covert</div>
              </div>
            </div>
            <div className="skin-item">
              <div className="skin-icon">🔫</div>
              <div className="skin-details">
                <div className="skin-name">AWP | Chrome Cannon</div>
                <div className="skin-rarity">Covert</div>
              </div>
            </div>
          </div>
        </div>
        <div className="inventory-category">
          <h2>PISTOLS</h2>
          <div className="skin-list">
            <div className="skin-item">
              <div className="skin-icon">🔫</div>
              <div className="skin-details">
                <div className="skin-name">USP-S | Printstream</div>
                <div className="skin-rarity">Covert</div>
              </div>
            </div>
            <div className="skin-item">
              <div className="skin-icon">🔫</div>
              <div className="skin-details">
                <div className="skin-name">Glock-18 | Block-18</div>
                <div className="skin-rarity">Restricted</div>
              </div>
            </div>
          </div>
        </div>
        <div className="inventory-category">
          <h2>KNIVES</h2>
          <div className="skin-list">
            <div className="skin-item">
              <div className="skin-icon">🔪</div>
              <div className="skin-details">
                <div className="skin-name">Kukri Knife | Fade</div>
                <div className="skin-rarity">Extraordinary</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLoadoutTab = () => (
    <div className="tab-container loadout-container">
      <h1 className="tab-title">LOADOUT</h1>
      <div className="loadout-grid">
        <div className="loadout-slot primary">
          <div className="slot-header">
            <span className="slot-number">1</span>
            <span className="slot-label">PRIMARY</span>
          </div>
          <div className="slot-content">
            <div className="weapon-icon">🔫</div>
            <div className="weapon-info">
              <div className="weapon-name">AK-47</div>
              <div className="weapon-skin">Inheritance</div>
            </div>
          </div>
        </div>
        <div className="loadout-slot secondary">
          <div className="slot-header">
            <span className="slot-number">2</span>
            <span className="slot-label">SECONDARY</span>
          </div>
          <div className="slot-content">
            <div className="weapon-icon">🔫</div>
            <div className="weapon-info">
              <div className="weapon-name">USP-S</div>
              <div className="weapon-skin">Printstream</div>
            </div>
          </div>
        </div>
        <div className="loadout-slot knife">
          <div className="slot-header">
            <span className="slot-number">3</span>
            <span className="slot-label">KNIFE</span>
          </div>
          <div className="slot-content">
            <div className="weapon-icon">🔪</div>
            <div className="weapon-info">
              <div className="weapon-name">Kukri Knife</div>
              <div className="weapon-skin">Fade</div>
            </div>
          </div>
        </div>
        <div className="loadout-slot grenades">
          <div className="slot-header">
            <span className="slot-number">4-6</span>
            <span className="slot-label">GRENADES</span>
          </div>
          <div className="grenade-list">
            <span className="grenade-item">💣 HE</span>
            <span className="grenade-item">✨ Flash</span>
            <span className="grenade-item">💨 Smoke</span>
          </div>
        </div>
        <div className="loadout-slot equipment">
          <div className="slot-header">
            <span className="slot-number">7</span>
            <span className="slot-label">EQUIPMENT</span>
          </div>
          <div className="equipment-list">
            <span className="equipment-item">🛡️ Kevlar</span>
            <span className="equipment-item">⛑️ Helmet</span>
            <span className="equipment-item">🔧 Defuse Kit</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="tab-container settings-container">
      <h1 className="tab-title">SETTINGS</h1>
      <div className="settings-tabs">
        <button className="settings-tab active">GAMEPLAY</button>
        <button className="settings-tab">AUDIO</button>
        <button className="settings-tab">VIDEO</button>
        <button className="settings-tab">CROSSHAIR</button>
        <button className="settings-tab">KEYBINDS</button>
      </div>
      <div className="settings-content">
        <div className="settings-group">
          <h3>GAMEPLAY</h3>
          <div className="setting-row">
            <span>Mouse Sensitivity</span>
            <input type="range" min="0.5" max="3" step="0.1" defaultValue="1" />
            <span className="setting-value">1.0</span>
          </div>
          <div className="setting-row">
            <span>Invert Mouse</span>
            <label className="toggle-switch">
              <input type="checkbox" />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="setting-row">
            <span>Show FPS</span>
            <label className="toggle-switch">
              <input type="checkbox" />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
        <div className="settings-group">
          <h3>CROSSHAIR</h3>
          <div className="setting-row">
            <span>Color</span>
            <input type="color" defaultValue="#00FF00" />
          </div>
          <div className="setting-row">
            <span>Size</span>
            <input type="range" min="0.5" max="2" step="0.1" defaultValue="1" />
          </div>
          <div className="setting-row">
            <span>Style</span>
            <select defaultValue="default">
              <option value="default">Default</option>
              <option value="dot">Dot</option>
              <option value="cross">Cross</option>
              <option value="circle">Circle</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfileTab = () => (
    <div className="tab-container profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-placeholder">👤</div>
        </div>
        <div className="profile-info">
          <h1>PLAYER_123</h1>
          <div className="profile-rank">
            <span className="rank-badge">GOLD NOVA II</span>
            <span className="rank-xp">XP: 12,450 / 15,000</span>
          </div>
        </div>
      </div>
      
      <div className="profile-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-details">
            <span className="stat-label">Kills</span>
            <span className="stat-number">1,234</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💀</div>
          <div className="stat-details">
            <span className="stat-label">Deaths</span>
            <span className="stat-number">567</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-details">
            <span className="stat-label">K/D</span>
            <span className="stat-number">2.18</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-details">
            <span className="stat-label">Matches</span>
            <span className="stat-number">89</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎮</div>
          <div className="stat-details">
            <span className="stat-label">Wins</span>
            <span className="stat-number">52</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-details">
            <span className="stat-label">Playtime</span>
            <span className="stat-number">127h</span>
          </div>
        </div>
      </div>

      <div className="profile-achievements">
        <h2>ACHIEVEMENTS</h2>
        <div className="achievement-grid">
          <div className="achievement">
            <div className="achievement-icon">🏅</div>
            <div className="achievement-name">First Blood</div>
          </div>
          <div className="achievement">
            <div className="achievement-icon">💣</div>
            <div className="achievement-name">Bomb Expert</div>
          </div>
          <div className="achievement">
            <div className="achievement-icon">🔪</div>
            <div className="achievement-name">Knife Fighter</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="cs2-menu">
      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="nav-left">
          <div className="logo">CS2D</div>
          <div className="nav-links">
            <button 
              className={`nav-link ${activeTab === 'play' ? 'active' : ''}`}
              onClick={() => setActiveTab('play')}
            >
              PLAY
            </button>
            <button 
              className={`nav-link ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              INVENTORY
            </button>
            <button 
              className={`nav-link ${activeTab === 'loadout' ? 'active' : ''}`}
              onClick={() => setActiveTab('loadout')}
            >
              LOADOUT
            </button>
            <button 
              className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              PROFILE
            </button>
            <button 
              className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              SETTINGS
            </button>
          </div>
        </div>
        <div className="nav-right">
          <div className="user-info">
            <span className="user-name">PLAYER_123</span>
            <span className="user-level">LVL 42</span>
            <span className="user-money">💰 99,999</span>
          </div>
          <button className="avatar-btn">
            <div className="avatar-small">👤</div>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'play' && renderPlayTab()}
        {activeTab === 'inventory' && renderInventoryTab()}
        {activeTab === 'loadout' && renderLoadoutTab()}
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </main>

      <style jsx>{`
        .cs2-menu {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #0A0F1F 0%, #1A1F2F 100%);
          color: #FFFFFF;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* Top Navigation */
        .top-nav {
          height: 70px;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(10px);
          border-bottom: 2px solid #3B82F6;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 30px;
          z-index: 100;
        }

        .nav-left {
          display: flex;
          align-items: center;
          gap: 40px;
        }

        .logo {
          font-size: 24px;
          font-weight: 800;
          background: linear-gradient(135deg, #3B82F6, #9333EA);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: 1px;
        }

        .nav-links {
          display: flex;
          gap: 5px;
        }

        .nav-link {
          background: transparent;
          border: none;
          color: #8B9BB5;
          font-size: 15px;
          font-weight: 600;
          padding: 8px 20px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .nav-link:hover {
          color: #FFFFFF;
          background: rgba(59, 130, 246, 0.15);
        }

        .nav-link.active {
          color: #3B82F6;
          background: rgba(59, 130, 246, 0.2);
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 15px;
          background: rgba(0, 0, 0, 0.3);
          padding: 8px 16px;
          border-radius: 30px;
        }

        .user-name {
          color: #3B82F6;
          font-weight: 600;
        }

        .user-level {
          background: #FBBF24;
          color: #000000;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
        }

        .user-money {
          color: #FBBF24;
          font-weight: 600;
        }

        .avatar-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #2A3A5A;
          border: 2px solid #3B82F6;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-small {
          font-size: 20px;
        }

        /* Main Content */
        .main-content {
          flex: 1;
          overflow-y: auto;
          padding: 30px;
        }

        /* Play Tab */
        .play-container {
          display: grid;
          grid-template-columns: 200px 1fr 280px;
          gap: 25px;
          height: 100%;
        }

        /* Mode Sidebar */
        .mode-sidebar {
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(5px);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .mode-main-btn {
          background: transparent;
          border: none;
          color: #8B9BB5;
          padding: 15px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s;
          width: 100%;
        }

        .mode-main-btn:hover {
          background: rgba(59, 130, 246, 0.15);
          color: #FFFFFF;
        }

        .mode-main-btn.active {
          background: #3B82F6;
          color: #FFFFFF;
        }

        .mode-icon {
          font-size: 20px;
        }

        .mode-label {
          font-size: 14px;
          font-weight: 600;
        }

        .mode-sidebar-footer {
          margin-top: auto;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Play Main */
        .play-main {
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(5px);
          border-radius: 12px;
          padding: 25px;
          border: 1px solid rgba(59, 130, 246, 0.2);
          overflow-y: auto;
        }

        .mode-header {
          margin-bottom: 30px;
        }

        .mode-title {
          font-size: 28px;
          font-weight: 700;
          color: #3B82F6;
          margin-bottom: 5px;
        }

        .mode-description {
          color: #8B9BB5;
          font-size: 14px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #8B9BB5;
          margin-bottom: 15px;
          letter-spacing: 0.5px;
        }

        /* Map Grid */
        .map-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }

        .map-card {
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid transparent;
          border-radius: 8px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .map-card:hover {
          background: rgba(59, 130, 246, 0.15);
        }

        .map-card.selected {
          border-color: #3B82F6;
          background: rgba(59, 130, 246, 0.1);
        }

        .map-thumbnail {
          height: 80px;
          background: linear-gradient(45deg, #2A3A5A, #1A2A3A);
          border-radius: 6px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
          color: #3B82F6;
        }

        .map-name {
          font-size: 14px;
          font-weight: 600;
          text-align: center;
        }

        /* Team Section */
        .team-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 30px;
        }

        .team-card {
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid transparent;
          border-radius: 10px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .team-card.ct:hover {
          background: rgba(59, 130, 246, 0.15);
        }

        .team-card.ct.selected {
          border-color: #3B82F6;
          background: rgba(59, 130, 246, 0.1);
        }

        .team-card.t:hover {
          background: rgba(249, 115, 22, 0.15);
        }

        .team-card.t.selected {
          border-color: #F97316;
          background: rgba(249, 115, 22, 0.1);
        }

        .team-emblems {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }

        .team-emblem {
          font-size: 24px;
        }

        .team-emblem-large {
          font-size: 32px;
          font-weight: 800;
        }

        .team-info {
          flex: 1;
        }

        .team-name {
          font-weight: 700;
          margin-bottom: 5px;
        }

        .team-desc {
          font-size: 12px;
          color: #8B9BB5;
        }

        /* Game Info Bar */
        .game-info-bar {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .game-stats {
          display: flex;
          gap: 30px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 12px;
          color: #8B9BB5;
        }

        .stat-value {
          font-size: 18px;
          font-weight: 700;
        }

        .team-text {
          color: #3B82F6;
        }

        .play-big-btn {
          background: #3B82F6;
          border: none;
          color: white;
          font-size: 20px;
          font-weight: 700;
          padding: 15px 40px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .play-big-btn:hover {
          background: #2563EB;
          transform: scale(1.05);
        }

        /* Sprite Panel */
        .sprite-panel {
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(5px);
          border-radius: 12px;
          border: 1px solid rgba(59, 130, 246, 0.2);
          position: relative;
          overflow: hidden;
        }

        .floating-sprite {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.1s ease-out;
        }

        .sprite-character {
          text-align: center;
        }

        .sprite-image {
          width: 200px;
          height: 200px;
          background: linear-gradient(135deg, #2A3A5A, #1A2A3A);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          border: 3px solid #3B82F6;
          box-shadow: 0 20px 40px rgba(59, 130, 246, 0.3);
        }

        .sprite-placeholder {
          font-size: 100px;
          animation: float 3s ease-in-out infinite;
        }

        .sprite-emoji {
          filter: drop-shadow(0 10px 10px rgba(0, 0, 0, 0.3));
        }

        .sprite-name {
          font-size: 18px;
          font-weight: 600;
          color: #3B82F6;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }

        /* Tab Containers */
        .tab-container {
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(5px);
          border-radius: 12px;
          padding: 30px;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .tab-title {
          font-size: 32px;
          font-weight: 700;
          color: #3B82F6;
          margin-bottom: 30px;
        }

        /* Inventory */
        .inventory-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 25px;
        }

        .inventory-category h2 {
          color: #8B9BB5;
          font-size: 16px;
          margin-bottom: 15px;
        }

        .skin-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .skin-item {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          padding: 15px;
          display: flex;
          align-items: center;
          gap: 15px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .skin-item:hover {
          background: rgba(59, 130, 246, 0.15);
        }

        .skin-icon {
          font-size: 24px;
        }

        .skin-details {
          flex: 1;
        }

        .skin-name {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .skin-rarity {
          font-size: 12px;
          color: #FBBF24;
        }

        /* Loadout */
        .loadout-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .loadout-slot {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          padding: 20px;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .slot-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .slot-number {
          background: #3B82F6;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
        }

        .slot-label {
          color: #8B9BB5;
          font-weight: 600;
        }

        .slot-content {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .weapon-icon {
          font-size: 32px;
        }

        .weapon-name {
          font-weight: 700;
        }

        .weapon-skin {
          font-size: 12px;
          color: #FBBF24;
        }

        .grenade-list, .equipment-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .grenade-item, .equipment-item {
          background: rgba(255, 255, 255, 0.05);
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 12px;
        }

        /* Settings */
        .settings-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 15px;
        }

        .settings-tab {
          background: transparent;
          border: none;
          color: #8B9BB5;
          padding: 8px 20px;
          cursor: pointer;
          border-radius: 20px;
          font-size: 14px;
        }

        .settings-tab.active {
          background: #3B82F6;
          color: white;
        }

        .settings-group {
          margin-bottom: 30px;
        }

        .settings-group h3 {
          color: #8B9BB5;
          margin-bottom: 15px;
        }

        .setting-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .setting-row input[type="range"] {
          width: 200px;
        }

        .setting-row select {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid #3B82F6;
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
        }

        .setting-value {
          min-width: 40px;
          text-align: right;
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 24px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #2A3A5A;
          transition: .3s;
          border-radius: 24px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .3s;
          border-radius: 50%;
        }

        input:checked + .toggle-slider {
          background-color: #3B82F6;
        }

        input:checked + .toggle-slider:before {
          transform: translateX(26px);
        }

        /* Profile */
        .profile-header {
          display: flex;
          gap: 30px;
          margin-bottom: 40px;
        }

        .profile-avatar {
          width: 120px;
          height: 120px;
          background: linear-gradient(135deg, #3B82F6, #9333EA);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid #FBBF24;
        }

        .avatar-placeholder {
          font-size: 60px;
        }

        .profile-info h1 {
          font-size: 36px;
          margin-bottom: 10px;
        }

        .profile-rank {
          display: flex;
          gap: 20px;
          align-items: center;
        }

        .rank-badge {
          background: #FBBF24;
          color: #000;
          padding: 5px 15px;
          border-radius: 20px;
          font-weight: bold;
        }

        .rank-xp {
          color: #8B9BB5;
        }

        .profile-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .stat-icon {
          font-size: 32px;
        }

        .stat-details {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          color: #8B9BB5;
          font-size: 12px;
        }

        .stat-number {
          font-size: 24px;
          font-weight: 700;
        }

        .profile-achievements h2 {
          color: #8B9BB5;
          margin-bottom: 20px;
        }

        .achievement-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }

        .achievement {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }

        .achievement-icon {
          font-size: 32px;
          margin-bottom: 10px;
        }

        .achievement-name {
          font-size: 14px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default CS2Menu;
