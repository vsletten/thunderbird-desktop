/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Life Dashboard Tab Type
 *
 * This module defines a tab type for the AI-powered "Life Dashboard" feature.
 * The Life tab embeds a browser element that loads a React dashboard served
 * by a FastAPI backend, providing an intelligent overview of email-derived
 * information including contacts, events, deliveries, and action items.
 *
 * @module lifeTabs
 */

/* globals MozElements */

var { MailE10SUtils } = ChromeUtils.importESModule(
  "resource:///modules/MailE10SUtils.sys.mjs"
);

/**
 * Default URL for the Life Dashboard.
 * This will be loaded in the browser element when the tab is opened.
 * Initially uses a data URL for testing; will be changed to localhost API.
 */
const LIFE_DASHBOARD_DEFAULT_URL =
  "data:text/html,<html><head><title>Life Dashboard</title><style>body{font-family:system-ui,-apple-system,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:linear-gradient(135deg,%23667eea%200%25,%23764ba2%20100%25);color:white;}</style></head><body><div style='text-align:center'><h1>Life Dashboard</h1><p>Browser element loaded successfully!</p><p>Ready for FastAPI backend connection.</p></div></body></html>";

/**
 * Tab monitor for Life Dashboard.
 * Monitors tab events and updates state accordingly.
 */
var lifeTabMonitor = {
  monitorName: "lifeTabMonitor",

  // Required tab monitor methods (unused for now, but needed for interface)
  onTabTitleChanged() {},
  onTabOpened() {},
  onTabClosing() {},
  onTabPersist() {},
  onTabRestored() {},

  /**
   * Called when switching between tabs.
   *
   * @param {object} aNewTab - The tab being switched to.
   * @param {object} aOldTab - The tab being switched from.
   */
  onTabSwitched(aNewTab, aOldTab) {
    // Placeholder for any state updates needed when switching to/from Life tab
    if (aOldTab?.mode.name === "life") {
      // Handle switching away from Life tab if needed
    }
    if (aNewTab?.mode.name === "life") {
      // Handle switching to Life tab if needed
    }
  },
};

/**
 * Life Dashboard Tab Type Definition.
 *
 * Uses a shared panel approach (panelId) since we only need one Life tab.
 * The panel will contain an embedded browser element that loads the
 * dashboard UI from a local FastAPI server.
 */
var lifeTabType = {
  name: "life",
  panelId: "lifeTabPanel",
  modes: {
    life: {
      type: "life",
      // Only allow one Life Dashboard tab at a time
      maxTabs: 1,

      /**
       * Opens the Life Dashboard tab.
       *
       * @param {object} tab - The tab info object.
       * @param {object} args - Optional arguments for opening the tab.
       */
      openTab(tab, args) {
        // Set the tab icon
        tab.tabNode.setIcon(
          "chrome://messenger/skin/icons/new/compact/calendar.svg"
        );
        // Set the tab title
        tab.title = "Life Dashboard";

        // Get the browser element from the panel
        tab.browser = document.getElementById("lifeTabBrowser");

        if (tab.browser) {
          // Configure browser for content loading
          tab.browser.setAttribute("type", "content");

          // Load the dashboard URL (data URL for testing, will be localhost later)
          const url = args.url || LIFE_DASHBOARD_DEFAULT_URL;
          MailE10SUtils.loadURI(tab.browser, url);
        }
      },

      /**
       * Called when the tab is shown/activated.
       *
       * @param {object} tab - The tab info object.
       */
      showTab(tab) {
        // Placeholder for any actions needed when showing the tab
      },

      /**
       * Called when the tab is being closed.
       *
       * @param {object} tab - The tab info object.
       */
      closeTab(tab) {
        // Placeholder for any cleanup needed when closing the tab
      },

      /**
       * Persists the tab state for session restore.
       *
       * @param {object} tab - The tab info object.
       * @returns {object} State object to be persisted.
       */
      persistTab(tab) {
        const tabmail = document.getElementById("tabmail");
        return {
          // Store whether this tab was in the background
          background: tab !== tabmail.currentTabInfo,
        };
      },

      /**
       * Restores a tab from persisted state.
       *
       * @param {object} tabmail - The tabmail element.
       * @param {object} state - The persisted state object.
       */
      restoreTab(tabmail, state) {
        tabmail.openTab("life", state);
      },

      /**
       * Called when the tab title should be updated.
       *
       * @param {object} tab - The tab info object.
       */
      onTitleChanged(tab) {
        tab.title = "Life Dashboard";
      },

      /**
       * Determines if we should switch to an existing tab.
       * Since maxTabs is 1, this returns the index of the existing tab if found.
       *
       * @param {object} args - Arguments for opening the tab.
       * @returns {number} Index of existing tab to switch to, or -1 to open new.
       */
      shouldSwitchTo(args) {
        const tabmail = document.getElementById("tabmail");
        const tabIndex = tabmail.tabModes.life.tabs[0]
          ? tabmail.tabInfo.indexOf(tabmail.tabModes.life.tabs[0])
          : -1;
        return tabIndex;
      },

      /**
       * Returns the browser element for this tab.
       *
       * @param {object} tab - The tab info object.
       * @returns {Element} The browser element.
       */
      getBrowser(tab) {
        return tab.browser || document.getElementById("lifeTabBrowser");
      },

      // Command handling stubs (can be expanded later)
      supportsCommand(aCommand) {
        return false;
      },
      isCommandEnabled(aCommand) {
        return false;
      },
      doCommand(aCommand) {},
      onEvent(aEvent) {},
    },
  },

  /**
   * Saves the tab state when deactivated/hidden.
   *
   * @param {object} tab - The tab info object.
   */
  saveTabState(tab) {
    // Placeholder for saving any tab-specific state
  },
};

/**
 * Lazy getter for notification box in the Life tab panel.
 * Creates a notification box for displaying messages to the user.
 */
ChromeUtils.defineLazyGetter(lifeTabType.modes.life, "notificationbox", () => {
  return new MozElements.NotificationBox(element => {
    const container = document.getElementById(
      "life-deactivated-notification-location"
    );
    if (container) {
      container.append(element);
    }
  });
});

/**
 * Register the Life tab type when the window loads.
 * This follows the pattern used by calendar-tabs.js.
 */
window.addEventListener("load", () => {
  const tabmail = document.getElementById("tabmail");
  if (tabmail) {
    tabmail.registerTabType(lifeTabType);
    tabmail.registerTabMonitor(lifeTabMonitor);

    // TEMPORARY: Open Life tab on startup for testing
    // TODO: Remove this once Task 1.7 adds proper UI to open the tab
    // Delay slightly to ensure mail tabs are initialized first
    setTimeout(() => {
      tabmail.openTab("life", {});
      console.log("Life Dashboard tab opened for testing");
    }, 1000);
  }
});
