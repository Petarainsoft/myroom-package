import React from 'react';
import { AvatarConfig, AvailableParts, Gender } from '../types/AvatarTypes';
import { getDefaultConfigForGender } from '../data/avatarPartsData';

interface AvatarControlsProps {
    avatarConfig: AvatarConfig;
    availableParts: AvailableParts;
    onGenderChange: (newGender: Gender) => void;
    onPartChange: (partType: string, fileName: string | null) => void;
    onColorChange: (partType: string, color: string) => void;
    onSaveAvatar: () => void;
    onLoadAvatar: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const AvatarControls: React.FC<AvatarControlsProps> = ({
    avatarConfig,
    availableParts,
    onGenderChange,
    onPartChange,
    onColorChange,
    onSaveAvatar,
    onLoadAvatar
}) => {
    const currentGenderData = availableParts[avatarConfig.gender];

    if (!avatarConfig || !currentGenderData) {
        // Attempt to use a fallback or show loading, though App.tsx should ensure valid avatarConfig
        const fallbackGender: Gender = 'male';
        const tempConfig = avatarConfig || getDefaultConfigForGender(fallbackGender);
        if (!availableParts[tempConfig.gender]) {
            return <div className="control-section">Error: Core avatar data unavailable.</div>;
        }
        // This state indicates a deeper issue if App.tsx isn't providing a valid config.
        return <div className="control-section">Loading configuration...</div>;
    }

    return (
        <div className="control-section">
            <div className="section-header">
                <h3>👥 Avatar</h3>
            </div>

            <div className="parts-grid">
                {/* Gender Control as first item */}
                <div className="control-group compact-control">
                    <div className="control-row">
                        <label htmlFor="gender-select">Gender:</label>
                        <select
                            id="gender-select"
                            value={avatarConfig.gender}
                            onChange={(e) => onGenderChange(e.target.value as Gender)}
                        >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>
                </div>

                {/* Render selectable parts */}
                {Object.entries(currentGenderData.selectableParts).map(([partType, items]) => {
                    const currentSelection = avatarConfig.parts[partType] || null;
                    const currentColor = avatarConfig.colors[partType] || currentGenderData.defaultColors[partType] || "#ffffff";

                    return (
                        <div key={partType} className="control-group">
                            <div className="control-row">
                                <label htmlFor={`${partType}-select`}>
                                    {partType.charAt(0).toUpperCase() + partType.slice(1)}:
                                </label>
                                <select
                                    id={`${partType}-select`}
                                    value={currentSelection || ""}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        onPartChange(partType, value === "" ? null : value);
                                    }}
                                >
                                    {items.map((item, index) => (
                                        <option key={index} value={item.fileName || ""}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {/* <div className="control-row">
                                <label htmlFor={`${partType}-color`}>Color:</label>
                                <input
                                    id={`${partType}-color`}
                                    type="color"
                                    value={currentColor}
                                    onChange={(e) => onColorChange(partType, e.target.value)}
                                />
                            </div> */}
                        </div>
                    );
                })}
            </div>

            {/* Save/Load Controls */}
            <div className="control-group">
                <button onClick={onSaveAvatar} className="save-button">
                    💾 Save Avatar
                </button>
                <div className="file-input-wrapper">
                    <input
                        type="file"
                        accept=".json"
                        onChange={onLoadAvatar}
                        id="load-avatar-input"
                        className="file-input"
                    />
                    <label htmlFor="load-avatar-input" className="load-button">
                        📁 Load Avatar
                    </label>
                </div>
            </div>
        </div>
    );
};

export default AvatarControls;