# Hidden Topographies of Google
This project is designed to turn your Google location data into virtual terrains. In this data visualization, elevation corresponds to the frequency of visiting a particular place. So, for example, the highest peaks correspond to places you visit the most often (e.g. house, work, school...).
  
I created this visualization while reading J.B. Harley, a historian of cartography whose thorough consideration of maps as socially-constructed agents of power (beginning in the 15th century with European colonialism) aptly applies to contemporary digital cartography.  
  
In short, we can no longer think of Google Maps as an objective representation of the Earth’s surface, but rather as a tool of surveillance capitalism where paid advertisements on the map ultimately influence consumer decisions and travel directions. Through this virtual terrain, I hoped to give material form to these hidden landscapes of power.  

## Instructions  
### Your Location Data  
1. Go to [Google Takeout](https://takeout.google.com/?pli=1) and download "Location History".  
2. Wait till your download is ready.  
3. Unzip folder  
4. Open Takeout > Location History, and upload 'Location History.json' into the input box  
  
**Privacy Note** The app does not store any of your data. It attempts to use your browser's location (assuming you've enabled this in system preferences) at the beginning to start the map in a convenient spot.  
  
### Navigating the Scene  
Use the mini-map to find a location to visualize. **Click** a spot on the mini-map to move the visualization to those coordinates.

## Code  
I created this app using [three.js](https://threejs.org/), shaders, [Mappa.js](https://mappa.js.org/), and Mapbox. I found [this shader height map example](https://stemkoski.github.io/Three.js/Shader-Heightmap-Textures.html) and this [custom shader attribute / displacement example](https://threejs.org/examples/webgl_custom_attributes.html) useful. 