# Spec 01: Icon System

**Status:** Draft
**Priority:** P0 (Core)
**Dependencies:** None

---

## 1. Overview

### 1.1 Description

The Icon System manages the loading, caching, and detection of SVG icons used to replace Mermaid's default node shapes. It provides a unified interface for:

1. **Registry** - Centralized icon metadata (file paths, colors, detection keywords)
2. **Loader** - Async SVG fetching with caching
3. **Detector** - Priority-based keyword matching to determine icon type from node data

### 1.2 Goals

- Load icons on-demand with minimal network requests
- Cache loaded icons in memory for reuse
- Provide fast, accurate icon type detection
- Support easy addition of new icons

### 1.3 Non-Goals

- Icon editing/customization UI
- Dynamic icon generation
- Icon sprite sheets (individual files preferred for maintainability)

---

## 2. Files Involved

| File | Purpose |
|------|---------|
| `js/config/icons.registry.js` | Icon metadata definitions |
| `js/core/IconLoader.js` | Async loading and caching |
| `js/core/IconDetector.js` | Keyword-based type detection |
| `assets/icons/*.svg` | SVG icon files |

---

## 3. Data Structures

### 3.1 Icon Registry Schema

```javascript
// js/config/icons.registry.js

export const ICON_REGISTRY = {
  kali: {
    file: 'kali.svg',
    color: '#2B79C2',
    category: 'os',
    priority: 'high',
    keywords: ['kali', 'kali linux'],
  },

  windows: {
    file: 'windows.svg',
    color: '#00ADEF',
    category: 'os',
    priority: 'high',
    keywords: ['windows', 'win10', 'win11', 'win 10', 'win 11'],
  },

  winserver: {
    file: 'winserver.svg',
    color: '#00ADEF',
    category: 'os',
    priority: 'high',
    keywords: ['windows server', 'winserver', 'win srv', 'windows 2019', 'windows 2016', 'windows 2022'],
  },

  linux: {
    file: 'linux.svg',
    color: '#FCC624',
    category: 'os',
    priority: 'high',
    keywords: ['linux', 'ubuntu', 'debian', 'centos', 'redhat', 'fedora'],
  },

  dc: {
    file: 'dc.svg',
    color: '#00A4EF',
    category: 'infrastructure',
    priority: 'high',
    keywords: ['domain controller', 'domaincontroller', 'active directory', ' dc ', '_dc'],
  },

  attacker: {
    file: 'attacker.svg',
    color: '#EF4444',
    category: 'actor',
    priority: 'medium',
    keywords: ['attacker', 'threat actor', 'adversary', 'hacker', 'apt', 'threat'],
  },

  victim: {
    file: 'victim.svg',
    color: '#4D6FBB',
    category: 'actor',
    priority: 'medium',
    keywords: ['victim', 'target', 'employee', 'client', 'end user'],
  },

  server: {
    file: 'server.svg',
    color: '#3B82F6',
    category: 'infrastructure',
    priority: 'low',
    keywords: ['server', ' srv'],
  },

  db: {
    file: 'db.svg',
    color: '#EAB308',
    category: 'data',
    priority: 'medium',
    keywords: ['database', 'sql', 'mysql', 'postgres', 'oracle', 'mongodb', ' db'],
  },

  firewall: {
    file: 'firewall.svg',
    color: '#EF4444',
    category: 'security',
    priority: 'medium',
    keywords: ['firewall', 'waf', 'pfsense', 'fortinet'],
  },

  router: {
    file: 'router.svg',
    color: '#06B6D4',
    category: 'infrastructure',
    priority: 'medium',
    keywords: ['router', 'gateway', 'switch'],
  },

  c2: {
    file: 'c2.svg',
    color: '#A855F7',
    category: 'security',
    priority: 'medium',
    keywords: ['c2', 'c&c', 'command control', 'cobalt', 'beacon'],
  },

  cloud: {
    file: 'cloud.svg',
    color: '#06B6D4',
    category: 'infrastructure',
    priority: 'low',
    keywords: ['cloud', 'aws', 'azure', 'gcp'],
  },

  mail: {
    file: 'mail.svg',
    color: '#F97316',
    category: 'infrastructure',
    priority: 'medium',
    keywords: ['mail', 'email', 'exchange', 'smtp'],
  },

  web: {
    file: 'web.svg',
    color: '#22C55E',
    category: 'infrastructure',
    priority: 'medium',
    keywords: ['web server', 'apache', 'nginx', 'iis', 'http'],
  },

  vpn: {
    file: 'vpn.svg',
    color: '#8B5CF6',
    category: 'security',
    priority: 'medium',
    keywords: ['vpn'],
  },

  malware: {
    file: 'malware.svg',
    color: '#EF4444',
    category: 'security',
    priority: 'medium',
    keywords: ['malware', 'ransomware', 'trojan', 'virus', 'payload'],
  },

  creds: {
    file: 'creds.svg',
    color: '#EAB308',
    category: 'data',
    priority: 'medium',
    keywords: ['credentials', 'creds', 'password', 'secrets', 'hash'],
  },

  user: {
    file: 'user.svg',
    color: '#64748B',
    category: 'actor',
    priority: 'low',
    keywords: ['user', 'person', 'admin'],
  },

  workstation: {
    file: 'workstation.svg',
    color: '#8B5CF6',
    category: 'infrastructure',
    priority: 'low',
    keywords: ['workstation', 'desktop', 'pc'],
  },

  default: {
    file: 'default.svg',
    color: '#64748B',
    category: 'generic',
    priority: 'low',
    keywords: [],
  },
};

// Aliases (point to same icon)
export const ICON_ALIASES = {
  ad: 'dc',
  secrets: 'creds',
  database: 'db',
};
```

### 3.2 Icon Cache Structure

```javascript
// Internal cache in IconLoader.js

class IconCache {
  // Map<iconType, svgContent>
  #cache = new Map();

  // Map<iconType, Promise<svgContent>>
  #pending = new Map();

  has(type) { ... }
  get(type) { ... }
  set(type, content) { ... }
  getPending(type) { ... }
  setPending(type, promise) { ... }
}
```

---

## 4. Icon Loader

### 4.1 Class Definition

```javascript
// js/core/IconLoader.js

import { ICON_REGISTRY, ICON_ALIASES } from '../config/icons.registry.js';

export class IconLoader {
  #cache = new Map();
  #pending = new Map();
  #basePath = 'assets/icons/';

  /**
   * Load a single icon by type
   * @param {string} type - Icon type (e.g., 'kali', 'windows')
   * @returns {Promise<string>} SVG content
   */
  async load(type) {
    // Resolve alias
    const resolvedType = ICON_ALIASES[type] || type;

    // Check cache
    if (this.#cache.has(resolvedType)) {
      return this.#cache.get(resolvedType);
    }

    // Check if already loading
    if (this.#pending.has(resolvedType)) {
      return this.#pending.get(resolvedType);
    }

    // Start loading
    const promise = this.#fetchIcon(resolvedType);
    this.#pending.set(resolvedType, promise);

    try {
      const content = await promise;
      this.#cache.set(resolvedType, content);
      return content;
    } finally {
      this.#pending.delete(resolvedType);
    }
  }

  /**
   * Preload multiple icons in parallel
   * @param {string[]} types - Array of icon types
   * @returns {Promise<void>}
   */
  async preload(types) {
    const uniqueTypes = [...new Set(types)];
    await Promise.all(uniqueTypes.map(type => this.load(type)));
  }

  /**
   * Get icon metadata without loading
   * @param {string} type - Icon type
   * @returns {IconRegistryEntry}
   */
  getMetadata(type) {
    const resolvedType = ICON_ALIASES[type] || type;
    return ICON_REGISTRY[resolvedType] || ICON_REGISTRY.default;
  }

  /**
   * Check if icon is cached
   * @param {string} type - Icon type
   * @returns {boolean}
   */
  isCached(type) {
    const resolvedType = ICON_ALIASES[type] || type;
    return this.#cache.has(resolvedType);
  }

  /**
   * Clear cache (for memory management)
   */
  clearCache() {
    this.#cache.clear();
  }

  // Private methods

  async #fetchIcon(type) {
    const meta = ICON_REGISTRY[type] || ICON_REGISTRY.default;
    const url = this.#basePath + meta.file;

    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to load icon: ${type}, falling back to default`);
      if (type !== 'default') {
        return this.load('default');
      }
      throw new Error(`Failed to load default icon`);
    }

    return response.text();
  }
}

// Singleton instance
export const iconLoader = new IconLoader();
```

### 4.2 Usage Example

```javascript
import { iconLoader } from './core/IconLoader.js';

// Single icon
const svgContent = await iconLoader.load('kali');

// Preload multiple
await iconLoader.preload(['kali', 'windows', 'victim', 'server']);

// Get metadata (sync, no loading)
const meta = iconLoader.getMetadata('kali');
console.log(meta.color); // '#2B79C2'
```

---

## 5. Icon Detector

### 5.1 Detection Algorithm

```
Input: nodeId (string), labelText (string)
Output: iconType (string)

1. Normalize input
   - combined = (nodeId + " " + labelText).toLowerCase()

2. HIGH Priority - OS/Platform keywords
   - Check: kali, windows server, windows, domain controller, linux
   - These OVERRIDE any prefix matches
   - Return immediately on match

3. MEDIUM Priority - Node ID prefix
   - Extract prefix from nodeId: /^(\w+?)_/ or /flowchart-(\w+?)_/
   - If prefix exists in ICON_REGISTRY, return it

4. LOW Priority - Generic keywords
   - Iterate through all ICON_REGISTRY entries
   - Check each keyword against combined text
   - Return first match

5. Default
   - Return 'default'
```

### 5.2 Class Definition

```javascript
// js/core/IconDetector.js

import { ICON_REGISTRY, ICON_ALIASES } from '../config/icons.registry.js';

export class IconDetector {
  // Precomputed priority groups for fast matching
  #highPriority = [];
  #mediumPriority = [];
  #lowPriority = [];

  constructor() {
    this.#buildPriorityGroups();
  }

  /**
   * Detect icon type from node data
   * @param {string} nodeId - Node identifier
   * @param {string} labelText - Node label text
   * @returns {string} Icon type
   */
  detect(nodeId, labelText = '') {
    const combined = `${nodeId} ${labelText}`.toLowerCase();

    // 1. High priority (OS/platform)
    for (const entry of this.#highPriority) {
      for (const keyword of entry.keywords) {
        if (combined.includes(keyword)) {
          return entry.type;
        }
      }
    }

    // 2. Medium priority (node prefix)
    const prefixMatch = nodeId.match(/^(?:flowchart-)?(\w+?)_/);
    if (prefixMatch) {
      const prefix = prefixMatch[1].toLowerCase();
      const resolved = ICON_ALIASES[prefix] || prefix;
      if (ICON_REGISTRY[resolved]) {
        return resolved;
      }
    }

    // 3. Low priority (generic keywords)
    for (const entry of this.#lowPriority) {
      for (const keyword of entry.keywords) {
        if (combined.includes(keyword)) {
          return entry.type;
        }
      }
    }

    return 'default';
  }

  /**
   * Get all possible icon types for autocomplete/documentation
   * @returns {string[]}
   */
  getAllTypes() {
    return Object.keys(ICON_REGISTRY);
  }

  // Private methods

  #buildPriorityGroups() {
    for (const [type, meta] of Object.entries(ICON_REGISTRY)) {
      const entry = { type, keywords: meta.keywords };

      switch (meta.priority) {
        case 'high':
          this.#highPriority.push(entry);
          break;
        case 'medium':
          this.#mediumPriority.push(entry);
          break;
        case 'low':
          this.#lowPriority.push(entry);
          break;
      }
    }

    // Sort by keyword length (longer = more specific = check first)
    const sortByKeywordLength = (a, b) => {
      const maxA = Math.max(...a.keywords.map(k => k.length));
      const maxB = Math.max(...b.keywords.map(k => k.length));
      return maxB - maxA;
    };

    this.#highPriority.sort(sortByKeywordLength);
    this.#lowPriority.sort(sortByKeywordLength);
  }
}

// Singleton instance
export const iconDetector = new IconDetector();
```

### 5.3 Detection Examples

| nodeId | labelText | Detected Type | Reason |
|--------|-----------|---------------|--------|
| `victim_ws` | `Victim Workstation<br>Windows` | `windows` | "windows" keyword (high priority) |
| `kali_attacker` | `Attacker Machine` | `kali` | "kali" in nodeId (high priority) |
| `attacker_1` | `Threat Actor` | `attacker` | prefix `attacker_` (medium priority) |
| `server_db` | `Database Server` | `db` | "database" keyword (low priority) |
| `node1` | `Some Component` | `default` | No match |

---

## 6. SVG Icon Format

### 6.1 Standard Icon Template

All icons follow this structure:

```xml
<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Background rectangle with rounded corners -->
    <rect x="2" y="2" width="76" height="76" rx="12"
          fill="#18181b"
          stroke="{{PRIMARY_COLOR}}"
          stroke-width="2"/>

    <!-- Icon content goes here -->
    <!-- Use PRIMARY_COLOR for main elements -->
    <!-- Use #27272a for secondary/fill elements -->

</svg>
```

### 6.2 Design Guidelines

| Property | Value | Notes |
|----------|-------|-------|
| ViewBox | `0 0 80 80` | All icons same size |
| Background | `#18181b` | Dark theme base |
| Stroke Width (outer) | `2px` | Consistent border |
| Stroke Width (inner) | `1.5px` | Secondary elements |
| Corner Radius | `12px` | Rounded corners |
| Status Indicators | `#22c55e` (green) | For "active" states |

---

## 7. Error Handling

| Scenario | Handling |
|----------|----------|
| Icon file not found | Fall back to `default.svg`, log warning |
| Network error | Retry once, then fall back to default |
| Invalid SVG | Log error, use default |
| Unknown icon type | Return default metadata |

---

## 8. Performance Considerations

| Concern | Mitigation |
|---------|------------|
| Multiple loads of same icon | In-memory cache prevents duplicate fetches |
| Parallel requests for same icon | Pending promise deduplication |
| Large number of icons | Preload only needed icons based on parsed diagram |
| Memory usage | Optional `clearCache()` method |

---

## 9. Testing Checklist

- [ ] Load icon successfully
- [ ] Cache hit returns same content
- [ ] Parallel requests deduplicated
- [ ] Fallback to default on 404
- [ ] Alias resolution works
- [ ] High priority keywords override prefix
- [ ] Prefix detection works
- [ ] Low priority keywords match correctly
- [ ] Default returned when no match
