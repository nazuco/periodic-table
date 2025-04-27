import * as THREE from "three";
import TWEEN from "three/addons/libs/tween.module.js";
import { TrackballControls } from "three/addons/controls/TrackballControls.js";
import {
  CSS3DRenderer,
  CSS3DObject,
} from "three/addons/renderers/CSS3DRenderer.js";
import { table } from "./elements.js";
import { categoryMap } from "./elements.js";

// Constants
const CAMERA_FOV = 40;
const CAMERA_NEAR = 1;
const CAMERA_FAR = 10000;
const CONTROLS_MIN_DISTANCE = 500;
const CONTROLS_MAX_DISTANCE = 6000;
const TRANSITION_DURATION = 500; // Reduced overall duration for faster transitions

// Initialize variables

let camera, scene, renderer;
let controls;
const objects = [];
const targets = { table: [], sphere: [], helix: [], grid: [] };
let activeCategory = null;

// Initialize scene
init();
animate();

//done
function init() {
  // Create camera
  camera = new THREE.PerspectiveCamera(
    CAMERA_FOV,
    window.innerWidth / window.innerHeight,
    CAMERA_NEAR,
    CAMERA_FAR
  );
  camera.position.z = 3000;

  // Create scene
  scene = new THREE.Scene();

  // Create elements for the table
  for (let i = 0; i < table.length; i += 5) {
    const element = document.createElement("div");
    element.className = "element";
    // Generate a random background color and store it as the original color
    const randColor = "rgba(0,127,127," + (Math.random() * 0.5 + 0.25) + ")";
    element.style.backgroundColor = randColor;
    element.dataset.originalColor = randColor;

    const number = document.createElement("div");
    number.className = "number";
    number.textContent = i / 5 + 1;
    element.appendChild(number);

    const symbol = document.createElement("div");
    symbol.className = "symbol";
    symbol.textContent = table[i];
    element.appendChild(symbol);

    const details = document.createElement("div");
    details.className = "details";
    details.innerHTML = table[i + 1] + "<br>" + table[i + 2];
    element.appendChild(details);

    // Set category for each element
    element.dataset.symbol = table[i];
    element.dataset.category = getCategory(table[i]);

    const objectCSS = new CSS3DObject(element);
    // Set initial random positions
    objectCSS.position.x = Math.random() * 4000 - 2000;
    objectCSS.position.y = Math.random() * 4000 - 2000;
    objectCSS.position.z = Math.random() * 4000 - 2000;
    scene.add(objectCSS);

    objects.push(objectCSS);

    // Create table target (final arranged position)
    const object = new THREE.Object3D();
    object.position.x = table[i + 3] * 140 - 1330;
    object.position.y = -(table[i + 4] * 180) + 900; // Lowered from 990 to 700
    object.rotation.x = 0;
    object.rotation.y = 0;
    object.rotation.z = 0;
    targets.table.push(object);
  }

  // Initialize renderer
  renderer = new CSS3DRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("container").appendChild(renderer.domElement);

  // Initialize controls
  controls = new TrackballControls(camera, renderer.domElement);
  controls.minDistance = CONTROLS_MIN_DISTANCE;
  controls.maxDistance = CONTROLS_MAX_DISTANCE;
  controls.addEventListener("change", render);

  createCategoryButtons();
  createSphereTargets();
  createHelixTargets();
  setupTransitionButtons();

  // Use table transition as the initial arrangement
  transform(targets.table, TRANSITION_DURATION);

  window.addEventListener("resize", onWindowResize);
}

//done
// Function to get category from symbol
function getCategory(symbol) {
  for (const [category, elements] of Object.entries(categoryMap)) {
    if (elements.includes(symbol)) {
      return category;
    }
  }
  return "unknown";
}

//done
function createCategoryButtons() {
  const buttonContainer = document.getElementById("category-buttons");

  // Create Metals and Non-Metals dropdowns
  const categories = [
    { name: "Metals", containerClass: "metals-container" },
    { name: "Non-Metals", containerClass: "nonmetals-container" },
  ];

  categories.forEach(({ name, containerClass }) => {
    const container = document.createElement("div");
    container.className = containerClass;

    // Dropdown label
    const label = document.createElement("button");
    label.className = "category-dropdown-label";
    label.innerHTML = `<span>${name}</span>`; // Use span to wrap the name;
    label.addEventListener("click", () => toggleDropdown(container));

    // Dropdown content
    const dropdown = document.createElement("div");
    dropdown.className = "category-dropdown";

    Object.keys(categoryMap).forEach((category) => {
      if (
        (name === "Metals" && category.toLowerCase().includes("metal")) ||
        (name === "Non-Metals" && !category.toLowerCase().includes("metal"))
      ) {
        const button = document.createElement("button");
        button.className = "category-button";
        button.innerHTML = `<span>${category.replace(
          /([a-z])([A-Z])/g,
          "$1 $2"
        )}</span>`; // Use span to wrap the ;
        button.dataset.category = category;
        button.addEventListener("click", () => moveCategoryForward(category));
        dropdown.appendChild(button);
      }
    });

    container.appendChild(label);
    container.appendChild(dropdown);
    buttonContainer.appendChild(container);
  });
}

//done
// Toggle dropdown with smooth effect
function toggleDropdown(container) {
  const dropdown = container.querySelector(".category-dropdown");
  dropdown.style.maxHeight =
    dropdown.style.maxHeight === "0px" || !dropdown.style.maxHeight
      ? dropdown.scrollHeight + "px"
      : "0px";
}

function moveCategoryForward(category) {
  const maxDelay = 100; // lower maximum delay for smoother transitions

  // Separate objects into selected and unselected groups
  const selectedObjects = objects.filter(
    (object) => object.element.dataset.category === category
  );
  const unselectedObjects = objects.filter(
    (object) => object.element.dataset.category !== category
  );

  const nSelected = selectedObjects.length;
  const nUnselected = unselectedObjects.length;

  selectedObjects.forEach((object, index) => {
    const delay = nSelected > 1 ? (index / (nSelected - 1)) * maxDelay * 3 : 0;
    new TWEEN.Tween(object.position)
      .to({ z: 100 }, TRANSITION_DURATION / 2)
      .delay(delay)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start();

    object.element.style.backgroundColor = object.element.dataset.originalColor;
  });

  unselectedObjects.forEach((object, index) => {
    const delay = nUnselected > 1 ? (index / (nUnselected - 1)) * maxDelay : 0;
    new TWEEN.Tween(object.position)
      .to({ z: 10 }, TRANSITION_DURATION / 2)
      .delay(delay)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start();
    object.element.style.backgroundColor = "rgba(120, 131, 136, 0.43)";
  });

  activeCategory = category;

  new TWEEN.Tween({})
    .to({}, TRANSITION_DURATION)
    .onUpdate(() => render())
    .start();
}

// Create sphere targets
function createSphereTargets() {
  const vector = new THREE.Vector3();
  for (let i = 0, l = objects.length; i < l; i++) {
    const phi = Math.acos(-1 + (2 * i) / l);
    const theta = Math.sqrt(l * Math.PI) * phi;
    const object = new THREE.Object3D();
    object.position.setFromSphericalCoords(800, phi, theta);
    object.position.y -= 200;
    vector.copy(object.position).multiplyScalar(2);
    object.lookAt(vector);
    targets.sphere.push(object);
  }
}

// Create helix targets
function createHelixTargets() {
  const vector = new THREE.Vector3();
  for (let i = 0, l = objects.length; i < l; i++) {
    const theta = i * 0.175 + Math.PI;
    const y = -(i * 8) + 450;
    const object = new THREE.Object3D();
    object.position.setFromCylindricalCoords(900, theta, y);
    vector.x = object.position.x * 2;
    vector.y = object.position.y;
    vector.z = object.position.z * 2;
    object.lookAt(vector);
    targets.helix.push(object);
  }
}

// Setup transition buttons for sphere, helix, table
function setupTransitionButtons() {
  const buttons = document.querySelectorAll(".transition-button");
  buttons.forEach((button) => {
    button.addEventListener("click", (event) => {
      // Clear active category so that transform returns cards to their original style
      activeCategory = null;
      const arrangement = event.target.dataset.arrangement;
      transform(targets[arrangement], TRANSITION_DURATION);
    });
  });
}

// Transform function: Animates all objects to the given targets
function transform(targets, duration) {
  TWEEN.removeAll();
  const delayIncrement = 30; // Minimal stagger delay for smoother transitions

  for (let i = 0; i < objects.length; i++) {
    const object = objects[i];
    const target = targets[i];

    new TWEEN.Tween(object.position)
      .to(
        {
          x: target.position.x,
          y: target.position.y,
          z:
            object.element.dataset.category === activeCategory
              ? CATEGORY_SPACING
              : target.position.z,
        },
        duration
      )
      .delay(i * delayIncrement)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start();

    new TWEEN.Tween(object.rotation)
      .to(
        {
          x: target.rotation.x,
          y: target.rotation.y,
          z: target.rotation.z,
        },
        duration
      )
      .delay(i * delayIncrement)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start();

    object.scale.set(0.8, 0.8, 0.8);
    new TWEEN.Tween(object.scale)
      .to({ x: 1, y: 1, z: 1 }, duration)
      .delay(i * delayIncrement)
      .easing(TWEEN.Easing.Back.Out)
      .start();

    if (!activeCategory) {
      object.element.style.backgroundColor =
        object.element.dataset.originalColor;
    }
  }

  new TWEEN.Tween({})
    .to({}, duration + objects.length * delayIncrement)
    .onUpdate(render)
    .start();
}

document.addEventListener("contextmenu", function (event) {
  event.preventDefault(); // Prevent default right-click menu

  // Remove all active animations
  TWEEN.removeAll();

  // Reset active category
  activeCategory = null;

  // Restore all objects to their original positions and colors
  objects.forEach((object, index) => {
    const target = targets.table[index];

    new TWEEN.Tween(object.position)
      .to(
        {
          x: target.position.x,
          y: target.position.y,
          z: target.position.z,
        },
        TRANSITION_DURATION
      )
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start();

    new TWEEN.Tween(object.rotation)
      .to(
        {
          x: target.rotation.x,
          y: target.rotation.y,
          z: target.rotation.z,
        },
        TRANSITION_DURATION
      )
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start();

    object.element.style.backgroundColor = object.element.dataset.originalColor;
  });

  // Ensure smooth transition
  new TWEEN.Tween({}).to({}, TRANSITION_DURATION).onUpdate(render).start();
});

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}
document.getElementById("color_mode").addEventListener("change", function () {
  const isDarkMode = this.checked;
  document.body.classList.toggle("dark-mode", isDarkMode);
  changeSceneBackground(isDarkMode ? 0xffffff : 0x000000);
});

function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
  if (controls) controls.update();
}

function render() {
  renderer.render(scene, camera);
}

animate();
