Writeup: Icon State Variants System

  1. The Need

  Problem Statement

  The LLM generates scenarios where entities have dual states — the same type of thing can be either legitimate or malicious depending on context. Currently, we use a single icon (e.g., IconProcess, IconCode) regardless of whether the entity is:
  - A legitimate process vs. an injected/backdoored process
  - Clean source code vs. malicious payload script
  - A valid token vs. a stolen/exfiltrated token

  This creates visual ambiguity — viewers can't distinguish at a glance between:
  - npm_registry (legitimate) and malware_process (malicious) when both use generic icons
  - aws_credentials (the target) and stolen_aws_creds (what attacker has)

  Solution

  Introduce state-variant icons with visual indicators:
  - Infected variants: Base icon + small malware bug overlay (already created for process and code)
  - Stolen variants: Base icon + visual indicator of compromise/theft

  This allows the LLM to semantically distinguish entity states, and viewers immediately understand what's clean vs. compromised.

  ---
  2. Current State Audit

  Already Created (Template Pattern)

  infected_code.svg      — code.svg + malware bug overlay at bottom-right
  infected_process.svg   — process.svg + malware bug overlay at bottom-right

  These establish the overlay pattern: original icon + scaled malware.svg inset at translate(35-40, 35-40) scale(0.40).

  Icons That Need NO Variants (Inherently Single-State)

  Always malicious:
  malware.svg, backdoor.svg, c2.svg, exploit.svg, inject.svg,
  attacker.svg, attacker1.svg, penetrationtool.svg

  Always neutral/infrastructure:
  server.svg, workstation.svg, machine.svg, cloud.svg, aws.svg, azure.svg,
  router.svg, firewall.svg, dc.svg, winserver.svg, edr.svg, alert.svg,
  user.svg, victim.svg

  ---
  3. SVGs To Create

  3.1 Infected Variants (6 new SVGs)

  Use the same pattern as infected_process.svg — base icon + malware bug overlay.
  New File: infected_terminal.svg
  Base Icon: terminal.svg
  Use Case: Attacker-controlled shell, reverse shell
  ────────────────────────────────────────
  New File: infected_service.svg
  Base Icon: service.svg
  Use Case: Backdoored service, malicious daemon
  ────────────────────────────────────────
  New File: infected_package.svg
  Base Icon: package.svg
  Use Case: Typosquatted/trojaned package
  ────────────────────────────────────────
  New File: infected_pipeline.svg
  Base Icon: pipeline.svg
  Use Case: Compromised CI/CD pipeline
  ────────────────────────────────────────
  New File: infected_docker.svg
  Base Icon: docker.svg
  Use Case: Malicious container image
  ────────────────────────────────────────
  New File: infected_scheduler.svg
  Base Icon: scheduler.svg
  Use Case: Malicious scheduled task/cron
  Note on infected_package.svg: This covers npm, pip, cargo, etc. We use package.svg as base (not npm.svg) because npm.svg is specifically for npm registry, while package represents the artifact.

  3.2 Stolen Variants (4 new SVGs)

  For credentials/secrets, the semantic is "stolen/exfiltrated" not "infected". Create a different visual pattern:
  - Option A: Base icon + small "export/out" arrow indicator
  - Option B: Base icon + red tint/border
  - Option C: Base icon + small skull/warning badge

  Recommendation: Use a small red diagonal arrow pointing out (↗) to indicate "exfiltrated" — this is visually distinct from the malware bug.
  New File: stolen_token.svg
  Base Icon: token.svg
  Use Case: Exfiltrated JWT, OAuth token, session token
  ────────────────────────────────────────
  New File: stolen_key.svg
  Base Icon: key.svg
  Use Case: Stolen SSH key, API key, private key
  ────────────────────────────────────────
  New File: stolen_credential.svg
  Base Icon: credential.svg
  Use Case: Harvested passwords, credentials
  ────────────────────────────────────────
  New File: stolen_certificate.svg
  Base Icon: certificate.svg
  Use Case: Stolen signing cert, TLS cert
  ---
  4. File Organization

  Current Structure (No Change Needed)

  public/assets/icons/
  ├── [base icons]           — process.svg, terminal.svg, etc.
  ├── infected_code.svg      — existing
  ├── infected_process.svg   — existing
  ├── [new infected_*.svg]   — to create
  └── [new stolen_*.svg]     — to create

  The flat structure is fine. No subfolder reorganization required.

  Naming Convention

  - infected_<base>.svg — for executable/runnable things that can be backdoored
  - stolen_<base>.svg — for secrets/credentials that can be exfiltrated

  ---
  5. Registry Updates (icons.registry.ts)

  Add New Entries

  // ═══════════════════════════════════════════════════════════════
  // INFECTED VARIANTS (Compromised Executables)
  // ═══════════════════════════════════════════════════════════════
  'IconInfectedCode': { file: 'infected_code.svg', color: '#EF4444', category: 'security', keywords: ['malicious', 'backdoor', 'trojan'] },
  'IconInfectedProcess': { file: 'infected_process.svg', color: '#EF4444', category: 'security', keywords: ['injected', 'compromised'] },
  'IconInfectedTerminal': { file: 'infected_terminal.svg', color: '#EF4444', category: 'security', keywords: ['reverse shell', 'attacker shell'] },
  'IconInfectedService': { file: 'infected_service.svg', color: '#EF4444', category: 'security', keywords: ['backdoor', 'persistent'] },
  'IconInfectedPackage': { file: 'infected_package.svg', color: '#EF4444', category: 'security', keywords: ['typosquat', 'supply chain', 'trojan'] },
  'IconInfectedPipeline': { file: 'infected_pipeline.svg', color: '#EF4444', category: 'security', keywords: ['compromised ci', 'poisoned build'] },
  'IconInfectedDocker': { file: 'infected_docker.svg', color: '#EF4444', category: 'security', keywords: ['malicious image', 'container escape'] },
  'IconInfectedScheduler': { file: 'infected_scheduler.svg', color: '#EF4444', category: 'security', keywords: ['persistence', 'cron', 'scheduled task'] },

  // ═══════════════════════════════════════════════════════════════
  // STOLEN VARIANTS (Exfiltrated Secrets)
  // ═══════════════════════════════════════════════════════════════
  'IconStolenToken': { file: 'stolen_token.svg', color: '#EF4444', category: 'security', keywords: ['exfiltrated', 'harvested', 'jwt'] },
  'IconStolenKey': { file: 'stolen_key.svg', color: '#EF4444', category: 'security', keywords: ['exfiltrated', 'ssh', 'api key'] },
  'IconStolenCredential': { file: 'stolen_credential.svg', color: '#EF4444', category: 'security', keywords: ['harvested', 'dumped', 'password'] },
  'IconStolenCertificate': { file: 'stolen_certificate.svg', color: '#EF4444', category: 'security', keywords: ['exfiltrated', 'signing', 'tls'] },

  Cleanup: Remove Duplicate/Alias Entries (Optional)

  Consider consolidating:
  - IconCredential and IconCreds → keep one, alias the other
  - IconEmail and IconMail → keep one, alias the other

  ---
  6. LLM Prompt Updates (llm-prompt-json-only.md)

  6.1 Add New Section: Part 5.5 - Icon State Selection

  Insert after the current Icon Registry (Part 5), before Part 6:

  ---

  # Part 5.5: Icon State Selection (Clean vs. Compromised)

  ## The Dual-State Problem

  Many entities can be either **clean** or **compromised**. Choose the appropriate icon variant based on the entity's state in the scenario.

  ## Decision Matrix

  ### For Executables (Processes, Scripts, Services)

  | Entity State | Icon to Use |
  |--------------|-------------|
  | Legitimate process | `IconProcess` |
  | Injected/backdoored process | `IconInfectedProcess` |
  | Clean source code | `IconCode` |
  | Malicious payload/script | `IconInfectedCode` |
  | Normal shell session | `IconTerminal` |
  | Attacker's reverse shell | `IconInfectedTerminal` |
  | Legitimate service | `IconService` |
  | Backdoored service | `IconInfectedService` |
  | Clean container | `IconDocker` |
  | Malicious container image | `IconInfectedDocker` |
  | Normal CI/CD | `IconPipeline` |
  | Compromised CI/CD | `IconInfectedPipeline` |
  | Legitimate scheduled task | `IconScheduler` |
  | Persistence mechanism | `IconInfectedScheduler` |
  | Clean package | `IconPackage` or `IconNpm` |
  | Trojanized package | `IconInfectedPackage` |

  ### For Secrets (Credentials, Keys, Tokens)

  | Entity State | Icon to Use |
  |--------------|-------------|
  | Target credentials (not yet stolen) | `IconCredential` |
  | Exfiltrated/harvested credentials | `IconStolenCredential` |
  | Target API/SSH key | `IconKey` |
  | Stolen key in attacker's possession | `IconStolenKey` |
  | Target token/session | `IconToken` |
  | Harvested/stolen token | `IconStolenToken` |
  | Target certificate | `IconCertificate` |
  | Stolen signing certificate | `IconStolenCertificate` |

  ## When to Use Each

  ### Use CLEAN icons when:
  - Entity is the **target** of an attack (the thing being attacked)
  - Entity exists **before compromise** happens
  - Entity is **legitimate** infrastructure

  ### Use INFECTED icons when:
  - Entity is the **result** of compromise (spawned malware, backdoor)
  - Entity has been **modified/injected** by attacker
  - Entity is **attacker-controlled** executable

  ### Use STOLEN icons when:
  - Secret is now **in attacker's possession**
  - Credential has been **exfiltrated** to C2/attacker
  - Key/token is being **used by attacker** (not the original owner)

  ## Examples

  ### Example 1: Supply Chain Attack

  ```json
  // WRONG - all processes look the same
  { "id": "npm_process", "icon": "IconProcess" }      // victim's npm
  { "id": "malware_loader", "icon": "IconProcess" }   // attacker's payload

  // CORRECT - visual distinction
  { "id": "npm_process", "icon": "IconTerminal" }           // legitimate CLI
  { "id": "malware_loader", "icon": "IconInfectedProcess" } // malicious payload

  Example 2: Credential Theft

  // Step 6: Target the credentials (use clean icon - it's the target)
  { "id": "aws_creds", "icon": "IconKey", "label": "~/.aws/credentials" }

  // Step 8: After exfiltration, attacker has them (use stolen icon)
  // The EDGE shows theft, but if you need a separate "stolen copy" entity:
  { "id": "harvested_creds", "icon": "IconStolenKey", "label": "Stolen AWS Keys" }

  Example 3: Reverse Shell

  // Victim's terminal (clean)
  { "id": "user_terminal", "icon": "IconTerminal", "label": "Developer CLI" }

  // Attacker's shell on victim (infected)
  { "id": "reverse_shell", "icon": "IconInfectedTerminal", "label": "Reverse Shell" }

  ### 6.2 Update Icon Registry Table (Part 5)

  Add new rows to the existing tables:

  **Add to "Threats & Malware" section:**

  ```markdown
  ## Infected Variants (Compromised Executables)
  | Key | Use For |
  |-----|---------|
  | `IconInfectedCode` | Malicious script, backdoored source |
  | `IconInfectedProcess` | Injected process, malware loader |
  | `IconInfectedTerminal` | Reverse shell, attacker shell session |
  | `IconInfectedService` | Backdoored daemon, persistent service |
  | `IconInfectedPackage` | Trojanized npm/pip/cargo package |
  | `IconInfectedPipeline` | Compromised CI/CD, poisoned build |
  | `IconInfectedDocker` | Malicious container image |
  | `IconInfectedScheduler` | Persistence via cron/scheduled task |

  ## Stolen Variants (Exfiltrated Secrets)
  | Key | Use For |
  |-----|---------|
  | `IconStolenToken` | Harvested JWT, stolen OAuth token |
  | `IconStolenKey` | Exfiltrated SSH key, stolen API key |
  | `IconStolenCredential` | Dumped passwords, harvested creds |
  | `IconStolenCertificate` | Stolen code signing cert |

  6.3 Update Quick Reference (End of Part 5)

  ## Quick Reference by Attack Type

  **Supply Chain Attack?**
  - Clean: `IconNpm`, `IconGitHub`, `IconPipeline`, `IconDocker`
  - Compromised: `IconInfectedPackage`, `IconInfectedPipeline`, `IconInfectedDocker`

  **Credential Theft?**
  - Targets: `IconKey`, `IconToken`, `IconCredential`, `IconEnv`
  - Stolen: `IconStolenKey`, `IconStolenToken`, `IconStolenCredential`

  **Persistence?**
  - `IconInfectedService`, `IconInfectedScheduler`, `IconBackdoor`

  **Reverse Shell / RAT?**
  - `IconInfectedTerminal`, `IconInfectedProcess`, `IconC2`

  6.4 Update Pre-Submission Checklist (Part 9)

  Add new item under "Icons" section:

  ## Icons
  - [ ] All icons use exact PascalCase keys from Icon Registry
  - [ ] No invented icon names
  - [ ] No `color` fields anywhere
  - [ ] **State-appropriate icons used** — Infected variants for attacker payloads, Stolen variants for exfiltrated secrets
  - [ ] **Clean icons for targets** — Use base icons (IconKey, IconProcess) for entities being attacked

  6.5 Update Complete Example (Part 8)

  Modify the example to demonstrate state selection:

  // Change line ~759-762 from:
  {
    "id": "malware_script",
    "type": "node",
    "label": "preinstall.js",
    "icon": "IconMalware",  // Too generic
    ...
  }

  // To:
  {
    "id": "malware_script",
    "type": "node",
    "label": "preinstall.js",
    "icon": "IconInfectedCode",  // Specifically: infected code variant
    ...
  }

  ---
  7. Implementation Checklist

  SVG Creation (10 files)

  - infected_terminal.svg — terminal.svg + malware overlay
  - infected_service.svg — service.svg + malware overlay
  - infected_package.svg — package.svg + malware overlay
  - infected_pipeline.svg — pipeline.svg + malware overlay
  - infected_docker.svg — docker.svg + malware overlay
  - infected_scheduler.svg — scheduler.svg + malware overlay
  - stolen_token.svg — token.svg + exfil indicator
  - stolen_key.svg — key.svg + exfil indicator
  - stolen_credential.svg — credential.svg + exfil indicator
  - stolen_certificate.svg — certificate.svg + exfil indicator

  Registry Update

  - Add 12 new entries to icons.registry.ts (8 infected + 2 existing + 4 stolen)
  - Group under clear section headers

  Prompt Update

  - Add Part 5.5 "Icon State Selection" section
  - Update Icon Registry tables with new icons
  - Update Quick Reference section
  - Update Pre-Submission Checklist
  - Update Complete Example to use IconInfectedCode

  Testing

  - Verify all new SVGs render correctly in Cytoscape
  - Test LLM generates scenarios using new icon keys
  - Validate icon colors display correctly (red #EF4444 for compromised variants)

  ---
  8. Visual Design Notes

  Infected Overlay Pattern (Established)

  - Malware bug from malware.svg
  - Position: translate(35-40, 35-40) scale(0.40)
  - Appears at bottom-right corner
  - ~25% of icon size

  Stolen Overlay Pattern (To Define)

  Recommended approach: Small diagonal arrow (↗) in red, indicating "data leaving"

  <!-- Stolen indicator overlay example -->
  <g transform="translate(50, 10)">
    <path d="M0 12 L8 4 M4 4 L8 4 L8 8" 
          stroke="#EF4444" 
          stroke-width="3" 
          stroke-linecap="round" 
          fill="none"/>
  </g>

  Alternative: Small padlock with "broken" indicator, or skull icon.

  Key requirement: Visually distinct from the "infected" malware bug so users can tell at a glance whether something is "backdoored executable" vs "stolen secret".

✻ Churned for 1m 17s

❯ great, for ths SVGs, add a detail that the infected ones, if there  
  is already a clean version of it, the way should we create infect   
  one is take the clean one, and insert the                           
  @public/assets/icons/malware.svg  one in middle of it, so things    
  are organised and homogene,                                         
  ⎿  Read public/assets/icons/malware.svg (33 lines)

⏺ I'll update the writeup with the exact SVG composition technique.

  ---
  8. Visual Design Notes (Updated)

  Infected Overlay Pattern — Composition Technique

  Source for overlay: /public/assets/icons/malware.svg

  Method: Take the clean base icon SVG, embed the malware.svg content as a scaled overlay.

  Step-by-step:

  1. Copy the base icon (e.g., terminal.svg)
  2. Change viewBox to 80x80 if not already (standardize canvas)
  3. Insert the malware overlay group at the end, before closing </svg>

  Overlay Template (copy this exactly):

  <!-- Small Malware Icon (Overlay) -->
  <!-- Position: bottom-right quadrant, scaled to ~40% -->
  <g transform="translate(38, 38) scale(0.40)">
      <!-- Malware.svg content (entire <g> from malware.svg) -->
      <g transform="scale(0.15625) translate(-144 -144)">
           <g fill="#ef4444">
              <path d="M536.5 331.98L538.941 335.836L602.312 280.18C604.675 278.133 606.089 275.379 606.249 272.23C606.483 269.082 605.46 266.09 603.335 263.73C601.132 261.211 597.983 259.793 594.597 259.793C591.765 259.793 589.085 260.816 586.96 262.707L525.558 316.629L527.761 319.543C530.831 323.48 533.663 327.57 536.5 331.98Z"/>
              <path d="M627.82 432.67H570.75L571.145 436.92C571.617 441.881 571.852 446.998 571.852 452.033V455.889H627.898C634.273 455.889 639.55 450.693 639.55 444.236C639.468 437.865 634.273 432.67 627.82 432.67Z"/>
              <path d="M552.24 550.36L550.037 555.083C547.99 559.571 545.549 564.294 542.873 568.938L541.299 571.692L586.955 611.997C589.08 613.888 591.756 614.911 594.67 614.911C598.056 614.911 601.205 613.493 603.408 610.974C605.455 608.611 606.557 605.54 606.322 602.474C606.088 599.404 604.67 596.572 602.385 594.603L552.24 550.36Z"/>
              <path d="M251.06 555.71L248.935 551.144L197.689 594.441C195.326 596.488 193.912 599.32 193.674 602.39C193.439 605.461 194.381 608.453 196.349 610.734C198.474 613.41 201.783 614.984 205.244 614.984C207.998 614.984 210.678 613.961 212.803 612.23L259.799 572.398L258.225 569.645C255.471 564.605 253.107 560.039 251.06 555.71Z"/>
              <path d="M229.02 452.03C229.02 446.991 229.254 441.875 229.727 436.918L230.121 432.668H172.184C165.809 432.668 160.531 437.863 160.531 444.32C160.531 450.695 165.727 455.973 172.184 455.973H229.098V452.031H229.02Z"/>
              <path d="M262.63 334.66L264.994 330.961C267.514 327.105 270.346 323.012 273.811 318.367L274.205 317.66L274.439 316.793V316.32L274.045 313.879L212.564 262.238C210.439 260.508 207.842 259.563 205.088 259.563C201.623 259.563 198.396 261.059 196.115 263.734C192.021 268.773 192.729 276.094 197.609 280.11L262.63 334.66Z"/>
              <path d="M456.05 192.34L458.804 194.781L485.648 168.016C487.852 165.812 489.035 162.898 489.035 159.75C489.035 156.602 487.855 153.539 485.648 151.336C483.445 149.129 480.535 147.949 477.383 147.949C474.234 147.949 471.32 149.129 469.117 151.336L439.91 180.543L444.004 183.141C448.652 186.129 452.586 189.043 456.05 192.34Z"/>
              <path d="M341.04 194.7L343.794 192.258C347.493 188.871 351.587 185.883 355.837 183.285L360.087 180.688L330.802 151.48C328.603 149.277 325.692 148.098 322.544 148.098C319.474 148.098 316.56 149.277 314.357 151.484C309.79 156.051 309.79 163.449 314.357 167.938L341.04 194.7Z"/>
          </g>

          <path d="M475.41 272.39L476.199 266.879C476.672 263.258 476.906 259.559 476.906 255.859C476.906 213.273 442.347 178.637 399.84 178.637C383.543 178.637 367.957 183.676 354.735 193.277C334.739 207.762 322.852 231.141 322.852 255.859C322.852 259.715 323.168 263.574 323.719 267.43L324.586 272.863L329.465 270.188C351.664 258.066 375.516 251.926 400.469 251.844C424.949 251.844 448.567 257.828 470.531 269.633L475.41 272.39ZM375.672 226.418C368.035 226.418 361.817 220.199 361.817 212.484C361.817 204.848 368.035 198.629 375.672 198.629C383.387 198.629 389.606 204.848 389.606 212.484C389.684 220.117 383.383 226.418 375.672 226.418ZM424.242 226.418C416.605 226.418 410.387 220.199 410.387 212.484C410.387 204.848 416.605 198.629 424.242 198.629C431.957 198.629 438.176 204.848 438.176 212.484C438.176 220.117 431.875 226.418 424.242 226.418Z" 
                fill="#27272a" 
                stroke="#ef4444" 
                stroke-width="14"/>

          <circle cx="375.672" cy="212.484" r="9" fill="#ef4444"/>
          <circle cx="424.242" cy="212.484" r="9" fill="#ef4444"/>

          <path d="M235.79 455.73C235.79 491.312 243.821 526.105 259.013 556.34C259.407 556.969 259.485 557.129 259.485 557.285C288.137 613.57 337.653 648.758 391.965 651.672L396.059 651.902V259.645L391.965 259.879C304.43 264.605 235.79 350.645 235.79 455.73Z" 
                fill="#27272a" 
                stroke="#ef4444" 
                stroke-width="14"/>

          <path d="M407.95 259.88L403.856 259.645V651.906L407.95 651.672C462.266 648.758 511.78 613.57 540.43 557.285C540.43 557.207 540.508 556.969 540.903 556.34C556.094 526.031 564.126 491.238 564.126 455.73C564.126 350.641 495.481 264.602 407.95 259.88Z" 
                fill="#27272a" 
                stroke="#ef4444" 
                stroke-width="14"/>
      </g>
  </g>

  Position Adjustments

  The translate(X, Y) values may need slight adjustment per base icon to avoid overlap with important elements:
  ┌───────────────┬─────────────────────┬────────────────────────────────┐
  │   Base Icon   │ Suggested translate │             Notes              │
  ├───────────────┼─────────────────────┼────────────────────────────────┤
  │ terminal.svg  │ translate(38, 38)   │ Standard bottom-right          │
  ├───────────────┼─────────────────────┼────────────────────────────────┤
  │ service.svg   │ translate(38, 38)   │ Standard bottom-right          │
  ├───────────────┼─────────────────────┼────────────────────────────────┤
  │ package.svg   │ translate(38, 38)   │ Standard bottom-right          │
  ├───────────────┼─────────────────────┼────────────────────────────────┤
  │ pipeline.svg  │ translate(38, 38)   │ Standard bottom-right          │
  ├───────────────┼─────────────────────┼────────────────────────────────┤
  │ docker.svg    │ translate(38, 38)   │ Standard bottom-right          │
  ├───────────────┼─────────────────────┼────────────────────────────────┤
  │ scheduler.svg │ translate(38, 38)   │ Standard bottom-right          │
  ├───────────────┼─────────────────────┼────────────────────────────────┤
  │ code.svg      │ translate(40, 40)   │ Shift right to clear the slash │
  ├───────────────┼─────────────────────┼────────────────────────────────┤
  │ process.svg   │ translate(35, 35)   │ Existing pattern               │
  └───────────────┴─────────────────────┴────────────────────────────────┘
  Base Icon ViewBox Handling

  Some base icons use viewBox="0 0 24 24" (smaller). For consistency:

  Option A (Preferred): Scale the base icon content to fit 80x80 viewBox
  <svg viewBox="0 0 80 80" ...>
      <g transform="scale(3.33) translate(0, 0)">
          <!-- Original 24x24 content -->
      </g>
      <!-- Malware overlay (uses 80x80 coordinates) -->
  </svg>

  Option B: Adjust overlay translate for 24x24 viewBox
  <g transform="translate(12, 12) scale(0.12)">
      <!-- Malware overlay scaled for 24x24 canvas -->
  </g>

  Recommendation: Use Option A — standardize all infected variants to viewBox="0 0 80 80" for consistency with existing infected_process.svg and infected_code.svg.

  ---
  Stolen Overlay Pattern — Composition Technique

  For stolen variants, use a red diagonal export arrow instead of the malware bug.

  Stolen Overlay Template:

  <!-- Stolen/Exfiltrated Indicator (top-right corner) -->
  <g transform="translate(52, 8)">
      <!-- Arrow pointing out (↗) -->
      <path d="M0 16 L12 4 M6 4 L12 4 L12 10" 
            stroke="#EF4444" 
            stroke-width="3" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            fill="none"/>
  </g>

  This creates a red arrow in the top-right corner indicating "data exfiltrated/leaving".

  ---
  Summary: Infected SVG Creation Recipe

  1. Open base icon (e.g., terminal.svg)
  2. If viewBox is 24x24, wrap content in <g transform="scale(3.33)">
  3. Change viewBox to "0 0 80 80"
  4. Paste the Malware Overlay Template before </svg>
  5. Adjust translate(X, Y) if overlay blocks important base icon elements
  6. Save as infected_<basename>.svg

  Summary: Stolen SVG Creation Recipe

  1. Open base icon (e.g., token.svg)
  2. If viewBox is 24x24, wrap content in <g transform="scale(3.33)">
  3. Change viewBox to "0 0 80 80"
  4. Paste the Stolen Overlay Template before </svg>
  5. Save as stolen_<basename>.svg