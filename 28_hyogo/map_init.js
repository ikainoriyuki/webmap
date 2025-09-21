// map_init.js
document.addEventListener('DOMContentLoaded', function() {
  const map = L.map('map', {
    // サイトを開いたときの地図の中心座標とそのときのズームレベル（縮尺）
    center: [34.691257,135.183078],
    zoom: 13,
  });

  const baseLayers = {
    OpenStreetMap: L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
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
  // 兵庫県のCS立体図
  CS立体図: L.tileLayer(
    'https://rinya-hyogo.geospatial.jp/2023/rinya/tile/csmap/{z}/{x}/{y}.png',
    {
      minZoom: 13,
      maxNativeZoom: 18,
      maxZoom: 20,
      tms: false,
      attribution:  '<a href="https://www.geospatial.jp/ckan/dataset?organization=hyogopref/">兵庫県50㎝メッシュCS立体図（xyzタイル）、兵庫県</a>',
    },
  ),
  // 兵庫県のレーザー林相図
  レーザ林相図: L.tileLayer(
    'https://rinya-hyogo.geospatial.jp/2023/rinya/tile/ls_standtype/{z}/{x}/{y}.png',
    {
      minZoom: 13,
      maxNativeZoom: 18,
      maxZoom: 20,
      tms: false,
      attribution: '<a href="https://www.geospatial.jp/ckan/dataset?organization=hyogopref/">兵庫県「レーザ林相図」、兵庫県</a>',
    },
  ),
  };
  map.addLayer(baseLayers['地理院地図']);

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
        color: "black",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.1,
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
    // layersControl.addOverlay(polygonLayerGroup, 'ポリゴン');
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
        color: "black",
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
    // layersControl.addOverlay(lineLayerGroup, 'ライン');
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
    // layersControl.addOverlay(pointlayerGroup, 'ポイント');
  })
  .catch((error) => {
      console.error(error);
  });

  // マップがロードされた後に一度だけ現在地を取得し、中心を移動
  map.once('locationfound', (e) => {
      // 現在地が取得できた時の処理
      const latlng = e.latlng;
      
      // 地図の中心を現在地に設定
      map.setView(latlng, 16); // ズームレベルを15に設定
  });

  let option = {
    enableHighAccuracy: true,
    watch: true,
    position: 'topright',
    drawCircle: true,
    setView: false, // 現在地に移動しない
    follow: true,
    keepCurrentZoomLevel: true,
    strings: {
      title: "現在地を表示",
    },
    locateOptions: {
      maxZoom: 20
    }
  };

  let lc = L.control.locate(option).addTo(map);

  lc.start();

  L.control.scale({maxwidth: 200, position: 'bottomright', imperial: false }).addTo(map);

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("locateBtn").addEventListener("click", jumpToLocation);
  });


  // ズームレベル表示用のカスタムコントロール
  const zoomDisplay = L.control({ position: 'bottomright' });

  zoomDisplay.onAdd = function (map) {
      this._div = L.DomUtil.create('div', 'info');
      this.update(map.getZoom());
      return this._div;
  };

  zoomDisplay.update = function (zoom) {
      this._div.innerHTML = `<div>Zoom: ${zoom}</div>`;
  };

  zoomDisplay.addTo(map);

  // ズームが変更されたときに表示を更新するイベントリスナー
  map.on('zoomend', function () {
      zoomDisplay.update(map.getZoom());
  });

  // mapとlcをグローバルスコープに公開するか、script.jsに引数として渡す
  window.map = map;
  window.lc = lc;
});