const map = L.map('map', {
  // サイトを開いたときの地図の中心座標とそのときのズームレベル（縮尺）
  center: [36.695265,137.211305],
  zoom: 13,
});

const baseLayers = {
  OpenStreetMap: L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      minZoom: 1,
      maxNativeZoom: 20,
      maxZoom: 20,
      tms: false,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  ),
  地理院地図: L.tileLayer(
    'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png',
    {
      minZoom: 5,
      maxNativeZoom: 18,
      maxZoom: 20,
      tms: false,
      attribution:
        '<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>',
    },
  ),
  空中写真_国土地理院: L.tileLayer(
    'https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg',
    {
      minZoom: 5,
      maxZoom: 20,
      maxNativeZoom: 17,
      tms: false,
      attribution:
        '<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>',
    },
  ),
  過去写真_1974_1979: L.tileLayer(
    'https://cyberjapandata.gsi.go.jp/xyz/gazo1/{z}/{x}/{y}.jpg',
    {
      minZoom: 5,
      maxZoom: 20,
      maxNativeZoom: 17,
      tms: false,
      attribution:
        '<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>',
    },
  ),
  // 微地形図
  赤色立体図: L.tileLayer(
    'https://rinya-toyama.geospatial.jp/tile/rinya/2024/rrimap/{z}/{x}/{y}.png',
    {
      minZoom: 14,
      maxNativeZoom: 18,
      maxZoom: 20,
      tms: false,
      attribution: '<a href="https://www.geospatial.jp/ckan/dataset?organization=tochigipref-shinrin-seibi">栃木県「微地形図（CS立体図）」</a>',
    },
  ),
  // 林相図
  林相識別図: L.tileLayer(
    'https://forestgeo.info/opendata/16_toyama/ls_standtype_2021/{z}/{x}/{y}.webp',
    {
      minZoom: 14,
      maxNativeZoom: 18,
      maxZoom: 20,
      tms: false,
      attribution: '<a href="https://www.geospatial.jp/ckan/dataset/rinya-toyama-maptiles">富山県・林相識別図（2021）林野庁加工</a>',
    },
  ),
};

// 最初に表示される地図を地理院地図にする
map.addLayer(baseLayers['地理院地図']);

// レイヤコントロールを追加する変数
const layersControl = L.control.layers(baseLayers, [], ).addTo(map);

// ベクターデータの追加
// ポリゴンの読み込み
const polygonUrl = "./polygon.geojson";
// ラインの読み込み
const lineUrl = "./line.geojson";
// ポイントの読み込み
const pointUrl = "./point.geojson";


const colorDict = {
    1: 'green', 
    2: 'blue',
    3: 'red',
};

// ポリゴンの読み込みと処理
  fetch(polygonUrl)
  .then((res) => {
    if (!res.ok) {
      throw new Error('ポリゴンのGeoJSONの取得に失敗しました');
    }
    return res.json();
  })
  .then((json) => {
    // LayerGroupを作成
    const polygonLayerGroup = L.layerGroup();

    const polygons = L.geoJSON(json, {
      style: (feature) => ({
        color: "orange",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.2,
      }),
      onEachFeature: (feature, layer) => {
        if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
          // ポリゴンをLayerGroupに追加
          polygonLayerGroup.addLayer(layer);

          // ポリゴンの中央座標を計算
          const midpoint = turf.pointOnFeature(feature);
          const midLat = midpoint.geometry.coordinates[1];
          const midLng = midpoint.geometry.coordinates[0];

          // ラベルを作成してLayerGroupに追加
          const label = L.marker([midLat, midLng], {
            icon: L.divIcon({
              className: 'label',
              html: feature.properties.name,
              iconSize: [100, 40],
            }),
          });
          polygonLayerGroup.addLayer(label);
        }
      },
    });

    // LayerGroupをマップに追加
    polygonLayerGroup.addTo(map);

    // LayersControlにLayerGroupを追加
    layersControl.addOverlay(polygonLayerGroup, 'ポリゴン');
  })
  .catch((error) => {
    console.error(error);
  });

  // ラインの読み込み
  fetch(lineUrl)
  .then((res) => {
    if (!res.ok) {
      throw new Error('ラインのGeoJSONの取得に失敗しました');
    }
    return res.json();
  })
  .then((json) => {
    // LayerGroupを作成
    const lineLayerGroup = L.layerGroup();

    const lines = L.geoJSON(json, {
      style: (feature) => ({
        color: "green",
      }),
      onEachFeature: (feature, layer) => {
        if (feature.geometry.type === 'LineString') {
          // ラインをLayerGroupに追加
          lineLayerGroup.addLayer(layer);

          // ラインの中央座標を計算
          const midpoint = turf.pointOnFeature(feature);
          const midLat = midpoint.geometry.coordinates[1];
          const midLng = midpoint.geometry.coordinates[0];

          // ラベルを作成してLayerGroupに追加
          const label = L.marker([midLat, midLng], {
            icon: L.divIcon({
              className: 'label',
              html: feature.properties.name,
              iconSize: [100, 40],
            }),
          });
          lineLayerGroup.addLayer(label);
        }
      },
    });

    // LayerGroupをマップに追加
    lineLayerGroup.addTo(map);

    // LayersControlにLayerGroupを追加
    layersControl.addOverlay(lineLayerGroup, 'ライン');
  })
  .catch((error) => {
    console.error(error);
  });

// ポイントの読み込みと処理
fetch(pointUrl)
  .then((res) => {
    if (!res.ok) {
      throw new Error('ポイントのGeoJSONの取得に失敗しました');
    }
    return res.json();
  })
  .then((json) => {
    const pointlayerGroup = L.layerGroup();

    json.features.forEach(feature => {
      
      const coords = feature.geometry.coordinates;

      // マーカーを追加
      const marker = L.marker([coords[1], coords[0]], {
        icon: L.divIcon({
          className: 'makerPoint',
        }),
      });
      pointlayerGroup.addLayer(marker);

      // ラベルを追加
      const label = L.marker([coords[1], coords[0]], {
        icon: L.divIcon({
          className: 'labelPoint',
          html: feature.properties.name,
        }),
      });
      pointlayerGroup.addLayer(label);
    });

    pointlayerGroup.addTo(map);
    layersControl.addOverlay(pointlayerGroup, 'ポイント');
  })
  .catch((error) => {
      console.error(error);
  });


  // L.controlのオプション
  let option = {
    enableHighAccuracy: true,  
    watch: true,
    position: 'topright',      // コントロールの位置
    drawCircle: true,          // 精度範囲を円で表示
    follow: true,              // ユーザーの位置を追従
    keepCurrentZoomLevel: true, 
    locateOptions: {
      maxZoom: 20
    }
  }

  
  // 現在地の取得と表示
  let lc = L.control.locate(option).addTo(map);
  // 地図を開いたときに、現在地を中心に表示する
  lc.start();
  
  
  // スケールバー  
  L.control.scale({maxwidth: 200, position: 'bottomright', imperial: false }).addTo(map);


  // 座標表示
  // 地図中心（プラスマーク）の座標を表示
  const mapCenterLatElement = document.getElementById('mapCenterLat');
  const mapCenterLngElement = document.getElementById('mapCenterLng');
  const mapCenterElevationElement = document.getElementById('mapCenterElevation');

  // 地図中心の座標と標高を取得・表示
  function mapCenterPosition() {
    let mapCenter = map.getCenter();
    let centerlat = mapCenter.lat;
    let centerlng = mapCenter.lng;

    // DOM 要素に緯度・経度を更新
    mapCenterLatElement.textContent = centerlat.toFixed(5);
    mapCenterLngElement.textContent = centerlng.toFixed(5);

    // 標高を取得して表示
    updateElevation(centerlat, centerlng, mapCenterElevationElement);
  }

  // mapが動いたら、座標を再取得する
  map.on('moveend', mapCenterPosition);

  // 初期表示のために一度呼び出す
  mapCenterPosition();


  // 現在地の座標表示
  const currentLatElement = document.getElementById('currentLat');
  const currentLngElement = document.getElementById('currentLng');
  const currentElevationElement = document.getElementById('currentElevation'); 
  
  // 現在地が更新されたときのイベントハンドラ
  map.on('locationfound', (e) => {
    let currentLat = e.latlng.lat;
    let currentLng = e.latlng.lng;

    // DOM 要素に緯度・経度を更新
    document.getElementById('currentLat').textContent = currentLat.toFixed(5);
    document.getElementById('currentLng').textContent = currentLng.toFixed(5);

    // 標高を取得して表示
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
        element.textContent = elevation.toFixed(2); // 引数で渡された要素に表示
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

// ローカルストレージからPOI配列を読み込む
function loadPOIArray() {
  const savedPOIArray = localStorage.getItem('poiArray');
  if (savedPOIArray) {
    poiArray = JSON.parse(savedPOIArray);
    poiArray.forEach(poi => {
      // タイムスタンプが文字列の場合、Dateオブジェクトに変換
      if (typeof poi.timestamp === 'string') {
        poi.timestamp = new Date(poi.timestamp);
      }
      addMarker(poi); // マーカーを復元
    });
  }
}

// ローカルストレージにPOI配列を保存する
function savePOIArray() {
  const poiArrayToSave = poiArray.map(poi => ({
    ...poi,
    timestamp: poi.timestamp.toISOString()
  }));
  localStorage.setItem('poiArray', JSON.stringify(poiArrayToSave));
}

// 現在位置をマーカーとして登録
function saveCurrentLocation() {
  const markerLatLng = lc._marker.getLatLng(); // 現在表示されているマーカーの座標を取得

  if (!markerLatLng) {
    alert("現在地が取得されていません。まずは現在地を表示してください。");
    return;
  }

  // 属性を入力するためのプロンプトを表示
  let description = prompt("この場所の説明を入力してください:");

  let newPOI = {
    latlng: markerLatLng,
    timestamp: new Date(),
    positioning: "current-position",
    description: description
  };
  poiArray.push(newPOI);

  // マーカーを追加し、属性をポップアップに表示
  addMarker(newPOI, true); // ポップアップを表示するために引数を追加

  // ローカルストレージに保存
  savePOIArray();
}

// マップセンターをマーカーとして登録
function saveMapCenterLocation() {
  // 中心座標を取得
  const center = map.getCenter();

  // 属性を入力するためのプロンプトを表示
  let description = prompt("この場所の説明を入力してください:");

  let newPOI = {
    latlng: center,
    timestamp: new Date(),
    positioning: "map-center",
    description: description
  };
  poiArray.push(newPOI);

  // マーカーを追加し、属性をポップアップに表示
  addMarker(newPOI, true); // ポップアップを表示するために引数を追加

  // ローカルストレージに保存
  savePOIArray();
  };

  // マーカーを追加し、編集・削除ボタンを設定
  function addMarker(poi, showPopup = false) {
    let marker = L.marker(poi.latlng).addTo(map)
      .bindPopup(createPopupContent(poi));

    // イベントリスナーを追加
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
      // ポップアップが完全に表示された後にイベントリスナーを追加
      setTimeout(attachListeners, 100);
    }

    marker.on('popupopen', attachListeners);
  }

  // ポップアップの内容を作成
  function createPopupContent(poi) {
    return `<div class="popup-content">時間: ${poi.timestamp.toLocaleDateString()}_${poi.timestamp.toLocaleTimeString()}<br>測位: ${poi.positioning}<br>属性: ${poi.description}</div>` +
      `<br><button id='edit-btn' class='edit-button'>編集</button> <button id='delete-btn' class='delete-button'>削除</button>`;
  }

  // POIを編集
  function editPOI(poi, marker) {
    let newDescription = prompt("新しい説明を入力してください:", poi.description);
    if (newDescription !== null) {
      poi.description = newDescription;
      marker.setPopupContent(createPopupContent(poi));
      savePOIArray(); // 編集後に保存
    }
  }

  // POIを削除
  function deletePOI(poi, marker) {
    let index = poiArray.indexOf(poi);
    if (index > -1) {
      poiArray.splice(index, 1);
      map.removeLayer(marker);
      savePOIArray(); // 削除後に保存
    }
  }

  // ローカルストレージのデータを削除
  function clearLocalStorage() {
    if (confirm("すべてのデータを削除しますか？")) {
      localStorage.removeItem('poiArray');
      poiArray = [];
      // マーカーをすべて削除
      map.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });
      alert("データが削除されました。");
    }
  }

  // ページ読み込み時にPOI配列を復元
  window.onload = function() {
    loadPOIArray();
  };



  // エクスポート
  // ファイル名を作成
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

  // ファイルをエクスポート
  function downloadFile(content, fileName, contentType) {
    let blob = new Blob([content], { type: contentType });
    let a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
  }

  // エクスポート（GPX）
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

  // エクスポート（KML）
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

  // エクスポート（GeoJSON）
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

    let geojsonContent = JSON.stringify(geojson, null, 2); // 整形して見やすくする
    let fileName = createFileName() + ".geojson";

    downloadFile(geojsonContent, fileName, "application/geo+json");
  }


  // スライドメニューの追加
  const toggleBtn = document.querySelector('.toggleBtn');
  const menu = document.querySelector('.menu');
  const closeBtn = document.querySelector('.closeBtn');
  let menuOpen = false;

  // トグルボタンをクリックするとスライドメニューが表示
  toggleBtn.addEventListener('click', () => {
    menuOpen = !menuOpen;
    menu.classList.toggle('open', menuOpen);
    toggleBtn.style.display = menuOpen ? 'none' : 'block'; // トグルボタンの表示/非表示を切り替え
  });

  // バツをタップするとスライドメニューが消える
  closeBtn.addEventListener('click', () => {
    menuOpen = false;
    menu.classList.remove('open');
    toggleBtn.style.display = 'block'; // トグルボタンを表示
  });

  // メニューリスト
  const exportGpxBtn = document.querySelector('#exportGpxBtn');
  const exportKmlBtn = document.querySelector('#exportKmlBtn');
  const exportGeoJSONBtn = document.querySelector('#exportGeoJSONBtn');
  const allClearBtn = document.querySelector('#allClearBtn');

  // メニューをタップしたときの動作
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

  // イベントリスナー
  document.getElementById('saveBtn').onclick = saveCurrentLocation;
  document.getElementById('saveCenterBtn').onclick = saveMapCenterLocation;

