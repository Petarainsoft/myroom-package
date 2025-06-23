# Project Reorganization Plan

Plan to reorganize MyRoom project structure for better maintainability and scalability.

## Current Issues

1. **Mixed file types in root** - Config files, demos, and source code scattered
2. **Inconsistent naming** - Mix of kebab-case, camelCase, and PascalCase
3. **Poor separation** - Main app, embed app, and web component code intermingled
4. **Hard to navigate** - Difficult to find files or understand structure
5. **Scalability problems** - Adding new features becomes difficult

## Proposed Structure

```
ahn-room/
├── docs/                        # All documentation
│   ├── README.md
│   ├── EMBED_README.md
│   ├── WEB_COMPONENT_README.md
│   └── DOMAIN_CONFIG.md
├── demos/                       # Demo applications
│   ├── basic/index.html
│   ├── embed/embed-demo.html
│   └── webcomponent/webcomponent-demo.html
├── configs/                     # Build configurations
│   ├── vite.config.js
│   ├── vite.embed.config.js
│   ├── vite.webcomponent.config.js
│   ├── tsconfig.json
│   └── eslint.config.js
├── scripts/                     # Build scripts
│   ├── build.js
│   └── deploy.js
├── public/                      # Static assets
│   ├── models/
│   └── textures/
├── dist/                        # Built files
└── src/                         # Source code
    ├── apps/                    # Different applications
    │   ├── main/                # Main React app
    │   ├── embed/               # Embed app
    │   └── webcomponent/        # Web component
    └── shared/                  # Shared code
        ├── components/          # Reusable components
        │   ├── babylon/         # Babylon.js components
        │   ├── avatar/          # Avatar components
        │   ├── room/            # Room components
        │   └── items/           # Item components
        ├── hooks/               # Custom React hooks
        ├── types/               # TypeScript types
        ├── data/                # Static data
        ├── config/              # App configuration
        ├── utils/               # Utility functions
        └── styles/              # Global styles
```

### Source Code Organization
```
src/
├── apps/                    # Main applications
│   ├── main/               # Main React app
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── index.tsx
│   │   └── components/
│   ├── embed/              # Embed application
│   │   ├── EmbedApp.tsx
│   │   ├── index.tsx
│   │   └── components/
│   └── webcomponent/       # Web component
│       ├── MyRoomWebComponent.ts
│       └── index.ts
├── shared/                  # Shared code across apps
│   ├── components/         # Reusable UI components
│   │   ├── babylon/        # Babylon.js specific components
│   │   │   ├── BabylonScene.tsx
│   │   │   ├── IntegratedBabylonScene.tsx
│   │   │   └── InteractiveRoom.tsx
│   │   ├── avatar/         # Avatar related components
│   │   │   ├── AvatarControls.tsx
│   │   │   └── AvatarControls.css
│   │   ├── room/           # Room related components
│   │   │   └── RoomLoader.tsx
│   │   └── items/          # Item related components
│   │       ├── ItemLoader.tsx
│   │       └── ItemManipulator.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── index.ts
│   │   ├── usePostProcessing.tsx
│   │   └── useSkybox.tsx
│   ├── types/              # TypeScript type definitions
│   │   ├── index.ts
│   │   ├── AvatarTypes.ts
│   │   ├── ClonedAnimation.ts
│   │   └── LoadedItem.ts
│   ├── data/               # Static data and configurations
│   │   ├── avatarPartsData.ts
│   │   └── skeletonMapping.ts
│   ├── config/             # Application configuration
│   │   └── appConfig.ts
│   ├── utils/              # Utility functions
│   │   └── index.ts
│   └── styles/             # Global styles
│       ├── index.css
│       └── globals.css
└── assets/                  # Static assets used in code
    └── react.svg
```

## Migration Steps

### Phase 1: Root Level Reorganization
1. Create folders: `docs/`, `demos/`, `configs/`, `scripts/`
2. Move files to appropriate folders

### Phase 2: Source Code Reorganization
1. Create new folder structure in `src/`
2. Move files according to new structure
3. Update import paths
4. Standardize file extensions (.tsx for React components)

### Phase 3: Configuration Updates
1. Update Vite configurations for new entry points
2. Update package.json scripts
3. Update TypeScript configurations

### Phase 4: Testing
1. Test all applications and demos
2. Verify build processes
3. Update documentation

## Benefits

1. **Clear separation** - Apps, shared code, demos, docs properly separated
2. **Consistent naming** - kebab-case for folders, PascalCase for components
3. **Better scalability** - Easy to add new features or apps
4. **Improved maintainability** - Logical grouping of related files
5. **Professional structure** - Follows industry best practices

## Implementation Priority

1. **High**: Source code reorganization (Phase 2)
2. **Medium**: Root level cleanup (Phase 1)
3. **Low**: Configuration consolidation (Phase 3)