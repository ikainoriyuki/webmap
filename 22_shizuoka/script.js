// script.js
document.addEventListener('DOMContentLoaded', function() {
  // Ensure map and lc are available from map_init.js
  const map = window.map;
  const lc = window.lc;

  // --- 座標表示 ---
  // ----- 地図中心（プラスマーク）の座標を表示 -----
  const mapCenterLatElement = document.getElementById('mapCenterLat');
  const mapCenterLngElement = document.getElementById('mapCenterLng');
  const mapCenterElevationElement = document.getElementById('mapCenterElevation');

  function mapCenterPosition() {
    let mapCenter = map.getCenter();
    let centerlat = mapCenter.lat;
    let centerlng = mapCenter.lng;

    mapCenterLatElement.textContent = centerlat.toFixed(5);
    mapCenterLngElement.textContent = centerlng.toFixed(5);

    updateElevation(centerlat, centerlng, mapCenterElevationElement);
  }

  map.on('moveend', mapCenterPosition);
  mapCenterPosition();

  // ----- 現在地の座標表示 -----
  const currentLatElement = document.getElementById('currentLat');
  const currentLngElement = document.getElementById('currentLng');
  const currentElevationElement = document.getElementById('currentElevation');

  map.on('locationfound', (e) => {
    let currentLat = e.latlng.lat;
    let currentLng = e.latlng.lng;

    document.getElementById('currentLat').textContent = currentLat.toFixed(5);
    document.getElementById('currentLng').textContent = currentLng.toFixed(5);

    updateElevation(currentLat, currentLng, currentElevationElement);
  });

  // ----- 標高の取得 -----
  function updateElevation(lat, lng, element) {
    let elevationUrl = 'https://cyberjapandata2.gsi.go.jp/general/dem/scripts/getelevation.php?lon=' + lng + '&lat=' + lat;

    fetch(elevationUrl)
      .then(response => response.json())
      .then(data => {
        if (data && data.elevation !== undefined) {
          let elevation = data.elevation;
          element.textContent = elevation.toFixed(2);
        } else {
          console.error('Elevation data is not available.');
          element.textContent = 'N/A';
        }
      })
      .catch(error => {
        console.error('Error fetching elevation data:', error);
        element.textContent = 'Error';
      });
  }

  // マーカーを保存記録する配列
  let poiArray = [];

  function loadPOIArray() {
    const savedPOIArray = localStorage.getItem('poiArray');
    if (savedPOIArray) {
      poiArray = JSON.parse(savedPOIArray);
      poiArray.forEach(poi => {
        if (typeof poi.timestamp === 'string') {
          poi.timestamp = new Date(poi.timestamp);
        }
        addMarker(poi);
      });
    }
  }

  function savePOIArray() {
    const poiArrayToSave = poiArray.map(poi => ({
      ...poi,
      timestamp: poi.timestamp.toISOString()
    }));
    localStorage.setItem('poiArray', JSON.stringify(poiArrayToSave));
  }

  function saveCurrentLocation() {
    const markerLatLng = lc._marker.getLatLng();

    if (!markerLatLng) {
      alert("現在地が取得されていません。まずは現在地を表示してください。");
      return;
    }

    let description = prompt("この場所の説明を入力してください:");

    let newPOI = {
      latlng: markerLatLng,
      timestamp: new Date(),
      positioning: "GNSS-based",
      description: description
    };
    poiArray.push(newPOI);

    addMarker(newPOI, true);
    savePOIArray();
  }

  function saveMapCenterLocation() {
    const center = map.getCenter();
    let description = prompt("この場所の説明を入力してください:");

    let newPOI = {
      latlng: center,
      timestamp: new Date(),
      positioning: "non-GNSS-based",
      description: description
    };
    poiArray.push(newPOI);

    addMarker(newPOI, true);
    savePOIArray();
  }

  function addMarker(poi, showPopup = false) {
    let marker = L.marker(poi.latlng).addTo(map)
      .bindPopup(createPopupContent(poi));

    function attachListeners() {
      document.getElementById('edit-btn').addEventListener('click', function() {
        editPOI(poi, marker);
      });

      document.getElementById('delete-btn').addEventListener('click', function() {
        if (confirm("このマーカーを本当に削除しますか？")) {
          deletePOI(poi, marker);
        }
      });
    }

    if (showPopup) {
      marker.openPopup();
      setTimeout(attachListeners, 100);
    }

    marker.on('popupopen', attachListeners);
  }

  function createPopupContent(poi) {
    return `<div class="popup-content">時間: ${poi.timestamp.toLocaleDateString()}_${poi.timestamp.toLocaleTimeString()}<br>測位: ${poi.positioning}<br>属性: ${poi.description}</div>` +
      `<br><button id='edit-btn' class='edit-button'>編集</button> <button id='delete-btn' class='delete-button'>削除</button>`;
  }

  function editPOI(poi, marker) {
    let newDescription = prompt("新しい説明を入力してください:", poi.description);
    if (newDescription !== null) {
      poi.description = newDescription;
      marker.setPopupContent(createPopupContent(poi));
      savePOIArray();
    }
  }

  function deletePOI(poi, marker) {
    let index = poiArray.indexOf(poi);
    if (index > -1) {
      poiArray.splice(index, 1);
      map.removeLayer(marker);
      savePOIArray();
    }
  }

  function clearLocalStorage() {
    if (confirm("すべてのデータを削除しますか？")) {
      localStorage.removeItem('poiArray');
      poiArray = [];
      map.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });
      alert("データが削除されました。");
    }
  }

  window.onload = function() {
    loadPOIArray();
  };

  //--- エクスポート ---
  function createFileName() {
    let now = new Date();
    let year = now.getFullYear();
    let month = ('0' + (now.getMonth() + 1)).slice(-2);
    let day = ('0' + now.getDate()).slice(-2);
    let hours = ('0' + now.getHours()).slice(-2);
    let minutes = ('0' + now.getMinutes()).slice(-2);
    let seconds = ('0' + now.getSeconds()).slice(-2);
    return `${year}${month}${day}_${hours}${minutes}${seconds}_locations`;
  }

  function downloadFile(content, fileName, contentType) {
    let blob = new Blob([content], { type: contentType });
    let a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
  }

  function exportToGPX() {
    if (poiArray.length === 0) {
      alert("保存された現在地がありません！");
      return;
    }

    let gpxHeader = `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
      <gpx version="1.1" creator="Noriyuki IKAI" xmlns="http://www.topografix.com/GPX/1/1">
      <trk><name>Saved Locations</name><trkseg>\n`;

    let gpxFooter = `</trkseg></trk></gpx>`;

    let gpxBody = poiArray.map(poi => `
      <trkpt lat="${poi.latlng.lat}" lon="${poi.latlng.lng}">
        <time>${poi.timestamp.toISOString()}</time>
        <name>${poi.description}</name>
        <src>${poi.positioning}</src>
      </trkpt>`).join("\n");

    let gpxContent = gpxHeader + gpxBody + gpxFooter;
    let fileName = createFileName() + ".gpx";

    downloadFile(gpxContent, fileName, "application/gpx+xml");
  }

  function exportToKML() {
    if (poiArray.length === 0) {
      alert("保存された現在地がありません！");
      return;
    }

    let kmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
      <kml xmlns="http://www.opengis.net/kml/2.2">
      <Document>
        <name>Saved Locations</name>\n`;

    let kmlFooter = `</Document></kml>`;

    let kmlBody = poiArray.map(poi => `
        <Placemark>
          <name>${poi.description}</name>
          <TimeStamp><when>${poi.timestamp.toISOString()}</when></TimeStamp>
          <description>${poi.positioning}</description>
          <Point>
            <coordinates>${poi.latlng.lng},${poi.latlng.lat}</coordinates>
          </Point>
        </Placemark>`).join("\n");

    let kmlContent = kmlHeader + kmlBody + kmlFooter;
    let fileName = createFileName() + ".kml";

    downloadFile(kmlContent, fileName, "application/vnd.google-earth.kml+xml");
  }

  function exportToGeoJSON() {
    if (poiArray.length === 0) {
      alert("保存された現在地がありません！");
      return;
    }

    let geojson = {
      type: "FeatureCollection",
      features: poiArray.map(poi => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [poi.latlng.lng, poi.latlng.lat]
        },
        properties: {
          name: poi.description,
          time: poi.timestamp.toISOString(),
          src: poi.positioning
        }
      }))
    };

    let geojsonContent = JSON.stringify(geojson, null, 2);
    let fileName = createFileName() + ".geojson";

    downloadFile(geojsonContent, fileName, "application/geo+json");
  }

  // スライドメニューの追加
  const toggleBtn = document.querySelector('.toggleBtn');
  const menu = document.querySelector('.menu');
  const closeBtn = document.querySelector('.closeBtn');
  let menuOpen = false;

  toggleBtn.addEventListener('click', () => {
    menuOpen = !menuOpen;
    menu.classList.toggle('open', menuOpen);
    toggleBtn.style.display = menuOpen ? 'none' : 'block';
  });

  closeBtn.addEventListener('click', () => {
    menuOpen = false;
    menu.classList.remove('open');
    toggleBtn.style.display = 'block';
  });

  //geojsonの手動読み込み
  document.getElementById('loadGeoJSON').addEventListener('click', function() {
    document.getElementById('fileInput').click();
  });

  document.getElementById('fileInput').addEventListener('change', function(event) {
    let file = event.target.files[0];
    let reader = new FileReader();
    reader.onload = function(e) {
      let geojsonData = JSON.parse(e.target.result);
      L.geoJSON(geojsonData).addTo(map);
    };
    reader.readAsText(file);
  });

  const exportGpxBtn = document.querySelector('#exportGpxBtn');
  const exportKmlBtn = document.querySelector('#exportKmlBtn');
  const exportGeoJSONBtn = document.querySelector('#exportGeoJSONBtn');
  const allClearBtn = document.querySelector('#allClearBtn');

  exportGpxBtn.addEventListener('click', () => {
    exportToGPX();
  });
  exportKmlBtn.addEventListener('click', () => {
    exportToKML();
  });
  exportGeoJSONBtn.addEventListener('click', () => {
    exportToGeoJSON();
  });

  allClearBtn.addEventListener('click', () => {
    clearLocalStorage();
  });

  document.getElementById('saveBtn').onclick = saveCurrentLocation;
  document.getElementById('saveCenterBtn').onclick = saveMapCenterLocation;
});