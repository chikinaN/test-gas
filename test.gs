const SHEET_ID = "...";
const spreadSheet = SpreadsheetApp.openById(SHEET_ID);
const sheet = spreadSheet.getSheetByName("profile");

const cache = new Map();

function doGet(e) {
  const reqType = e.parameter.type;
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  switch (reqType) {
    case "document":
      output.setContent(JSON.stringify(
        e.parameter.name?
          getDocument(e.parameter.name):
          errorResponse("名前が指定していません")
      ));
      break;
    case "profile":
      output.setContent(JSON.stringify(getProfileList()));
      break;
    default:
      output.setContent(JSON.stringify(errorResponse("タイプが指定していません")));
      break;
  }
  return output
}

function getDocument(name) {
  const document = getRequestListAll().find((request) => request.name == name);
  if (document) {
    return getDocText(document.doc)
  } else {
    return errorResponse("名前が見つかりません")
  }
}

function getProfileList() {
  // TODO: 一言を載せたいよなぁ
  return getProfileListAll()TODO
}

// lib

function errorResponse(comment) {
  console.log({
    status: "error",
    message: comment
  })
  return {
    status: "error",;
    message: comment
  }
}

function cacheWrapper(key, func) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  const retData = func()
  cache.set(key, retData)
  return retData;
}

function getRow() {
  return cacheWrapper("row", () => {
    let row = 2;
    while (sheet.getRange(row + 1, 1).getValue() !== "") {
      row++;
    }
    return row - 1
  })
}

function groupBy(option) {
  const groupedByType = getRequestListAll().reduce((acc, curr) => {
    const type = curr[option];
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(curr);
    return acc;
  }, {});
  // const groupedByType = Object.groupBy(getRequestListAll(), ({ type }) => type);
  return groupedByType
}

function getProfileListAll() {
  return cacheWrapper("profile", () => {
    const initializeList = sheet.getRange(2, 3, getRow(), 6).getValues()
    const profileList = []
    initializeList.forEach((data) => {
      profileList.push({
        name: data[0],
        slack: data[1],
        slackId: data[2],
        icon: data[3],
      })
    })
    return profileList
  })
}

function getRequestListAll() {
  return cacheWrapper("request", () => {
    const initializeList = sheet.getRange(2, 1, getRow(), 12).getValues()
    const requestList = []
    initializeList.forEach((data) => {
      requestList.push({
        id: data[0],
        studentId: data[1],
        name: data[2],
        slack: data[3],
        slackId: data[4],
        icon: formatIconId(data[5]),
        generation: data[6],
        type: data[7],
        option: data[8],
        doc: formatDocId(data[9])
      })
    })
    return requestList
  })
}

function getDocText(id) {
  const file = DocumentApp.openById(id);
  const textList = []
  for (let i = 0; i < file.getBody().getNumChildren(); i++) {
    const node = file.getBody().getChild(i)
    const textType = node.getAttributes().HEADING.toJSON()
    textList.push({
      type: textType,
      text: node.getText()
    })
  }
  return textList
}

function formatDocId(url) {
  const atIndex = url.indexOf('/d/');
  return url.substring(atIndex + 3, url.length - 5);
}
function formatIconId(url) {
  const atIndex = url.indexOf('id=');
  const lastIndex = url.indexOf('&export');
  return url.substring(atIndex + 3, lastIndex);
}
