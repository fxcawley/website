// Basic Three.js setup
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
    75, 
    window.innerWidth / window.innerHeight, 
    0.1, 
    1000
);

// Renderer
const renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('three-canvas'), 
    antialias: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Torus Knot Geometry (replacing cube and sphere)
const geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
const material = new THREE.MeshStandardMaterial({
    color: 0x007bff,
    metalness: 0.7,
    roughness: 0.2,
});
const torusKnot = new THREE.Mesh(geometry, material);
scene.add(torusKnot);

// Lighting

// Ambient Light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

// Directional Light
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Camera Position
camera.position.z = 5;

// Mouse movement for parallax effect
let mouseX = 0;
let mouseY = 0;
document.addEventListener('mousemove', onDocumentMouseMove, false);

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - window.innerWidth / 2) * 0.05;
    mouseY = (event.clientY - window.innerHeight / 2) * 0.05;
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    torusKnot.rotation.x += 0.01;
    torusKnot.rotation.y += 0.01;
    camera.position.x += (mouseX - camera.position.x) * 0.05;
    camera.position.y += (-mouseY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
}
animate();

// Resize handling
function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
}
window.addEventListener('resize', onWindowResize, false);

// Navigate to Projects page
function navigateToProjects() {
    window.location.href = "projects.html";
}
