async function fetchSheetData() {
  const res = await fetch("/api/sheet");
  const data = await res.json();
  buildScene(data);
}

document.getElementById("login").onclick = fetchSheetData;
