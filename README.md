# Telemeter Patrol Log (テレメータ巡回記録アプリ)

水道施設やテレメータの巡回点検記録を行うためのPWA（プログレッシブ・ウェブ・アプリ）対応Webアプリケーションです。
オフラインでの記録、写真撮影（位置情報・撮影日時自動取得）、Google SheetsおよびGoogle Driveへの同期機能を備えています。

## 主な機能

*   **オフライン対応**: 電波の届かない場所でも記録・保存が可能。
*   **写真管理**: 1記録につき最大3枚まで保存。Exif情報（緯度・経度・撮影日時）を自動抽出。
*   **データ同期**: オンライン時にボタン一つでGoogleスプレッドシートへデータを送信。
*   **動的場所管理**: Googleスプレッドシートのシート名を読み込み、点検場所リストとして使用。
*   **レスポンシブ**: スマートフォン、タブレット、PCに対応。

## セットアップ手順

### 1. フロントエンド (本アプリ)

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm start

# ビルド (本番用)
npm run build
```

### 2. バックエンド (Google Apps Script)

このアプリはバックエンドとしてGoogle Apps Script (GAS) を使用します。
**スプレッドシートの列を追加・変更した場合は、必ずここのコードも更新して「新しいデプロイ」を行ってください。**

1.  Googleスプレッドシートを新規作成します（または既存のものを使用）。
2.  「拡張機能」>「Apps Script」を開きます。
3.  以下のコードを `コード.gs` に貼り付けます。

**重要: 「色度」列によるズレを解消するためのコードです。**

```javascript
// --- 設定 ---
// ★写真保存先のGoogle DriveフォルダID★
const FOLDER_ID = "1lxwuD5h1jqICoJ_TvkwJhAxdG0ZogMwe"; 
// https://drive.google.com/drive/folders/1lxwuD5h1jqICoJ_TvkwJhAxdG0ZogMwe?usp=sharing

// ★データベースとなるスプレッドシートID★
const SPREADSHEET_ID = "1nSaJHCassXuEuO9fxwIhKM4IIC8HfvwwnwLmZoceR04";
// ------------

function getTargetSpreadsheet() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);

    const data = JSON.parse(e.postData.contents);
    const sheetName = data.sheetName || "シート1";
    const ss = getTargetSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    
    // シートがない場合は作成
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // ヘッダー行 (カラム構造に合わせて設定)
      // J列(10番目)に色度(度)を追加
      sheet.appendRow([
        "ID", "巡回日", "作成日時", "圧力(MPa)", "水温(℃)", 
        "残塩(前)", "残塩(後)", "残塩(実測)", "濁度(度)", "色度(度)",
        "換気扇", "テープヒータ", "パネルヒータ", "ロードヒータ", "施設状況", "100V電力", 
        "備考", 
        "写真1緯度", "写真1経度", "写真1高度", "写真1日時", "写真1URL",
        "写真2緯度", "写真2経度", "写真2高度", "写真2日時", "写真2URL",
        "写真3緯度", "写真3経度", "写真3高度", "写真3日時", "写真3URL"
      ]);
    }

    // 写真データの処理
    const photoDataList = [];
    if (data.photos) {
      const folder = DriveApp.getFolderById(FOLDER_ID);
      for (let i = 0; i < 3; i++) {
        const photo = data.photos[i];
        const pData = { lat: "", lon: "", alt: "", date: "", url: "" };
        if (photo) {
          pData.lat = photo.lat || "";
          pData.lon = photo.lon || "";
          pData.alt = photo.alt || "";
          pData.date = photo.date || "";
          if (photo.data) { 
            const blobs = Utilities.base64Decode(photo.data.split(',')[1]);
            const blob = Utilities.newBlob(blobs, 'image/jpeg', `${data.id}_${i + 1}.jpg`);
            const file = folder.createFile(blob);
            let desc = `日時: ${pData.date}`;
            if(pData.lat) desc += `\n位置: ${pData.lat}, ${pData.lon}`;
            file.setDescription(desc);
            pData.url = file.getUrl();
          } else if (photo.url) { 
            pData.url = photo.url;
          }
        }
        photoDataList.push(pData);
      }
    } else {
      for(let i=0; i<3; i++) photoDataList.push({ lat: "", lon: "", alt: "", date: "", url: "" });
    }

    // 行データの作成 (ここが列の順番を決定します)
    const rowData = [
      data.id,
      "'" + data.inspectionDate, // B列
      new Date(data.createdAt).toLocaleString(), // C列
      data.pressureMpa,
      data.waterTemp,
      data.chlorineBefore,
      data.chlorineAfter,
      data.chlorineMeasured,
      data.turbidity, // I列: 濁度(度)
      data.color,     // J列: 色度(度)  <-- 追加
      data.fanStatus, // K列: 換気扇
      data.tapeHeaterStatus,
      data.panelHeaterStatus,
      data.roadHeaterStatus,
      data.facilityStatus, // O列
      data.power100V,      // P列
      data.remarks,        // Q列
      // 写真...
      photoDataList[0].lat, photoDataList[0].lon, photoDataList[0].alt, photoDataList[0].date, photoDataList[0].url,
      photoDataList[1].lat, photoDataList[1].lon, photoDataList[1].alt, photoDataList[1].date, photoDataList[1].url,
      photoDataList[2].lat, photoDataList[2].lon, photoDataList[2].alt, photoDataList[2].date, photoDataList[2].url
    ];

    const id = data.id;
    let foundRowIndex = -1;
    const textFinder = sheet.getRange("A:A").createTextFinder(id).matchEntireCell(true);
    const found = textFinder.findNext();
    
    if (found) {
      foundRowIndex = found.getRow();
      sheet.getRange(foundRowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }

    return ContentService.createTextOutput(JSON.stringify({result: 'success', id: data.id, action: foundRowIndex !== -1 ? 'update' : 'create'}))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({result: 'error', error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  const action = e.parameter.action;
  const ss = getTargetSpreadsheet();

  if (action === 'getSheetNames') {
    const sheets = ss.getSheets();
    const sheetNames = sheets.map(s => s.getName());
    return ContentService.createTextOutput(JSON.stringify(sheetNames))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const sheetName = e.parameter.sheetName;
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  
  const data = sheet.getDataRange().getValues();
  const headers = data.shift(); // ヘッダー除去
  
  const result = data.map(row => {
    const photos = [];
    // 色度(J列)追加に伴い、以降のインデックスが +1 されています
    // Q列(16) -> R列(17)
    if (row[21]) photos.push({ lat: row[17], lon: row[18], alt: row[19], date: row[20], url: row[21] });
    if (row[26]) photos.push({ lat: row[22], lon: row[23], alt: row[24], date: row[25], url: row[26] });
    if (row[31]) photos.push({ lat: row[27], lon: row[28], alt: row[29], date: row[30], url: row[31] });

    return {
      id: row[0],
      inspectionDate: row[1],
      createdAt: new Date(row[2]).getTime(),
      pressureMpa: row[3],
      waterTemp: row[4],
      chlorineBefore: row[5],
      chlorineAfter: row[6],
      chlorineMeasured: row[7],
      turbidity: row[8],
      color: row[9], // J列: 色度
      fanStatus: row[10],
      tapeHeaterStatus: row[11],
      panelHeaterStatus: row[12],
      roadHeaterStatus: row[13],
      facilityStatus: row[14],
      power100V: row[15],
      remarks: row[16],
      photos: photos
    };
  });
  
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}
```

4.  「デプロイ」>「**新しいデプロイ**」を選択します。（重要：デプロイを管理、では更新されません）
5.  種類: **ウェブアプリ**
6.  アクセスできるユーザー: **全員**
7.  発行された **ウェブアプリのURL** をコピーします。

### 3. アプリとの連携

`constants.ts` ファイルを開き、`GOOGLE_SCRIPT_URL` の値を、上記で取得したウェブアプリのURLに書き換えてください。

```typescript
// constants.ts
export const GOOGLE_SCRIPT_URL = 'ここに発行されたURLを貼り付け';
```