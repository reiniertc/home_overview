class HomeOverview extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    if (!config.rows || !config.columns || !config.cells) {
      throw new Error('Please define rows, columns, and cells in the configuration.');
    }

    this.config = config;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  handleAction(actionConfig) {
    if (!actionConfig || !actionConfig.action) {
      return;
    }

    const action = actionConfig.action;
    if (action === 'call-service') {
      const [domain, service] = actionConfig.service.split('.');
      this._hass.callService(domain, service, actionConfig.service_data).catch((err) => {
        console.error("Service call error:", err);
      });
    } else if (action === 'more-info') {
      const event = new Event('hass-more-info', { bubbles: true, composed: true });
      event.detail = { entityId: actionConfig.entity };
      this.dispatchEvent(event);
    } else if (action === 'navigate') {
      if (actionConfig.navigation_path) {
        window.history.pushState(null, '', actionConfig.navigation_path);
        window.dispatchEvent(new CustomEvent('location-changed'));
      } else {
        console.error("Navigation path not defined in actionConfig");
      }
    }
  }

  render() {
    if (!this.config || !this._hass) {
      return;
    }

    const root = this.shadowRoot;
    if (!root) {
      return;
    }

    while (root.lastChild) {
      root.removeChild(root.lastChild);
    }

    const card = document.createElement('ha-card');
    const title = this.config.title;
    if (title) {
      const header = document.createElement('div');
      header.className = 'card-header';
      header.innerText = title;
      card.appendChild(header);
    }

    const content = document.createElement('div');
    content.style.padding = '16px';
    
    // Apply card background color
    const cardBackgroundColor = this.config.card_background_color || 'var(--card-background-color, white)';
    card.style.backgroundColor = cardBackgroundColor;

    const table = document.createElement('div');
    table.style.display = 'grid';
    table.style.gridTemplateColumns = `repeat(${this.config.columns}, 1fr)`;
    table.style.width = '100%';
    table.style.gridColumnGap = this.config.cell_spacing_horizontal || '5px';
    table.style.gridRowGap = this.config.cell_spacing_vertical || '5px';

    const fontSize = this.config['font-size'] || 1;
    const lineHeight = this.config['line-height'] || '16px';
    const cornerRadius = this.config['corner-radius'] || '5px';
    const defaultBackgroundColor = 'rgba(200,200,200,0.2)'; // Default background color
    const verticalCorrection = this.config.vertical_correction || 1;

    // Apply vertical scaling to the entire card
    card.style.transform = `scaleY(${verticalCorrection})`;
    card.style.transformOrigin = 'top';

    for (let i = 0; i < this.config.rows; i++) {
      for (let j = 0; j < this.config.columns; j++) {
        const cellConfig = (this.config.cells[i] && this.config.cells[i][j]) || {};
        const lightEntityId = cellConfig.light_entity;
        const climateEntityId = cellConfig.climate_entity;
        const mediaEntityId = cellConfig.media_entity;
        const sensorEntityId = cellConfig.sensor_entity;
        const title = cellConfig.title || 'none';
        const cellBackgroundColor = cellConfig.cell_background_color || defaultBackgroundColor;

        const lightState = this._hass.states[lightEntityId] ? this._hass.states[lightEntityId].state : 'Unavailable';
        const climateState = (climateEntityId && this._hass.states[climateEntityId]) ? this._hass.states[climateEntityId].attributes.current_temperature : null;
        const mediaState = (mediaEntityId && this._hass.states[mediaEntityId]) ? this._hass.states[mediaEntityId].state : null;
        const mediaPicture = (mediaEntityId && this._hass.states[mediaEntityId]) ? this._hass.states[mediaEntityId].attributes.entity_picture : null;
        const sensorState = (sensorEntityId && this._hass.states[sensorEntityId]) ? this._hass.states[sensorEntityId].state : null;

        const cell = document.createElement('div');
        cell.style.border = '3px solid rgba(0,0,0,0)';
        cell.style.padding = '8px';
        cell.style.width = '100%';
        cell.style.height = 0;
        cell.style.paddingBottom = '100%'; // Square cells by setting height to match width
        cell.style.boxSizing = 'border-box';
        cell.style.overflow = 'hidden';
        cell.style.textAlign = 'center';
        cell.style.position = 'relative';
        cell.style.borderRadius = cornerRadius;

        if (title.toLowerCase() === 'none') {
          if (lightEntityId) {
            cell.style.backgroundColor = lightState === 'on' ? 'var(--primary-color)' : cellBackgroundColor;
          } else {
            cell.style.backgroundColor = 'transparent';
          }
        } else if (lightState === 'on') {
          cell.style.backgroundColor = 'var(--primary-color)';
        } else if (!mediaPicture && lightState === 'off') {
          cell.style.backgroundColor = cellBackgroundColor;
        } else {
          cell.style.backgroundColor = cellBackgroundColor;
        }

        if (mediaState === 'playing' && mediaPicture) {
          const imageOverlay = document.createElement('div');
          imageOverlay.style.backgroundImage = `url(${mediaPicture})`;
          imageOverlay.style.backgroundSize = 'cover';
          imageOverlay.style.backgroundRepeat = 'no-repeat';
          imageOverlay.style.backgroundPosition = 'center';
          imageOverlay.style.opacity = 0.35;
          imageOverlay.style.position = 'absolute';
          imageOverlay.style.top = '0';
          imageOverlay.style.left = '0';
          imageOverlay.style.width = '100%';
          imageOverlay.style.height = '100%';
          cell.appendChild(imageOverlay);
        }

        const cellContent = document.createElement('div');

        let cellHTML = '';
        if (title.toLowerCase() !== 'none') {
          cellHTML += `<div style="font-size: ${fontSize}em; line-height: ${lineHeight}; z-index: 1;">${title}</div>`;
        }
        if (climateEntityId && climateEntityId.toLowerCase() !== 'none' && climateState !== null) {
          cellHTML += `<div style="font-size: ${fontSize}em; line-height: ${lineHeight}; z-index: 1;">${climateState}&deg;</div>`;
        } else {
          cellHTML += `<div style="font-size: ${fontSize}em; line-height: ${lineHeight}; visibility: hidden;">&nbsp;</div>`;  // Add an empty div to maintain height consistency
        }
        if (sensorEntityId && sensorState !== null) {
          cellHTML += `<div style="font-size: ${fontSize}em; line-height: ${lineHeight}; z-index: 1;">${sensorState}</div>`;
        } else {
          cellHTML += `<div style="font-size: ${fontSize}em; line-height: ${lineHeight}; visibility: hidden;">&nbsp;</div>`; // Add an empty div to maintain height consistency
        }
        cellContent.innerHTML = cellHTML;

        cellContent.style.position = 'absolute';
        cellContent.style.top = '50%';
        cellContent.style.left = '50%';
        cellContent.style.transform = 'translate(-50%, -50%)';
        cellContent.style.width = '100%';
        cellContent.style.height = '100%';
        cellContent.style.display = 'flex';
        cellContent.style.flexDirection = 'column';
        cellContent.style.alignItems = 'center';
        cellContent.style.justifyContent = 'center';
        cellContent.style.boxSizing = 'border-box';
        cellContent.style.padding = '1px';
        cellContent.style.textAlign = 'center';

        cell.appendChild(cellContent);
        table.appendChild(cell);

        // Add event listeners for tap, hold, and double-tap actions
        if (cellConfig.tap_action) {
          cell.addEventListener('click', () => this.handleAction(cellConfig.tap_action));
        }
        if (cellConfig.hold_action) {
          cell.addEventListener('contextmenu', (ev) => {
            ev.preventDefault();
            this.handleAction(cellConfig.hold_action);
          });
        }
        if (cellConfig.double_tap_action) {
          cell.addEventListener('dblclick', () => this.handleAction(cellConfig.double_tap_action));
        }
      }
    }

    content.appendChild(table);
    card.appendChild(content);
    root.appendChild(card);
  }

  getCardSize() {
    return 3;
  }
}

customElements.define('home-overview', HomeOverview);
