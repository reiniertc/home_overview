#HomeOverview

This card provides a configurable grid view of entities in Home Assistant.

## Installation

1. Add this repository to HACS.
2. Search for "Home Overview" and install.
3. Add the following code to your `configuration.yaml` or via the UI in Lovelace resources:

```yaml
resources:
 - url: /hacsfiles/home_overview/home_overview.js
 type: module
```
