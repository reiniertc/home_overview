class HomeOverview extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    if (!config.rows || !config.columns) {
      throw new Error('Please define rows and columns');
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

    if (this.config.title) {
      const header = document.createElement('div');
      header.classList.add('card-header');
      header.textContent = this.config.title;
      card.appendChild(header);
    }

    const content = document.createElement('div');
    content.style.padding = '16px';

    const table = document.createElement('div');
    table.style.display = 'grid';
    table.style.gridTemplateColumns = `repeat(${this.config.columns}, 1fr)`;
    table.style.gridTemplateRows = `repeat(${this.config.rows}, 1fr)`;
    table.style.gap = `${this.config.cell_spacing_vertical || '3px'} ${this.config.cell_spacing_horizontal || '3px'}`;
    table.style.width = '100%';

    const fontSize = this.config['font-size'] || 1;
    const lineHeight = this.config['line-height'] || '16px';
    const cornerRadius = this.config['corner-radius'] || '5px';
    const transparency = this.config['transparency'] || 0.2; // Default transparency is 20%

    for (let i = 0; i < this.config.rows; i++) {
      for (let j = 0; j < this.config.columns; j++) {
        const cellConfig = this.config.cells[i][j];
        const lightEntityId = cellConfig.light_entity;
        const climateEntityId = cellConfig.climate_entity;
        const mediaEntityId = cellConfig.media_entity;
        const sensorEntityId = cellConfig.sensor_entity;
        const title = cellConfig.title;

        const lightState = this._hass.states[lightEntityId] ? this._hass.states[lightEntityId].state : 'Unavailable';
        const climateState = (climateEntityId && this._hass.states[climateEntityId]) ? this._hass.states[climateEntityId].attributes.current_temperature : null;
        const mediaState = (mediaEntityId && this._hass.states[mediaEntityId]) ? this._hass.states[mediaEntityId].state : null;
        const mediaPicture = (mediaEntityId && this._hass.states[mediaEntityId]) ? this._hass.states[mediaEntityId].attributes.entity_picture : null;
        const sensorState = (sensorEntityId && this._hass.states[sensorEntityId]) ? this._hass.states[sensorEntityId].state : null;

        const cell = document.createElement('div');
        cell.style.border = '3px solid rgba(0,0,0,0)';
        cell.style.width = '100%';
        cell.style.height = 0;
        cell.style.paddingBottom = '100%'; // Square cells by setting height to match width
        cell.style.boxSizing = 'border-box';
        cell.style.overflow = 'hidden';
        cell.style.textAlign = 'center';
        cell.style.position = 'relative';
        cell.style.borderRadius = cornerRadius;

        if (title.toLowerCase() === 'none') {
          if (lightEntityId && lightState === 'on') {
            cell.style.backgroundColor = 'var(--primary-color)';
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
          cellHTML += `<div style="font-size: ${fontSize}em; line-height: ${lineHeight}; visibility: hidden;">&nbsp;</div>`;
        }
        if (sensorEntityId && sensorState !== null) {
          cellHTML += `<div style="font-size: ${fontSize}em; line-height: ${lineHeight}; z-index: 1;">${sensorState}</div>`;
        } else {
          cellHTML += `<div style="font-size: ${fontSize}em; line-height: ${lineHeight}; visibility: hidden;">&nbsp;</div>`;
        }
        cellContent.innerHTML = cell
