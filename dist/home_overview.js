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
    this.createCard();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateCard();
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
    }
  }

  createCard() {
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
    card.id = 'home-overview-card';

    const title = this.config.title;
    if (title) {
      const header = document.createElement('div');
      header.className = 'card-header';
      header.innerText = title;
      card.appendChild(header);
    }

    const content = document.createElement('div');
    content.style.padding = '16px';
    content.id = 'content';

    const table = document.createElement('div');
    table.style.display = 'grid';
    table.style.gridTemplateColumns = `repeat(${this.config.columns}, 1fr)`;
    table.style.width = '100%';
    table.style.gridColumnGap = this.config.cell_spacing_horizontal || '5px';
    table.style.gridRowGap = this.config.cell_spacing_vertical || '5px';
    table.id = 'table';

    const fontSize = this.config['font-size'] || 1;
    const lineHeight = this.config['line-height'] || '16px';
    const cornerRadius = this.config['corner-radius'] || '5px';
    const transparency = this.config['transparency'] || 0.2; // Default transparency is 20%

    // Read vertical_correction from config and set default value to 1 (no scaling)
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

        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = i;
        cell.dataset.col = j;
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

        cell.innerHTML = `
          <div class="cell-content" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; box-sizing: border-box; padding: 1px; text-align: center;">
          </div>
        `;

        cell.addEventListener('click', () => this.handleAction(cellConfig.tap_action));
        cell.addEventListener('contextmenu', (ev) => {
          ev.preventDefault();
          this.handleAction(cellConfig.hold_action);
        });
        cell.addEventListener('dblclick', () => this.handleAction(cellConfig.double_tap_action));

        table.appendChild(cell);
      }
    }

    content.appendChild(table);
    card.appendChild(content);
    root.appendChild(card);

    // Ensure the card is rendered and update the content
    this.updateCard();
  }

  updateCard() {
    if (!this.config || !this._hass) {
      return;
    }

    const root = this.shadowRoot;
    if (!root) {
      return;
    }

    const card = root.getElementById('home-overview-card');
    const table = card.querySelector('#table');

    const fontSize = this.config['font-size'] || 1;
    const lineHeight = this.config['line-height'] || '16px';
    const transparency = this.config['transparency'] || 0.2; // Default transparency is 20%

    for (let i = 0; i < this.config.rows; i++) {
      for (let j = 0; j < this.config.columns; j++) {
        const cellConfig = (this.config.cells[i] && this.config.cells[i][j]) || {};
        const lightEntityId = cellConfig.light_entity;
        const climateEntityId = cellConfig.climate_entity;
        const mediaEntityId = cellConfig.media_entity;
        const sensorEntityId = cellConfig.sensor_entity;
        const title = cellConfig.title || 'none';

        const lightState = this._hass.states[lightEntityId] ? this._hass.states[lightEntityId].state : 'Unavailable';
        const climateState = (climateEntityId && this._hass.states[climateEntityId]) ? this._hass.states[climateEntityId].attributes.current_temperature : null;
        const mediaState = (mediaEntityId && this._hass.states[mediaEntityId]) ? this._hass.states[mediaEntityId].state : null;
        const mediaPicture = (mediaEntityId && this._hass.states[mediaEntityId]) ? this._hass.states[mediaEntityId].attributes.entity_picture : null;
        const sensorState = (sensorEntityId && this._hass.states[sensorEntityId]) ? this._hass.states[sensorEntityId].state : null;

        const cell = table.querySelector(`.cell[data-row="${i}"][data-col="${j}"]`);
        const cellContent = cell.querySelector('.cell-content');

        if (title.toLowerCase() === 'none') {
          if (lightEntityId) {
            cell.style.backgroundColor = lightState === 'on' ? 'var(--primary-color)' : `rgba(20,20,20,${transparency})`;
          } else {
            cell.style.backgroundColor = 'transparent';
          }
        } else if (lightState === 'on') {
          cell.style.backgroundColor = 'var(--primary-color)';
        } else if (!mediaPicture && lightState === 'off') {
          cell.style.backgroundColor = `rgba(20,20,20,${transparency})`;
        } else {
          cell.style.backgroundColor = `rgba(20,20,20,${transparency})`;
        }

        if (mediaState === 'playing' && mediaPicture) {
          let imageOverlay = cell.querySelector('.image-overlay');
          if (!imageOverlay) {
            imageOverlay = document.createElement('div');
            imageOverlay.className = 'image-overlay';
            imageOverlay.style.position = 'absolute';
            imageOverlay.style.top = '0';
            imageOverlay.style.left = '0';
            imageOverlay.style.width = '100%';
            imageOverlay.style.height = '100%';
            cell.appendChild(imageOverlay);
          }
          imageOverlay.style.backgroundImage = `url(${mediaPicture})`;
          imageOverlay.style.backgroundSize = 'cover';
          imageOverlay.style.backgroundRepeat = 'no-repeat';
          imageOverlay.style.backgroundPosition = 'center';
          imageOverlay.style.opacity = 0.35;
        } else {
          const imageOverlay = cell.querySelector('.image-overlay');
          if (imageOverlay) {
            imageOverlay.remove();
          }
        }

        let cellHTML = '';
        if (title.toLowerCase() !== 'none') {
          cellHTML += `<div style="font-size: ${fontSize}em; line-height: ${lineHeight}; z-index: 1;">${title}</div>`;
        }
        if (climateEntityId && climateEntityId.toLowerCase() !== 'none' && climateState !== null) {
          cellHTML += `<div style="font-size: ${fontSize}em; line-height: ${lineHeight}; z-index: 1;">${climateState}&deg;</div>`;
        } else {
          cellHTML += `<div style="font-size: ${fontSize}em; line-height: ${lineHeight}; visibility: hidden;">&nbsp;</div>`;
        }
        if (sensorEntityId && sensorState !== null) {
          cellHTML += `<div style="font-size: ${fontSize}em; line-height: ${lineHeight}; z-index: 1;">${sensorState}</div>`;
        } else {
          cellHTML += `<div style="font-size: ${fontSize}em; line-height: ${lineHeight}; visibility: hidden;">&nbsp;</div>`;
        }

        cellContent.innerHTML = cellHTML;
      }
    }
  }

  getCardSize() {
    return 3;
  }
}

customElements.define('home-overview', HomeOverview);
