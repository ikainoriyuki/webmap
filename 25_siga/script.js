// script.js
document.addEventListener('DOMContentLoaded', function() {
  // Ensure map and lc are available from map_init.js
  const map = window.map;
  const lc = window.lc;

  // --- 座標表示 ---
      // DOM要素の取得
    const mapCenterLatElement = document.getElementById('mapCenterLat');
    const mapCenterLngElement = document.getElementById('mapCenterLng');
    const mapCenterElevationElement = document.getElementById('mapCenterElevation');
    const currentLatElement = document.getElementById('currentLat');
    const currentLngElement = document.getElementById('currentLng');
    const currentElevationElement = document.getElementById('currentElevation');
    const distanceElement = document.getElementById('distance');
    const elevationDifferenceElement = document.getElementById('elevationDifference');

    // 位置情報と標高を格納する変数
    let currentLocation = null;
    let mapCenterLocation = null;

    

    // 標高の取得とコールバック関数
    function updateElevation(lat, lng, element, callback) {
        const elevationUrl = `https://cyberjapandata2.gsi.go.jp/general/dem/scripts/getelevation.php?lon=${lng}&lat=${lat}`;

        fetch(elevationUrl)
            .then(response => response.json())
            .then(data => {
                const elevation = data.elevation;
                if (elevation !== undefined) {
                    element.textContent = elevation.toFixed(2);
                    if (callback) callback(elevation);
                } else {
                    element.textContent = 'N/A';
                    if (callback) callback(null);
                }
            })
            .catch(error => {
                console.error('Error fetching elevation data:', error);
                element.textContent = 'Error';
                if (callback) callback(null);
            });
    }

    // 距離と標高差の計算と表示
    function updateCalculations() {
      if (currentLocation && currentLocation.elevation !== null && mapCenterLocation && mapCenterLocation.elevation !== null) {
        // LeafletのdistanceTo()メソッドで距離を計算（メートル）
        const distanceMeters = L.latLng(currentLocation.lat, currentLocation.lng).distanceTo(L.latLng(mapCenterLocation.lat, mapCenterLocation.lng));
        // 標高差を計算
        const elevationDifference = mapCenterLocation.elevation - currentLocation.elevation;

        distanceElement.textContent = `${(distanceMeters).toFixed(0)} m`;
        elevationDifferenceElement.textContent = `${elevationDifference.toFixed(0)} m`;
      }
    }

    // 地図の中心情報を更新
    function updateMapCenter() {
      const center = map.getCenter();
      mapCenterLocation = { lat: center.lat, lng: center.lng, elevation: null };
      mapCenterLatElement.textContent = center.lat.toFixed(5);
      mapCenterLngElement.textContent = center.lng.toFixed(5);
      updateElevation(center.lat, center.lng, mapCenterElevationElement, (elevation) => {
          mapCenterLocation.elevation = elevation;
          updateCalculations();
      });
    }

    // 現在地情報を更新
    function updateCurrentLocation(e) {
        const { lat, lng } = e.latlng;
        currentLocation = { lat, lng, elevation: null };
        currentLatElement.textContent = lat.toFixed(5);
        currentLngElement.textContent = lng.toFixed(5);
        updateElevation(lat, lng, currentElevationElement, (elevation) => {
            currentLocation.elevation = elevation;
            updateCalculations();
        });
    }

    // イベントリスナーの設定
    map.on('moveend', updateMapCenter);
    map.on('locationfound', (e) => {
        updateCurrentLocation(e);
        updateMapCenter(); // 現在地が取得されたら、地図の中心情報も更新
    });


    // ページロード時に一度だけ実行
    updateMapCenter();

  // マーカーを保存記録する配列
  let poiArray = [];

  function getPreviousPOINumber() {
    if (poiArray.length === 0) return 0;
    const lastPOI = poiArray[poiArray.length - 1];
    return typeof lastPOI.number === 'number' ? lastPOI.number : 0;
  }

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

    const previousNumber = getPreviousPOINumber();
    const suggestedNumber = previousNumber + 1;

    let numberInput = prompt(`この場所の番号を入力してください（候補: ${suggestedNumber}）:`, suggestedNumber);
    let number = parseInt(numberInput, 10);

    if (isNaN(number)) {
      alert("有効な番号を入力してください。");
      return;
    }

    let description = prompt("この場所の説明を入力してください（空欄でもOK）:");
    if (description === null) {
      return;
    }

    let newPOI = {
      latlng: markerLatLng,
      timestamp: new Date(),
      positioning: "GNSS-based",
      number: number,
      description: description.trim()
    };

    poiArray.push(newPOI);
    addMarker(newPOI, true);
    savePOIArray();
  }

  function saveMapCenterLocation() {
    const center = map.getCenter();

    const previousNumber = getPreviousPOINumber();
    const suggestedNumber = previousNumber + 1;

    // 番号入力（候補付き）
    let numberInput = prompt(`この場所の番号を入力してください（数値のみ）`, suggestedNumber);
    let number = parseInt(numberInput, 10);

    if (isNaN(number)) {
      alert("有効な番号を入力してください。");
      return;
    }

    // 説明入力（空でもOK）
    let description = prompt("この場所の説明を入力してください（空欄でもOK）:");
    if (description === null) {
      // キャンセルされた場合は中断
      return;
    }

    let newPOI = {
      latlng: center,
      timestamp: new Date(),
      positioning: "map-center",
      number: number,
      description: description.trim() // 空欄でもOK
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
    return `<div class="popup-content">時間: ${poi.timestamp.toLocaleDateString()}_${poi.timestamp.toLocaleTimeString()}<br>測位: ${poi.positioning}<br>番号: ${poi.number}<br>属性: ${poi.description}</div>` +
      `<br><button id='edit-btn' class='edit-button'>編集</button> <button id='delete-btn' class='delete-button'>削除</button>`;
  }

  function editPOI(poi, marker) {
    // 番号の編集（現在の番号を初期値として表示）
    let numberInput = prompt("新しい番号を入力してください:", poi.number);
    let newNumber = parseInt(numberInput, 10);

    if (isNaN(newNumber)) {
      alert("有効な番号が入力されなかったため、番号は変更されません。");
      newNumber = poi.number; // 元の番号を保持
    }

    // 説明の編集（現在の説明を初期値として表示）
    let newDescription = prompt("新しい説明を入力してください（空欄でもOK）:", poi.description);
    if (newDescription === null) {
      // キャンセルされた場合は中断
      return;
    }

    // 更新処理
    poi.number = newNumber;
    poi.description = newDescription.trim();
    marker.setPopupContent(createPopupContent(poi));
    savePOIArray();
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
        <name>${poi.number}</name>
        <desc>${poi.description}</desc>
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
          <name>${poi.number}</name>
          <TimeStamp><when>${poi.timestamp.toISOString()}</when></TimeStamp>
          <description>${poi.description}</description>
          <ExtendedData>
            <Data name="positioning">
              <value>${poi.positioning}</value>
            </Data>
          </ExtendedData>
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
          number: poi.number || null,
          description: poi.description || "",
          positioning: poi.positioning || "unknown",
          timestamp: poi.timestamp.toISOString()
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

  // 目的地データの手動読み込み
  document.getElementById('loadGeoJSON').addEventListener('click', function() {
    document.getElementById('fileInput').click();
  });

  let geojsonLayer;
  let geojsonLayers = []; // ← 複数レイヤーを格納
  // ポリゴン・ライン用ラベルの管理
  let polygonTooltips = []; 

  document.getElementById('fileInput').addEventListener('change', function(event) {
    let file = event.target.files[0];
    if (!file) { return; }

    let reader = new FileReader();
    reader.onload = function(e) {
      let fileName = file.name.toLowerCase();
      let fileContent = e.target.result;

      let geoJSONOptions = {
        onEachFeature: handleFeature,
        // ポイントのスタイル
        pointToLayer: function (feature, latlng) {
          return L.circleMarker(latlng, {
            radius: 6,
            fillColor: '#ffffffff',
            color: '#00eeffff',
            weight: 1,
            opacity: 1,
          });
        },

        // ポリゴンとラインのスタイル
        style: function (feature) {
          return {
            color: '#00eeffff',       // 線の色
            weight: 2,              // 線の太さ
            fill: false,
          };
        }
      };

      try {
        if (fileName.endsWith('.geojson') || fileName.endsWith('.json')) {
          const geojsonData = JSON.parse(fileContent);
          geojsonLayer = L.geoJSON(geojsonData, geoJSONOptions);
          geojsonLayer.addTo(map);
          geojsonLayers.push(geojsonLayer); // レイヤ管理（複数ファイルをまとめる）
          map.fitBounds(geojsonLayer.getBounds());

          // ラベルの読み込み
          const keys = extractPropertyKeys(geojsonData);
          populateLabelAttrOptions(keys);

        } else if (fileName.endsWith('.kml')) {
          geojsonLayer = omnivore.kml.parse(fileContent, null, L.geoJSON(null, geoJSONOptions));
          geojsonLayer.addTo(map);
          geojsonLayers.push(geojsonLayer); // レイヤ管理（複数ファイルをまとめる）
          map.fitBounds(geojsonLayer.getBounds());

          // ラベルの読み込み
          const geojsonData = geojsonLayer.toGeoJSON();
          const keys = extractPropertyKeys(geojsonData);
          populateLabelAttrOptions(keys);

        } else if (fileName.endsWith('.gpx')) {
          geojsonLayer = omnivore.gpx.parse(fileContent, null, L.geoJSON(null, geoJSONOptions));
          geojsonLayer.addTo(map);
          geojsonLayers.push(geojsonLayer); // レイヤ管理（複数ファイルをまとめる）
          map.fitBounds(geojsonLayer.getBounds());

          // ラベルの読み込み
          const geojsonData = geojsonLayer.toGeoJSON();
          const keys = extractPropertyKeys(geojsonData);
          populateLabelAttrOptions(keys);

        } else {
          alert('GeoJSON (.geojson, .json), KML (.kml), または GPX (.gpx) ファイルを選択してください。');
          return;
        }

      } catch (error) {
        alert('ファイルの解析に失敗しました。');
        console.error('File parse error:', error);
      }
          };
          reader.readAsText(file);
  });

  // 各フィーチャーの処理を行う共通関数
  function handleFeature(feature, layer) {
    let props = feature.properties;

    // ポップアップの設定
    if (props) {
      let popupContent = Object.entries(props)
        .map(([key, val]) => `<strong>${key}</strong>: ${val}`)
        .join('<br>');
      layer.bindPopup(popupContent);
    }
  }

  // 属性一覧の取得
  function extractPropertyKeys(geojsonData) {
    const keysSet = new Set();

    geojsonData.features.forEach(feature => {
      if (feature.properties) {
        Object.keys(feature.properties).forEach(key => keysSet.add(key));
      }
    });

    return Array.from(keysSet);
  }

  // ラベル属性の選択肢を更新
  function populateLabelAttrOptions(keys) {
    const select = document.getElementById('labelAttr');
    select.innerHTML = ''; // 既存の選択肢をクリア

    keys.forEach(key => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = key;
      select.appendChild(option);
    });
  }

  // 選択されたラベル属性を取得
  function getSelectedLabelAttr() {
    return document.getElementById('labelAttr').value;
  }

  document.getElementById('applyLabel').addEventListener('click', function () {
  if (!geojsonLayer) {
    alert('先にGeoJSONを読み込んでください。');
    return;
  }

  const labelAttr = getSelectedLabelAttr();

  // 既存ツールチップの初期化（すべてのフィーチャー）
  geojsonLayer.eachLayer(layer => {
    if (layer._customTooltip) {
      map.removeLayer(layer._customTooltip);
      layer._customTooltip = null;
    }
    if (layer.getTooltip()) {
      layer.unbindTooltip();
    }
  });

  // ラベル描画（統一処理）
  geojsonLayer.eachLayer(function (layer) {
    const feature = layer.feature;
    const props = feature?.properties;
    const labelText = String(props?.[labelAttr] ?? '').trim();
    if (!labelText) return;

    let latlng;
    const geomType = feature.geometry.type;

    if (geomType === 'Point') {
      latlng = layer.getLatLng();
    } else {
      const centerPoint = turf.pointOnFeature(feature);
      const coords = centerPoint.geometry.coordinates;
      latlng = L.latLng(coords[1], coords[0]);
    }

    const tooltip = L.tooltip({
      permanent: true,
      direction: geomType === 'Point' ? 'right' : 'center',
      className: 'my-label-tooltip'
    })
      .setContent(labelText)
      .setLatLng(latlng)
      .addTo(map);

    // レイヤーに紐づけて保存
    layer._customTooltip = tooltip;
  });
});

  // 読み込んだデータのクリア

  document.getElementById('clearGeojson').addEventListener('click', () => {
    if (!geojsonLayer) {
      alert('表示中のデータはありません。');
      return;
    }

    const confirmDelete = window.confirm('すべてのレイヤーを削除してもよろしいですか？');

  if (confirmDelete) {
    geojsonLayers.forEach(geojsonLayer => {
      geojsonLayer.eachLayer(layer => {
        // ポリゴン・ライン用のラベル（_customTooltip）
        if (layer._customTooltip) {
          map.removeLayer(layer._customTooltip);
          layer._customTooltip = null;
        }

        // ポイント用のラベル（bindTooltip）
        if (layer.getTooltip()) {
          layer.unbindTooltip();
        }
      });

      // GeoJSONレイヤー自体の削除
      map.removeLayer(geojsonLayer);
    });


      geojsonLayers = []; // ← 配列を空に
      alert('すべてのレイヤーを削除しました。');
    }
    // ポリゴン・ライン用ラベルの削除
    polygonTooltips.forEach(tooltip => map.removeLayer(tooltip));
    polygonTooltips = [];

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