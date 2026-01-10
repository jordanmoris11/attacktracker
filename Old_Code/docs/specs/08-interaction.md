# Interaction Specification

## Overview
This document describes the interaction model for the Mermaid Beautifier, specifically focusing on the improved node drag-and-drop system.

## 1. Drag & Drop Architecture
The drag interaction system has been re-architected to be robust, performant, and cross-browser compatible (specifically addressing Safari clipping issues).

### **Raycasting Engine (Hit-Test Strategy)**
Instead of relying solely on the browser's native event bubbling (which often clips events outside the SVG `viewBox`), we utilize a **Manual Raycasting / Hit-Test** approach.

**Core Logic:**
1.  **Global Listeners:** We listen for `pointerdown` events on the `window` object in the **capture phase**. This ensures we catch every click, regardless of whether the browser thinks it "missed" the SVG or hit a container overlay.
2.  **Raycast Check:** On every click, if the target is not explicitly a node (e.g., the user clicked "near" a node or on a node that is visually rendered outside the SVG bounds), the system runs a geometry check:
    *   It iterates through all registered `.beautified-node` elements.
    *   It uses `node.getBoundingClientRect()` to get the exact screen coordinates of each node.
    *   It compares these rectangles against the pointer's `clientX` / `clientY`.
3.  **Event Hijacking:** If a visual match is found, the system "claims" the event, calls `preventDefault()` (to stop text selection), and initiates the drag sequence immediately.

**Benefits:**
*   **Infinite Canvas feel:** Nodes can be dragged and dropped anywhere on the screen, even outside the strict SVG container bounds.
*   **No Layout Jitter:** We do **not** resize the SVG `viewBox` during interaction. This preventing the "zoom in/out" wobbling effect that occurs with auto-fitting strategies.
*   **Safari Compatibility:** Completely bypasses Safari's aggressive event clipping for overflow content.

## 2. Edge Routing
*   **Dynamic Updates:** Edges are recalculated in real-time (60fps target) during the drag.
*   **Curved Routing:** Parallel edges between the same two nodes are automatically curved to prevent overlap, using a calculated normal vector to the line between the nodes.
*   **Label Centering:** Edge labels maintain their relative position (midpoint or apex of curve) dynamically.

## 3. Gestures & Touch
*   **Touch Action:** Nodes have `touch-action: none` to prevent scrolling while dragging.
*   **Native Gestures:** Native touch gestures (like "swipe to navigate") are explicitly prevented on the SVG canvas to treat it as an application surface.

## 4. Visual Feedback
*   **Cursor:** Changes to `grabbing` during active drag.
*   **Highlight:** Nodes receive a `.dragging` class for optional CSS highlighting (e.g., shadow lift).
*   **Z-Index:** While SVG does not support z-index, the Raycasting engine ensures the "topmost" visual element (last in DOM order) is prioritized for selection.
