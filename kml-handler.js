// Parser de KML e handler para Leaflet

async function loadKMLFile() {
    try {
        const response = await fetch('BRASIL.kml');
        const kmlText = await response.text();
        return parseKML(kmlText);
    } catch (error) {
        console.error('Erro ao carregar arquivo KML:', error);
        return null;
    }
}

function parseKML(kmlText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(kmlText, 'text/xml');
    
    if (xmlDoc.parseError) {
        console.error('Erro ao fazer parse do KML:', xmlDoc.parseError);
        return null;
    }

    const placemarks = xmlDoc.getElementsByTagName('Placemark');
    const features = [];

    for (let i = 0; i < placemarks.length; i++) {
        const placemark = placemarks[i];
        
        // Extrair nome
        const nameElement = placemark.getElementsByTagName('name')[0];
        const name = nameElement ? nameElement.textContent : 'Unknown';

        // Extrair coordenadas (Polygon ou Point)
        let coordinates = null;
        let featureType = null;

        // Tentar extrair Polygon (para estados/regiões)
        const polygonElement = placemark.getElementsByTagName('Polygon')[0];
        if (polygonElement) {
            featureType = 'Polygon';
            const outerBoundaryElement = polygonElement.getElementsByTagName('outerBoundaryIs')[0];
            if (outerBoundaryElement) {
                const linearRingElement = outerBoundaryElement.getElementsByTagName('LinearRing')[0];
                if (linearRingElement) {
                    const coordinatesElement = linearRingElement.getElementsByTagName('coordinates')[0];
                    if (coordinatesElement) {
                        coordinates = parseCoordinates(coordinatesElement.textContent);
                    }
                }
            }
        }

        // Tentar extrair Point (para cidades)
        const pointElement = placemark.getElementsByTagName('Point')[0];
        if (pointElement && !coordinates) {
            featureType = 'Point';
            const coordinatesElement = pointElement.getElementsByTagName('coordinates')[0];
            if (coordinatesElement) {
                coordinates = parseCoordinates(coordinatesElement.textContent);
            }
        }

        if (coordinates) {
            features.push({
                name: name,
                type: featureType,
                coordinates: coordinates
            });
        }
    }

    console.log(`KML carregado: ${features.length} features encontradas`);
    return features;
}

function parseCoordinates(coordinatesText) {
    const coords = [];
    const lines = coordinatesText.trim().split('\n');

    for (const line of lines) {
        const parts = line.trim().split(',');
        if (parts.length >= 2) {
            const lng = parseFloat(parts[0]);
            const lat = parseFloat(parts[1]);
            if (!isNaN(lng) && !isNaN(lat)) {
                coords.push([lat, lng]); // Leaflet usa [lat, lng]
            }
        }
    }

    return coords.length > 0 ? coords : null;
}

function addKMLToMap(map, features, activeData) {
    if (!features) return;

    // Criar um mapa de cidades ativas por estado
    const stateData = {};
    
    activeData.forEach(item => {
        // Você pode adicionar estado aos dados ou detectar por cidade
        // Por enquanto, vamos visualizar os polígonos dos estados
    });

    // Adicionar polígonos (estados) ao mapa
    features.forEach(feature => {
        if (feature.type === 'Polygon' && feature.coordinates.length > 2) {
            const polygon = L.polygon(feature.coordinates, {
                color: '#5a5fff',
                weight: 2,
                opacity: 0.5,
                fillOpacity: 0.2,
                fillColor: '#5a5fff'
            });

            polygon.bindPopup(`<strong>${feature.name}</strong>`);
            polygon.addTo(map);
        }
    });

    console.log('KML renderizado no mapa');
}

// Exportar funções para uso global
window.loadKMLFile = loadKMLFile;
window.addKMLToMap = addKMLToMap;
