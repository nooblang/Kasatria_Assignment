document.addEventListener("DOMContentLoaded", () => {

  // --------------------------
  // GOOGLE LOGIN CHECK
  // --------------------------
  const token = sessionStorage.getItem("google_token");
  if (!token) {
    // Not logged in → redirect to login page
    window.location.href = "/login.html";
    return;
  }

  // --------------------------
  // LOGOUT BUTTON
  // --------------------------
  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      sessionStorage.clear();
      window.location.href = "/login.html";
    };
  }

  // --------------------------
  // FETCH SHEET DATA
  // --------------------------
  async function fetchSheetData() {
    try {
      const res = await fetch("/api/sheet");
      const data = await res.json();
      if (!data || data.length === 0) {
        alert("No data found in the sheet.");
        return;
      }
      buildScene(data);
    } catch (err) {
      console.error("Failed to fetch sheet:", err);
      alert("Failed to fetch sheet data.");
    }
  }

  fetchSheetData(); // start fetching immediately

  // --------------------------
  // 3D VISUALIZER VARIABLES
  // --------------------------
  let camera, scene, renderer, controls;
  let objects = [];
  let targets = { table: [], sphere: [], helix: [], grid: [] };

  // --------------------------
  // BUILD SCENE
  // --------------------------
  function buildScene(data) {
    if (renderer) document.body.removeChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(40, window.innerWidth/window.innerHeight, 1, 10000);
    camera.position.z = 3000;
    scene = new THREE.Scene();

    renderer = new THREE.CSS3DRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new THREE.TrackballControls(camera, renderer.domElement);

    objects = [];

    data.forEach((row, i) => {
      const name = row[0];
      const image = row[1];
      const netWorth = parseFloat((row[5] || "0").replace(/[$,]/g, ""));

      const div = document.createElement("div");
      div.className = "element";
      div.style.background = netWorth < 100000 ? "red" : netWorth < 200000 ? "orange" : "green";

      div.innerHTML = `
        <img src="${image}" onerror="this.src='https://i.imgur.com/8Km9tLL.png'">
        <br>${name}
        <br>$${netWorth.toLocaleString()}
      `;

      const obj = new THREE.CSS3DObject(div);
      obj.position.set(Math.random()*4000-2000, Math.random()*4000-2000, Math.random()*4000-2000);
      scene.add(obj);
      objects.push(obj);
    });

    createLayouts();
    transform(targets.table);
    animate();
  }

  // --------------------------
  // CREATE LAYOUTS
  // --------------------------
  function createLayouts(){
    targets = { table:[], sphere:[], helix:[], grid:[] };

    for(let i=0;i<objects.length;i++){
      let table=new THREE.Object3D();
      table.position.x=(i%20)*140-1400;
      table.position.y=-(Math.floor(i/20)%10)*180+900;
      targets.table.push(table);

      let sphere=new THREE.Object3D();
      let phi=Math.acos(-1+2*i/objects.length);
      let theta=Math.sqrt(objects.length*Math.PI)*phi;
      sphere.position.setFromSphericalCoords(800,phi,theta);
      targets.sphere.push(sphere);

      let helix=new THREE.Object3D();
      let angle=i*0.3;
      let radius=(i%2===0)?600:-600;
      helix.position.set(radius*Math.cos(angle), -(i*20)+1000, radius*Math.sin(angle));
      targets.helix.push(helix);

      let grid=new THREE.Object3D();
      grid.position.x=(i%5)*400-800;
      grid.position.y=(Math.floor(i/5)%4)*400-800;
      grid.position.z=Math.floor(i/20)*400-2000;
      targets.grid.push(grid);
    }
  }

  // --------------------------
  // TRANSFORM ANIMATION
  // --------------------------
  function transform(targetsArr){
    objects.forEach((obj,i)=>{
      new TWEEN.Tween(obj.position)
        .to(targetsArr[i].position,2000)
        .easing(TWEEN.Easing.Exponential.InOut)
        .start();
    });
  }

  // --------------------------
  // ANIMATE LOOP
  // --------------------------
  function animate(){
    requestAnimationFrame(animate);
    TWEEN.update();
    controls.update();
    renderer.render(scene,camera);
  }

  // --------------------------
  // BUTTONS
  // --------------------------
  document.getElementById("table").onclick=()=>transform(targets.table);
  document.getElementById("sphere").onclick=()=>transform(targets.sphere);
  document.getElementById("helix").onclick=()=>transform(targets.helix);
  document.getElementById("grid").onclick=()=>transform(targets.grid);

  window.addEventListener('resize', () => {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

});
