// map_init.js
document.addEventListener('DOMContentLoaded', function() {
  const map = L.map('map', {
    // サイトを開いたときの地図の中心座標とそのときのズームレベル（縮尺）
    center: [34.691257,135.183078],
    zoom: 16,
    maxZoom: 23,
  });

  const baseLayers = {
    OpenStreetMap: L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 23,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    ),
    地理院地図: L.tileLayer(
      'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png',
      {
        minZoom: 5,
        maxNativeZoom: 18,
        maxZoom: 23,
        tms: false,
        attribution:
          '<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>',
      },
    ),
    '空中写真（最新）': L.tileLayer(
      'https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg',
      {
        minZoom: 5,
        maxZoom: 23,
        maxNativeZoom: 17,
        tms: false,
        attribution:
          '<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>',
      },
    ),
    '空中写真（1974～1979）': L.tileLayer(
      'https://cyberjapandata.gsi.go.jp/xyz/gazo1/{z}/{x}/{y}.jpg',
      {
        minZoom: 5,
        maxZoom: 23,
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

  // 地図の切り替えボタンの追加
  const layersControl = L.control.layers(baseLayers, [], ).addTo(map);

  // スケールバー
  L.control.scale({maxwidth: 200, position: 'bottomright', imperial: false }).addTo(map);

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

  // mapをグローバルスコープに公開
  window.map = map;
});