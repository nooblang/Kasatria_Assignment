document.addEventListener("DOMContentLoaded", () => {

  // --------------------------
  // GOOGLE LOGIN CHECK
  // --------------------------
  const token = sessionStorage.getItem("google_token");
  if (!token) {
    window.location.href = "/login.html";
    return;
  }

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

  fetchSheetData();

  // --------------------------
  // 3D VISUALIZER VARIABLES
  // --------------------------
  let camera, scene, renderer, controls;
  let objects = [];
  let targets = { table: [], sphere: [], helix: [], grid: [] };
  let currentLayout = "table"; // Track current layout

  // --------------------------
  // BUILD SCENE
  // --------------------------
  function buildScene(data) {
    if (renderer) document.body.removeChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      1,
      10000
    );
    camera.position.z = 3000;

    scene = new THREE.Scene();

    renderer = new THREE.CSS3DRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new THREE.TrackballControls(camera, renderer.domElement);

    objects = [];

    data.forEach((row) => {
      const name = row[0];
      const image = row[1];
      const netWorth = parseFloat((row[5] || "0").replace(/[$,]/g, ""));

      const div = document.createElement("div");
      div.className = "element";
      div.style.background =
        netWorth < 100000 ? "red" : netWorth < 200000 ? "orange" : "green";

      div.innerHTML = `
        <img src="${image}" onerror="this.src='https://i.imgur.com/8Km9tLL.png'">
        <br>${name}
        <br>$${netWorth.toLocaleString()}
      `;

      const obj = new THREE.CSS3DObject(div);
      obj.position.set(
        Math.random() * 4000 - 2000,
        Math.random() * 4000 - 2000,
        Math.random() * 4000 - 2000
      );

      scene.add(obj);
      objects.push(obj);
    });

    createLayouts();
    transform(targets.table, false);
    animate();
  }

  // --------------------------
  // CREATE LAYOUTS
  // --------------------------
  function createLayouts() {
    targets = { table: [], sphere: [], helix: [], grid: [] };
    const vector = new THREE.Vector3();

    for (let i = 0; i < objects.length; i++) {

      // ---------- TABLE (20x10) ----------
      const table = new THREE.Object3D();
      table.position.set(
        (i % 20) * 140 - 1400,
        -(Math.floor(i / 20) % 10) * 180 + 900,
        0
      );
      targets.table.push(table);

      // ---------- SPHERE (ONLY THIS ROTATES) ----------
      const sphere = new THREE.Object3D();
      const phi = Math.acos(-1 + (2 * i) / objects.length);
      const theta = Math.sqrt(objects.length * Math.PI) * phi;

      sphere.position.setFromSphericalCoords(800, phi, theta);
      vector.copy(sphere.position).multiplyScalar(2);
      sphere.lookAt(vector);
      targets.sphere.push(sphere);

      // ---------- DOUBLE HELIX ----------
      const helix = new THREE.Object3D();
      const strand = i % 2;
      const index = Math.floor(i / 2);

      const angle = index * 0.35 + strand * Math.PI;
      const radius = 600;

      helix.position.set(
        radius * Math.cos(angle),
        -index * 40 + 1000,
        radius * Math.sin(angle)
      );

      targets.helix.push(helix);

      // ---------- GRID (5x4x10) ----------
      const grid = new THREE.Object3D();
      grid.position.set(
        (i % 5) * 400 - 800,
        -(Math.floor(i / 5) % 4) * 400 + 600,
        Math.floor(i / 20) * 400 - 2000
      );
      targets.grid.push(grid);
    }
  }

  // --------------------------
  // TRANSFORM
  // --------------------------
  function transform(targetsArr, rotate = false) {
    objects.forEach((obj, i) => {
      const target = targetsArr[i];

      // position tween
      new TWEEN.Tween(obj.position)
        .to(
          {
            x: target.position.x,
            y: target.position.y,
            z: target.position.z
          },
          2000
        )
        .easing(TWEEN.Easing.Exponential.InOut)
        .start();

      // rotation tween only for sphere
      if (rotate) {
        new TWEEN.Tween(obj.rotation)
          .to(
            {
              x: target.rotation.x,
              y: target.rotation.y,
              z: target.rotation.z
            },
            2000
          )
          .easing(TWEEN.Easing.Exponential.InOut)
          .start();
      } else if (currentLayout !== "helix") {
        // Reset rotation for Table/Grid
        new TWEEN.Tween(obj.rotation)
          .to({ x: 0, y: 0, z: 0 }, 1000)
          .easing(TWEEN.Easing.Exponential.InOut)
          .start();
      }
    });
  }

  // --------------------------
  // ANIMATION LOOP
  // --------------------------
  function animate() {
    requestAnimationFrame(animate);

    TWEEN.update();
    controls.update();

    // Make double helix tiles face camera dynamically
    if (currentLayout === "helix") {
      for (let i = 0; i < objects.length; i++) {
        objects[i].lookAt(camera.position);
      }
    }

    renderer.render(scene, camera);
  }

  // --------------------------
  // BUTTONS
  // --------------------------
  document.getElementById("table").onclick = () => {
    currentLayout = "table";
    transform(targets.table, false);
  };

  document.getElementById("sphere").onclick = () => {
    currentLayout = "sphere";
    transform(targets.sphere, true);
  };

  document.getElementById("helix").onclick = () => {
    currentLayout = "helix";
    transform(targets.helix, false);
  };

  document.getElementById("grid").onclick = () => {
    currentLayout = "grid";
    transform(targets.grid, false);
  };

  // --------------------------
  // RESIZE HANDLER
  // --------------------------
  window.addEventListener("resize", () => {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

});
