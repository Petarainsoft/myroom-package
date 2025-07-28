/**
 * Service để ghi log cấu hình scene hiện tại
 * Theo dõi và ghi lại các thay đổi về room, avatar và items
 */

import { PresetConfig } from '../types/PresetConfig';
import { AvatarConfig } from '../types/AvatarTypes';
import { LoadedItem } from '../types/LoadedItem';

interface Room {
  name: string;
  resourceId: string;
  path?: string;
}

interface SceneChangeEvent {
  type: 'room' | 'avatar' | 'items' | 'full_scene';
  timestamp: number;
  config: PresetConfig;
  changeDetails?: {
    previousValue?: any;
    newValue?: any;
    action?: string;
  };
}

class SceneConfigLogger {
  private static instance: SceneConfigLogger;
  private logHistory: SceneChangeEvent[] = [];
  private maxLogEntries = 50; // Giới hạn số lượng log entries

  private constructor() {}

  static getInstance(): SceneConfigLogger {
    if (!SceneConfigLogger.instance) {
      SceneConfigLogger.instance = new SceneConfigLogger();
    }
    return SceneConfigLogger.instance;
  }

  /**
   * Tạo cấu hình scene từ các thành phần hiện tại
   */
  private createSceneConfig(
    room: Room,
    avatarConfig: AvatarConfig,
    loadedItems: LoadedItem[]
  ): PresetConfig {
    // Build avatar parts object với path và resourceId
    const avatarParts: any = {};
    if (avatarConfig.parts) {
      ['body', 'hair', 'top', 'bottom', 'shoes', 'fullset', 'accessory'].forEach(partKey => {
        const part = avatarConfig.parts[partKey];
        if (part && part !== null) {
          if (typeof part === 'string') {
            avatarParts[partKey] = {
              path: part.startsWith('/models/') ? part : '',
              resourceId: !part.startsWith('/models/') ? part : ''
            };
          } else if (typeof part === 'object') {
            avatarParts[partKey] = {
              path: part.path || '',
              resourceId: part.resourceId || part.path || ''
            };
          }
        } else {
          avatarParts[partKey] = null;
        }
      });
    }

    // Build enhanced avatar config
    const enhancedAvatarConfig = {
      gender: avatarConfig.gender || 'male',
      parts: avatarParts,
      colors: avatarConfig.colors || {
        hair: '#4A301B',
        top: '#1E90FF'
      }
    };

    // Process items để đảm bảo có đầy đủ các field
    const enhancedItems = (loadedItems || []).map(item => ({
      id: item.id,
      name: item.name,
      path: item.path,
      resourceId: item.resourceId || item.path || '',
      position: item.position,
      rotation: item.rotation,
      scale: item.scale
    }));

    return {
      version: '1.0',
      timestamp: Date.now(),
      room: {
        name: room.name || 'Current Room',
        path: room.path || '/models/rooms/cate001/MR_KHROOM_0001.glb',
        resourceId: room.resourceId || room.path || 'relax-mr_khroom_0001'
      },
      avatar: enhancedAvatarConfig,
      items: enhancedItems,
      usage: {
        description: 'Scene configuration logged automatically on changes',
        when_using_backend: 'ResourceIds are automatically used by loaders when backend is configured',
        when_using_local: 'Path properties are used as fallback for local asset loading'
      }
    };
  }

  /**
   * Log thay đổi room
   */
  logRoomChange(
    previousRoom: Room | null,
    newRoom: Room,
    avatarConfig: AvatarConfig,
    loadedItems: LoadedItem[]
  ): void {
    const config = this.createSceneConfig(newRoom, avatarConfig, loadedItems);
    
    const logEvent: SceneChangeEvent = {
      type: 'room',
      timestamp: Date.now(),
      config,
      changeDetails: {
        previousValue: previousRoom,
        newValue: newRoom,
        action: 'room_changed'
      }
    };

    this.addLogEntry(logEvent);
    
    console.group('🏠 [SceneConfigLogger] Room Changed');
    console.log('📅 Timestamp:', new Date(logEvent.timestamp).toLocaleString());
    console.log('🔄 Previous Room:', previousRoom);
    console.log('🆕 New Room:', newRoom);
    console.log('📋 Full Scene Config:', config);
    console.groupEnd();
  }

  /**
   * Log thay đổi avatar
   */
  logAvatarChange(
    previousAvatar: AvatarConfig | null,
    newAvatar: AvatarConfig,
    room: Room,
    loadedItems: LoadedItem[]
  ): void {
    const config = this.createSceneConfig(room, newAvatar, loadedItems);
    
    const logEvent: SceneChangeEvent = {
      type: 'avatar',
      timestamp: Date.now(),
      config,
      changeDetails: {
        previousValue: previousAvatar,
        newValue: newAvatar,
        action: 'avatar_changed'
      }
    };

    this.addLogEntry(logEvent);
    
    console.group('👤 [SceneConfigLogger] Avatar Changed');
    console.log('📅 Timestamp:', new Date(logEvent.timestamp).toLocaleString());
    console.log('🔄 Previous Avatar:', previousAvatar);
    console.log('🆕 New Avatar:', newAvatar);
    console.log('📋 Full Scene Config:', config);
    console.groupEnd();
  }

  /**
   * Log thay đổi items
   */
  logItemsChange(
    previousItems: LoadedItem[],
    newItems: LoadedItem[],
    room: Room,
    avatarConfig: AvatarConfig,
    action: string = 'items_changed'
  ): void {
    const config = this.createSceneConfig(room, avatarConfig, newItems);
    
    const logEvent: SceneChangeEvent = {
      type: 'items',
      timestamp: Date.now(),
      config,
      changeDetails: {
        previousValue: previousItems,
        newValue: newItems,
        action
      }
    };

    this.addLogEntry(logEvent);
    
    console.group('📦 [SceneConfigLogger] Items Changed');
    console.log('📅 Timestamp:', new Date(logEvent.timestamp).toLocaleString());
    console.log('🔄 Previous Items Count:', previousItems.length);
    console.log('🆕 New Items Count:', newItems.length);
    console.log('⚡ Action:', action);
    console.log('📋 Full Scene Config:', config);
    console.groupEnd();
  }

  /**
   * Log toàn bộ scene config (khi load preset hoặc khởi tạo)
   */
  logFullSceneConfig(
    room: Room,
    avatarConfig: AvatarConfig,
    loadedItems: LoadedItem[],
    action: string = 'scene_loaded'
  ): void {
    const config = this.createSceneConfig(room, avatarConfig, loadedItems);
    
    const logEvent: SceneChangeEvent = {
      type: 'full_scene',
      timestamp: Date.now(),
      config,
      changeDetails: {
        action
      }
    };

    this.addLogEntry(logEvent);
    
    console.group('🎬 [SceneConfigLogger] Full Scene Config');
    console.log('📅 Timestamp:', new Date(logEvent.timestamp).toLocaleString());
    console.log('⚡ Action:', action);
    console.log('🏠 Room:', room);
    console.log('👤 Avatar:', avatarConfig);
    console.log('📦 Items Count:', loadedItems.length);
    console.log('📋 Full Scene Config:', config);
    console.groupEnd();
  }

  /**
   * Thêm log entry và quản lý giới hạn
   */
  private addLogEntry(logEvent: SceneChangeEvent): void {
    this.logHistory.push(logEvent);
    
    // Giới hạn số lượng log entries
    if (this.logHistory.length > this.maxLogEntries) {
      this.logHistory = this.logHistory.slice(-this.maxLogEntries);
    }
  }

  /**
   * Lấy lịch sử log
   */
  getLogHistory(): SceneChangeEvent[] {
    return [...this.logHistory];
  }

  /**
   * Xóa lịch sử log
   */
  clearLogHistory(): void {
    this.logHistory = [];
    console.log('🗑️ [SceneConfigLogger] Log history cleared');
  }

  /**
   * Lấy config hiện tại mà không log
   */
  getCurrentConfig(
    room: Room,
    avatarConfig: AvatarConfig,
    loadedItems: LoadedItem[]
  ): PresetConfig {
    return this.createSceneConfig(room, avatarConfig, loadedItems);
  }
}

export const sceneConfigLogger = SceneConfigLogger.getInstance();
export type { SceneChangeEvent, Room };