import * as THREE from 'three';
// <--- This looks for the div with id="app"
let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer;
let points: THREE.Points, geometry: THREE.BufferGeometry;
let positions: Float32Array, originalPositions: Float32Array, velocities: Float32Array;

const count = 15000;
const mouse = new THREE.Vector3(-1000, -1000, 0);

init();
animate();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create Particles
    geometry = new THREE.BufferGeometry();
    positions = new Float32Array(count * 3);
    originalPositions = new Float32Array(count * 3);
    velocities = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 10;
        originalPositions[i] = positions[i];
        velocities[i] = 0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ size: 0.02, color: 0x00ffff, transparent: true, opacity: 0.8 });
    points = new THREE.Points(geometry, material);
    scene.add(points);

    // Listeners
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', explode);
}

function onMouseMove(event: MouseEvent) {
    const vector = new THREE.Vector3(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1,
        0.5
    );
    vector.unproject(camera);
    const dir = vector.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z;
    mouse.copy(camera.position).add(dir.multiplyScalar(distance));
}

function explode() {
    for (let i = 0; i < count * 3; i++) {
        velocities[i] += (Math.random() - 0.5) * 0.5;
    }
}

function animate() {
    requestAnimationFrame(animate);

    const posAttr = geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
        const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;

        // 1. Distance to mouse
        const dx = mouse.x - posAttr[ix];
        const dy = mouse.y - posAttr[iy];
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 2. Repulsion (Push away from mouse)
        if (dist < 1.5) {
            const force = (1.5 - dist) * 0.02;
            velocities[ix] -= dx * force;
            velocities[iy] -= dy * force;
        }

        // 3. Spring back to original position
        velocities[ix] += (originalPositions[ix] - posAttr[ix]) * 0.005;
        velocities[iy] += (originalPositions[iy] - posAttr[iy]) * 0.005;

        // 4. Friction (Damping)
        velocities[ix] *= 0.95;
        velocities[iy] *= 0.95;

        // 5. Update position
        posAttr[ix] += velocities[ix];
        posAttr[iy] += velocities[iy];
    }

    geometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
}