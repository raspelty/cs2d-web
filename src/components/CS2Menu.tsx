import React, { useState } from 'react';
import { GAME_MODES, MAPS_BY_MODE } from '@/game/gameModes';
import { GameMode } from '@/game/types';

interface CS2MenuProps {
  onStartGame: (mode: GameMode, map: string, team: 'ct' | 't') => void;
  onOpenInventory: () => void;
  onOpenLoadout: () => void;
  onOpenSettings: () => void;
}

const CS2Menu: React.FC<CS2MenuProps> = ({
  onStartGame,
  onOpenInventory,
  onOpenLoadout,
  onOpenSettings,
}) => {
  const [selectedTab, setSelectedTab] = useState<'play' | 'inventory' | 'loadout' | 'settings'>('play');
  const [selectedMode, setSelectedMode] = useState<GameMode>(GAME_MODES[0]);
  const [selectedMap, setSelectedMap] = useState<string>(MAPS_BY_MODE[GAME_MODES[0].type][0]);
  const [selectedTeam, setSelectedTeam] = useState<'ct' | 't'>('ct');
  const [selectedSubTab, setSelectedSubTab] = useState<'casual' | 'competitive' | 'deathmatch' | 'wingman'>('casual');

  const renderPlayMenu = () => (
    <div className="play-menu">
      {/* Left panel - Mode selection */}
      <div className="mode-panel">
        <div className="mode-tabs">
          <button 
            className={selectedSubTab === 'casual' ? 'active' : ''}
            onClick={() => setSelectedSubTab('casual')}
          >
            CASUAL
          </button>
          <button 
            className={selectedSubTab === 'competitive' ? 'active' : ''}
            onClick={() => setSelectedSubTab('competitive')}
          >
            COMPETITIVE
          </button>
          <button 
            className={selectedSubTab === 'deathmatch' ? 'active' : ''}
            onClick={() => setSelectedSubTab('deathmatch')}
          >
            DEATHMATCH
          </button>
          <button 
            className={selectedSubTab === 'wingman' ? 'active' : ''}
            onClick={() => setSelectedSubTab('wingman')}
          >
            WINGMAN
          </button>
        </div>

        <div className="mode-list">
          {GAME_MODES.filter(m => {
            if (selectedSubTab === 'casual') return m.type === 'casual' || m.type === 'hostage';
            if (selectedSubTab === 'competitive') return m.type === 'competitive';
            if (selectedSubTab === 'deathmatch') return m.type === 'deathmatch' || m.type === 'armsrace' || m.type === 'demolition';
            if (selectedSubTab === 'wingman') return m.type === 'competitive'; // Wingman is 2v2
            return false;
          }).map(mode => (
            <button
              key={mode.name}
              className={`mode-item ${selectedMode.name === mode.name ? 'selected' : ''}`}
              onClick={() => {
                setSelectedMode(mode);
                setSelectedMap(MAPS_BY_MODE[mode.type][0]);
              }}
            >
              <div className="mode-name">{mode.name}</div>
              <div className="mode-desc">{mode.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Center panel - Map preview */}
      <div className="map-panel">
        <div className="map-preview">
          <img src={`/maps/${selectedMap.toLowerCase().replace(' ', '_')}.jpg`} alt={selectedMap} />
          <div className="map-name">{selectedMap}</div>
        </div>
        
        <div className="map-list">
          {MAPS_BY_MODE[selectedMode.type].map(map => (
            <button
              key={map}
              className={`map-item ${selectedMap === map ? 'selected' : ''}`}
              onClick={() => setSelectedMap(map)}
            >
              {map}
            </button>
          ))}
        </div>
      </div>

      {/* Right panel - Team selection and start */}
      <div className="team-panel">
        <div className="team-select">
          <h3>CHOOSE TEAM</h3>
          <button
            className={`team-btn ct ${selectedTeam === 'ct' ? 'selected' : ''}`}
            onClick={() => setSelectedTeam('ct')}
          >
            <div className="team-icon">🔵</div>
            <div className="team-name">COUNTER-TERRORIST</div>
          </button>
          <button
            className={`team-btn t ${selectedTeam === 't' ? 'selected' : ''}`}
            onClick={() => setSelectedTeam('t')}
          >
            <div className="team-icon">🔴</div>
            <div className="team-name">TERRORIST</div>
          </button>
        </div>

        <div className="mode-info">
          <div className="info-row">
            <span>Mode:</span>
            <span>{selectedMode.name}</span>
          </div>
          <div className="info-row">
            <span>Map:</span>
            <span>{selectedMap}</span>
          </div>
          <div className="info-row">
            <span>Team:</span>
            <span>{selectedTeam === 'ct' ? 'Counter-Terrorist' : 'Terrorist'}</span>
          </div>
          <div className="info-row">
            <span>Max Score:</span>
            <span>{selectedMode.maxScore || selectedMode.maxRounds || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span>Respawn:</span>
            <span>{selectedMode.respawn ? 'Yes' : 'No'}</span>
          </div>
        </div>

        <button
          className="start-btn"
          onClick={() => onStartGame(selectedMode, selectedMap, selectedTeam)}
        >
          PLAY
        </button>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="inventory-menu">
      <h2>INVENTORY</h2>
      <div className="skin-grid">
        {/* Skin items would go here */}
        <div className="skin-item">AK-47 | Inheritance</div>
        <div className="skin-item">AWP | Chrome Cannon</div>
        <div className="skin-item">USP-S | Printstream</div>
        <div className="skin-item">M4A4 | Temukau</div>
      </div>
    </div>
  );

  const renderLoadout = () => (
    <div className="loadout-menu">
      <h2>LOADOUT</h2>
      <div className="loadout-slots">
        <div className="loadout-slot">
          <h3>RIFLE</h3>
          <div className="slot-content">AK-47 | Inheritance</div>
        </div>
        <div className="loadout-slot">
          <h3>PISTOL</h3>
          <div className="slot-content">USP-S | Printstream</div>
        </div>
        <div className="loadout-slot">
          <h3>GRENADES</h3>
          <div className="slot-content">HE, Flash, Smoke</div>
        </div>
        <div className="loadout-slot">
          <h3>EQUIPMENT</h3>
          <div className="slot-content">Kevlar + Helmet</div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="settings-menu">
      <h2>SETTINGS</h2>
      <div className="settings-tabs">
        <button className="active">GAMEPLAY</button>
        <button>AUDIO</button>
        <button>VIDEO</button>
        <button>CROSSHAIR</button>
        <button>KEY BINDINGS</button>
      </div>
      <div className="settings-content">
        {/* Settings content would go here */}
      </div>
    </div>
  );

  return (
    <div className="cs2-menu">
      {/* Top navigation bar */}
      <div className="menu-top-bar">
        <div className="menu-left">
          <button 
            className={selectedTab === 'play' ? 'active' : ''}
            onClick={() => setSelectedTab('play')}
          >
            PLAY
          </button>
          <button 
            className={selectedTab === 'inventory' ? 'active' : ''}
            onClick={() => setSelectedTab('inventory')}
          >
            INVENTORY
          </button>
          <button 
            className={selectedTab === 'loadout' ? 'active' : ''}
            onClick={() => setSelectedTab('loadout')}
          >
            LOADOUT
          </button>
          <button 
            className={selectedTab === 'settings' ? 'active' : ''}
            onClick={() => setSelectedTab('settings')}
          >
            SETTINGS
          </button>
        </div>
        <div className="menu-right">
          <span className="player-name">PLAYER</span>
          <span className="player-level">🔹 LVL 42</span>
          <span className="player-money">💰 $99999</span>
        </div>
      </div>

      {/* Main content area */}
      <div className="menu-content">
        {selectedTab === 'play' && renderPlayMenu()}
        {selectedTab === 'inventory' && renderInventory()}
        {selectedTab === 'loadout' && renderLoadout()}
        {selectedTab === 'settings' && renderSettings()}
      </div>

      <style>{`
        .cs2-menu {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
          color: #F8FAFC;
          font-family: 'monospace';
          display: flex;
          flex-direction: column;
        }

        .menu-top-bar {
          height: 64px;
          background: rgba(0, 0, 0, 0.6);
          border-bottom: 2px solid #3B82F6;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 32px;
        }

        .menu-left button {
          background: none;
          border: none;
          color: #94A3B8;
          font-size: 16px;
          font-weight: bold;
          margin-right: 24px;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .menu-left button:hover {
          color: #F8FAFC;
        }

        .menu-left button.active {
          color: #3B82F6;
          border-bottom: 2px solid #3B82F6;
        }

        .menu-right {
          display: flex;
          gap: 16px;
          color: #F8FAFC;
        }

        .player-name {
          color: #3B82F6;
          font-weight: bold;
        }

        .player-level {
          color: #FBBF24;
        }

        .player-money {
          color: #FBBF24;
        }

        .menu-content {
          flex: 1;
          padding: 32px;
          overflow-y: auto;
        }

        .play-menu {
          display: grid;
          grid-template-columns: 350px 1fr 300px;
          gap: 24px;
          height: 100%;
        }

        .mode-panel {
          background: rgba(0, 0, 0, 0.4);
          border-radius: 8px;
          overflow: hidden;
        }

        .mode-tabs {
          display: flex;
          background: rgba(0, 0, 0, 0.3);
          border-bottom: 1px solid #3B82F6;
        }

        .mode-tabs button {
          flex: 1;
          background: none;
          border: none;
          color: #94A3B8;
          padding: 12px;
          cursor: pointer;
          font-size: 14px;
        }

        .mode-tabs button.active {
          color: #F8FAFC;
          background: #3B82F6;
        }

        .mode-list {
          padding: 16px;
        }

        .mode-item {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: none;
          color: #F8FAFC;
          padding: 16px;
          margin-bottom: 8px;
          border-radius: 4px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
        }

        .mode-item:hover {
          background: rgba(59, 130, 246, 0.2);
        }

        .mode-item.selected {
          background: #3B82F6;
        }

        .mode-name {
          font-weight: bold;
          margin-bottom: 4px;
        }

        .mode-desc {
          font-size: 12px;
          color: #94A3B8;
        }

        .map-panel {
          background: rgba(0, 0, 0, 0.4);
          border-radius: 8px;
          padding: 16px;
        }

        .map-preview {
          position: relative;
          margin-bottom: 16px;
        }

        .map-preview img {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 4px;
        }

        .map-name {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.7);
          padding: 8px;
          font-weight: bold;
          color: #3B82F6;
        }

        .map-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .map-item {
          background: rgba(255, 255, 255, 0.05);
          border: none;
          color: #F8FAFC;
          padding: 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .map-item:hover {
          background: rgba(59, 130, 246, 0.2);
        }

        .map-item.selected {
          background: #3B82F6;
        }

        .team-panel {
          background: rgba(0, 0, 0, 0.4);
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
        }

        .team-select h3 {
          color: #94A3B8;
          margin-bottom: 16px;
        }

        .team-btn {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid transparent;
          color: #F8FAFC;
          padding: 16px;
          margin-bottom: 12px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .team-btn.ct.selected {
          border-color: #3B82F6;
          background: rgba(59, 130, 246, 0.2);
        }

        .team-btn.t.selected {
          border-color: #F97316;
          background: rgba(249, 115, 22, 0.2);
        }

        .team-icon {
          font-size: 24px;
        }

        .mode-info {
          margin: 24px 0;
          padding: 16px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          color: #94A3B8;
        }

        .start-btn {
          background: #3B82F6;
          border: none;
          color: white;
          padding: 16px;
          font-size: 18px;
          font-weight: bold;
          border-radius: 4px;
          cursor: pointer;
          margin-top: auto;
        }

        .start-btn:hover {
          background: #2563EB;
        }
      `}</style>
    </div>
  );
};

export default CS2Menu;
