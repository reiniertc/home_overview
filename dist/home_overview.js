class HomeOverview extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    const root = this.shadowRoot;

    const style = document.createElement("style");
    style.textContent = `
      :host {
        font-family: var(--home-overview-font, inherit);
        display: block;
      }

      ha-card {
        font-family: inherit;
      }

      .card-header {
        padding: 16px 16px 0 16px;
        font-size: 1.2em;
        font-weight: 500;
      }
    `;
    root.appendChild(style);

    this._card = document.createElement("ha-card");

    this._header = document.createElement("div");
    this._header.className = "card-header";

    this._content = document.createElement("div");
    this._content.style.padding = "16px";

    this._card.appendChild(this._header);
    this._card.appendChild(this._content);
    root.appendChild(this._card);

    this._cells = [];
    this._cellConfigs = [];
    this._gridWrapper = document.createElement("div");
    this._content.appendChild(this._gridWrapper);

    this._renderScheduled = false;
  }

  setConfig(config) {
    if (!config.rows || !config.columns || !config.cells) {
      throw new Error("Please define rows, columns, and cells in the configuration.");
    }

    this.config = config;

    // Titel beheren
    if (this.config.title) {
      this._header.textContent = this.config.title;
      this._header.style.display = "";
    } else {
      this._header.textContent = "";
      this._header.style.display = "none";
    }

    // Achtergrondkleur van de kaart
    const cardBackgroundColor =
      this.config.card_background_color || "var(--card-background-color, white)";
    this._card.style.backgroundColor = cardBackgroundColor;

    this._buildGrid();
    this.render();
  }

  set hass(hass) {
    this._hass = hass;

    if (this._renderScheduled) return;
    this._renderScheduled = true;

    window.requestAnimationFrame(() => {
      this._renderScheduled = false;
      this.render();
    });
  }

  handleAction(actionConfig) {
    if (!actionConfig || !actionConfig.action) {
      return;
    }

    const action = actionConfig.action;

    if (action === "call-service") {
      const [domain, service] = actionConfig.service.split(".");
      this._hass
        .callService(domain, service, actionConfig.service_data)
        .catch((err) => {
          console.error("Service call error:", err);
        });
    } else if (action === "more-info") {
      const event = new Event("hass-more-info", { bubbles: true, composed: true });
      event.detail = { entityId: actionConfig.entity };
      this.dispatchEvent(event);
    } else if (action === "navigate") {
      if (actionConfig.navigation_path) {
        window.history.pushState(null, "", actionConfig.navigation_path);
        window.dispatchEvent(new CustomEvent("location-changed"));
      } else {
        console.error("Navigation path not defined in actionConfig");
      }
    }
  }

  _buildGrid() {
    if (!this.config) return;

    // grid-wrapper leegmaken
    while (this._gridWrapper.firstChild) {
      this._gridWrapper.removeChild(this._gridWrapper.firstChild);
    }

    const table = document.createElement("div");
    table.style.display = "grid";
    table.style.gridTemplateColumns = `repeat(${this.config.columns}, 1fr)`;
    table.style.width = "100%";
    table.style.gridColumnGap = this.config.cell_spacing_horizontal || "5px";
    table.style.gridRowGap = this.config.cell_spacing_vertical || "5px";

    const cornerRadius = this.config["corner-radius"] || "5px";

    this._cells = [];
    this._cellConfigs = [];

    for (let i = 0; i < this.config.rows; i++) {
      this._cells[i] = [];
      this._cellConfigs[i] = [];

      for (let j = 0; j < this.config.columns; j++) {
        const cellConfig = (this.config.cells[i] && this.config.cells[i][j]) || {};
        this._cellConfigs[i][j] = cellConfig;

        const cell = document.createElement("div");
        cell.style.border = "3px solid rgba(0,0,0,0)";
        cell.style.padding = "8px";
        cell.style.width = "100%";
        cell.style.height = 0;
        cell.style.paddingBottom = "100%";
        cell.style.boxSizing = "border-box";
        cell.style.overflow = "hidden";
        cell.style.textAlign = "center";
        cell.style.position = "relative";
        cell.style.borderRadius = cornerRadius;

        const cellContent = document.createElement("div");
        cellContent.style.position = "absolute";
        cellContent.style.top = "50%";
        cellContent.style.left = "50%";
        cellContent.style.transform = "translate(-50%, -50%)";
        cellContent.style.width = "100%";
        cellContent.style.height = "100%";
        cellContent.style.display = "flex";
        cellContent.style.flexDirection = "column";
        cellContent.style.alignItems = "center";
        cellContent.style.justifyContent = "center";
        cellContent.style.boxSizing = "border-box";
        cellContent.style.padding = "1px";
        cellContent.style.textAlign = "center";

        const titleEl = document.createElement("div");
        const climateEl = document.createElement("div");
        const sensorEl = document.createElement("div");

        cellContent.appendChild(titleEl);
        cellContent.appendChild(climateEl);
        cellContent.appendChild(sensorEl);

        const imageOverlay = document.createElement("div");
        imageOverlay.style.position = "absolute";
        imageOverlay.style.top = "0";
        imageOverlay.style.left = "0";
        imageOverlay.style.width = "100%";
        imageOverlay.style.height = "100%";
        imageOverlay.style.opacity = "0.35";
        imageOverlay.style.backgroundSize = "cover";
        imageOverlay.style.backgroundRepeat = "no-repeat";
        imageOverlay.style.backgroundPosition = "center";
        imageOverlay.style.pointerEvents = "none";
        imageOverlay.style.display = "none";

        cell.appendChild(imageOverlay);
        cell.appendChild(cellContent);
        table.appendChild(cell);

        // acties
        if (cellConfig.tap_action) {
          cell.addEventListener("click", () => this.handleAction(cellConfig.tap_action));
        }
        if (cellConfig.hold_action) {
          cell.addEventListener("contextmenu", (ev) => {
            ev.preventDefault();
            this.handleAction(cellConfig.hold_action);
          });
        }
        if (cellConfig.double_tap_action) {
          cell.addEventListener("dblclick", () =>
            this.handleAction(cellConfig.double_tap_action)
          );
        }

        this._cells[i][j] = {
          cell,
          titleEl,
          climateEl,
          sensorEl,
          imageOverlay,
        };
      }
    }

    this._gridWrapper.appendChild(table);
  }

  render() {
    if (!this.config || !this._hass) return;

    const fontSize = this.config["font-size"] || 1;
    const lineHeight = this.config["line-height"] || "16px";
    const defaultBackgroundColor = "rgba(200,200,200,0.2)";
    const verticalCorrection = this.config.vertical_correction || 1;

    // schaal alleen de grid-wrapper, niet de hele kaart
    this._gridWrapper.style.transform = `scaleY(${verticalCorrection})`;
    this._gridWrapper.style.transformOrigin = "top";

    for (let i = 0; i < this.config.rows; i++) {
      for (let j = 0; j < this.config.columns; j++) {
        const cellConfig = this._cellConfigs[i][j] || {};
        const refs = this._cells[i][j];
        if (!refs) continue;

        const lightEntityId = cellConfig.light_entity;
        const climateEntityId = cellConfig.climate_entity;
        const mediaEntityId = cellConfig.media_entity;
        const sensorEntityId = cellConfig.sensor_entity;
        const title = cellConfig.title || "none";
        const cellBackgroundColor = cellConfig.cell_background_color || defaultBackgroundColor;

        const lightState =
          lightEntityId && this._hass.states[lightEntityId]
            ? this._hass.states[lightEntityId].state
            : "Unavailable";

        const climateState =
          climateEntityId && this._hass.states[climateEntityId]
            ? this._hass.states[climateEntityId].attributes.current_temperature
            : null;

        const mediaState =
          mediaEntityId && this._hass.states[mediaEntityId]
            ? this._hass.states[mediaEntityId].state
            : null;

        const mediaPicture =
          mediaEntityId && this._hass.states[mediaEntityId]
            ? this._hass.states[mediaEntityId].attributes.entity_picture
            : null;

        const sensorState =
          sensorEntityId && this._hass.states[sensorEntityId]
            ? this._hass.states[sensorEntityId].state
            : null;

        // achtergrondkleur
        if (title.toLowerCase() === "none") {
          if (lightEntityId) {
            refs.cell.style.backgroundColor =
              lightState === "on" ? "var(--primary-color)" : cellBackgroundColor;
          } else {
            refs.cell.style.backgroundColor = "transparent";
          }
        } else if (lightState === "on") {
          refs.cell.style.backgroundColor = "var(--primary-color)";
        } else {
          refs.cell.style.backgroundColor = cellBackgroundColor;
        }

        // media overlay
        if (mediaState === "playing" && mediaPicture) {
          refs.imageOverlay.style.backgroundImage = `url(${mediaPicture})`;
          refs.imageOverlay.style.display = "block";
        } else {
          refs.imageOverlay.style.display = "none";
        }

        // tekst-styling
        refs.titleEl.style.fontSize = `${fontSize}em`;
        refs.titleEl.style.lineHeight = lineHeight;
        refs.climateEl.style.fontSize = `${fontSize}em`;
        refs.climateEl.style.lineHeight = lineHeight;
        refs.sensorEl.style.fontSize = `${fontSize}em`;
        refs.sensorEl.style.lineHeight = lineHeight;

        // titel
        if (title.toLowerCase() !== "none") {
          refs.titleEl.textContent = title;
          refs.titleEl.style.visibility = "visible";
        } else {
          refs.titleEl.textContent = "";
          refs.titleEl.style.visibility = "hidden";
        }

        // climate
        if (climateEntityId && climateEntityId.toLowerCase() !== "none" && climateState != null) {
          refs.climateEl.textContent = `${climateState}°`;
          refs.climateEl.style.visibility = "visible";
        } else {
          refs.climateEl.textContent = "";
          refs.climateEl.style.visibility = "hidden";
        }

        // sensor
        if (sensorEntityId && sensorState != null) {
          refs.sensorEl.textContent = sensorState;
          refs.sensorEl.style.visibility = "visible";
        } else {
          refs.sensorEl.textContent = "";
          refs.sensorEl.style.visibility = "hidden";
        }
      }
    }
  }

  getCardSize() {
    return 3;
  }
}

customElements.define("home-overview", HomeOverview);
