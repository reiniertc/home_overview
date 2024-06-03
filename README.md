# home_overview
A complete overview of every room in your house in a single card

This is a custom component with the goal of providing you an overview of you entire house in one card. 
It allows you to define a table with a single or multiple columns and rows.
In every cell you can:
- display the title of a room
- display the current light, by filling the background with the primary color
- display the temperature on the second row
- display the current playing song album art as a background
- display the status of a sensor on the bottom row

The cells wil allways appear square. The appearance is highly configurable:
- border-radius
- opacity
- text size
- vertical spacing
- horizontal spacing

The configuration-options of the card are as follows:


Example of what you can achieve:
<img width="927" alt="Scherm­afbeelding 2024-06-03 om 11 42 45" src="https://github.com/reiniertc/home_overview/assets/5908262/ec23fa00-bbd5-4ef5-82c4-795f8f9b7c57">

Code used to configure the example:
'''
type: custom:reinier-custom-card
title: null
rows: 3
columns: 9
font-size: 1.5
line-height: 1.5
corner-radius: 8px
transparency: 0.2
cell_spacing: 3px
cell_spacing_vertical: 2px
cell_spacing_horizontal: 3px
cells:
  - - title: none
    - title: Bureau
      light_entity: light.bureau
      climate_entity: climate.woonkamer
      media_entity: media_player.keuken_2
      double_tap_action:
        action: call-service
        service: light.toggle
        service_data:
          entity_id: light.bureau
    - title: Washok
      light_entity: light.washok_3
      double_tap_action:
        action: call-service
        service: light.toggle
        service_data:
          entity_id: light.washok
    - title: Gang
      light_entity: light.zolder_ha_group
      double_tap_action:
        action: call-service
        service: light.toggle
        service_data:
          entity_id: light.zolder_ha_group
    - title: Slaapkmr
      light_entity: light.slaapkamer
      sensor_entity: climate.zolder_room_temperature
      double_tap_action:
        action: call-service
        service: light.toggle
        service_data:
          entity_id: light.slaapkamer
      tap_action:
        action: toggle
      climate_entity: climate.zolder_room_temperature
    - title: none
    - title: none
    - title: none
    - title: none
  - - title: none
    - title: Badkmr
      light_entity: light.badkamer
      climate_entity: climate.badkamer
      double_tap_action:
        action: call-service
        service: light.toggle
        service_data:
          entity_id: light.badkamer
    - title: Mats
      light_entity: light.mats
      sensor_entity: climate.mats_room_temperature
      climate_entity: climate.mats_room_temperature
      double_tap_action:
        action: call-service
        service: light.toggle
        service_data:
          entity_id: light.mats
    - title: Gang
      light_entity: light.gang_1e
      climate_entity: none
      double_tap_action:
        action: call-service
        service: light.toggle
        service_data:
          entity_id: light.gang_1e
    - title: Roemer
      light_entity: light.roemer_nieuw
      sensor_entity: climate.roemer_room_temperature
      media_entity: media_player.roemer
      climate_entity: climate.roemer_room_temperature
      double_tap_action:
        action: call-service
        service: light.toggle
        service_data:
          entity_id: light.roemer_nieuw
    - title: Kleedkmr
      light_entity: light.kleedkamer
      climate_entity: climate.kleedkamer
      double_tap_action:
        action: call-service
        service: light.toggle
        service_data:
          entity_id: light.kleedkamer
    - title: none
    - title: none
    - title: none
  - - title: none
    - title: Hal
      light_entity: light.dimmable_light_1
      climate_entity: none
      double_tap_action:
        action: call-service
        service: light.toggle
        service_data:
          entity_id: light.dimmable_light_1
    - title: Trapkast
      light_entity: light.trapkast
      double_tap_action:
        action: call-service
        service: light.toggle
        service_data:
          entity_id: light.trapkast
    - title: Gang
      light_entity: light.gang
      climate_entity: climate.gang
      double_tap_action:
        action: call-service
        service: light.toggle
        service_data:
          entity_id: light.gang
    - title: Woonkmr
      light_entity: light.woonkamer_3
      climate_entity: climate.woonkamer
      media_entity: media_player.woonkamer
      double_tap_action:
        action: call-service
        service: light.toggle
        service_data:
          entity_id: light.woonkamer_3
    - title: Keuken
      light_entity: light.keuken_3
      climate_entity: climate.woonkamer
      double_tap_action:
        action: call-service
        service: light.toggle
        service_data:
          entity_id: light.keuken_3
    - title: none
      light_entity: light.achtertuin_ha_group
      double_tap_action:
        action: call-service
        service: light.toggle
        service_data:
          entity_id: light.achtertuin_ha_group
    - title: Schuur
      sensor_entity: sensor.slot_schuurdeur
    - title: Veranda
      light_entity: light.veranda
      sensor_entity: sensor.slot_poortdeur
      double_tap_action:
        action: call-service
        service: light.toggle
        service_data:
          entity_id: light.veranda
'''
