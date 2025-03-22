// Kiểm tra Three.js có tải không
console.log("Three.js loaded:", typeof THREE);

// Khởi tạo scene, camera, renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 50;

// Thêm ánh sáng môi trường
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

// Thêm ánh sáng điểm từ khối cầu trung tâm
const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

// Shader tùy chỉnh (Perlin noise)
const customShaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        zoomLevel: { value: 1.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        uniform float time;

        float noise(vec3 p) {
            return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
        }

        vec3 distort(vec3 p) {
            float n = 0.0;
            for (int i = 0; i < 12; i++) {
                n += noise(p * float(i + 1) + time * 0.2) * (1.0 / float(i + 1));
            }
            return p + normalize(p) * n * 3.0;
        }

        void main() {
            vUv = uv;
            vPosition = position;
            vec3 pos = distort(position);
            for (int i = 0; i < 5; i++) {
                pos += noise(pos + time * 0.1) * normal * 0.5;
            }
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        uniform float time;
        uniform vec2 resolution;
        uniform float zoomLevel;

        float mod289(float x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 perm(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }

        float noise(vec3 p) {
            vec3 a = floor(p);
            vec3 d = p - a;
            d = d * d * (3.0 - 2.0 * d);

            vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
            vec4 k1 = perm(b.xyxy);
            vec4 k2 = perm(k1.xyxy + b.zzww);

            vec4 c = k2 + a.zzzz;
            vec4 k3 = perm(c);
            vec4 k4 = perm(c + 1.0);

            vec4 o1 = fract(k3 * (1.0 / 41.0));
            vec4 o2 = fract(k4 * (1.0 / 41.0));

            vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
            vec2 o4 = o3.yw * d.y + o3.xz * (1.0 - d.y);

            return o4.y * d.x + o4.x * (1.0 - d.x);
        }

        float fbm(vec3 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 16; i++) {
                v += a * noise(p);
                p = p * 2.0 + time * 0.1;
                a *= 0.5;
                v += sin(p.x * 20.0 + time) * 0.1;
                v += cos(p.y * 25.0 + time) * 0.1;
            }
            return v;
        }

        void main() {
            vec2 uv = vUv * 50.0;
            vec3 pos = vec3(uv, time * 0.3);
            float n = fbm(pos);
            for (int i = 0; i < 12; i++) {
                float freq = pow(2.0, float(i));
                n += fbm(pos * freq + vec3(time * 0.2)) * (1.0 / freq);
            }
            vec3 color = vec3(0.0);
            for (int i = 0; i < 3; i++) {
                float light = fbm(pos + vec3(float(i) * 10.0, time, 0.0));
                color[i] = sin(n * 15.0 + light * 10.0 + time) * 0.5 + 0.5;
            }
            float dist = length(vPosition) * zoomLevel;
            color *= cos(dist * 20.0 + time) * 0.5 + 0.5;
            gl_FragColor = vec4(color, 1.0);
        }
    `
});

// Tạo khối cầu trung tâm với shader tùy chỉnh
let sphereSegments = 32;
let sphere = new THREE.Mesh(
    new THREE.SphereGeometry(10, sphereSegments, sphereSegments),
    customShaderMaterial
);
scene.add(sphere);

// Tạo các khối cầu nhỏ xung quanh
let smallSpheres = [];
let smallSphereCount = 10;
function createSmallSpheres(count) {
    smallSpheres.forEach(s => {
        scene.remove(s);
        s.geometry.dispose();
        s.material.dispose();
    });
    smallSpheres = [];
    for (let i = 0; i < count; i++) {
        const smallSphereGeometry = new THREE.SphereGeometry(1, 32, 32);
        const smallSphereMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5
        });
        const smallSphere = new THREE.Mesh(smallSphereGeometry, smallSphereMaterial);
        const radius = 20 + Math.random() * 10;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        smallSphere.position.set(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta),
            radius * Math.cos(phi)
        );
        scene.add(smallSphere);
        smallSpheres.push(smallSphere);
    }
}
createSmallSpheres(smallSphereCount);

// Tạo các hạt xung quanh
let particlesCount = 1000;
let particlesGeometry = new THREE.BufferGeometry();
const particlesMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.2,
    transparent: true,
    blending: THREE.AdditiveBlending
});

let particlesPositions = new Float32Array(particlesCount * 3);
for (let i = 0; i < particlesCount; i++) {
    const i3 = i * 3;
    const radius = 30 + Math.random() * 20;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    particlesPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    particlesPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    particlesPositions[i3 + 2] = radius * Math.cos(phi);
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3));
let particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

// Hàm cập nhật cảnh theo mức độ hiệu năng
function updatePerformanceLevel(level) {
    try {
        scene.remove(particles);
        particlesGeometry.dispose();
        scene.remove(sphere);
        sphere.geometry.dispose();

        if (level === 'Mobile') {
            particlesCount = 1000;
            smallSphereCount = 50;
            sphereSegments = 64;
            renderer.setPixelRatio(window.devicePixelRatio * 1);
        } else if (level === 'PC') {
            particlesCount = 500000;
            smallSphereCount = 1000;
            sphereSegments = 128;
            renderer.setPixelRatio(window.devicePixelRatio * 1.5);
        } else if (level === 'Super PC') {
            particlesCount = 1000000;
            smallSphereCount = 5000;
            sphereSegments = 256;
            renderer.setPixelRatio(window.devicePixelRatio * 2);
        }

        sphere = new THREE.Mesh(
            new THREE.SphereGeometry(10, sphereSegments, sphereSegments),
            customShaderMaterial
        );
        scene.add(sphere);

        createSmallSpheres(smallSphereCount);

        particlesPositions = new Float32Array(particlesCount * 3);
        for (let i = 0; i < particlesCount; i++) {
            const i3 = i * 3;
            const radius = 30 + Math.random() * 20;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            particlesPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            particlesPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            particlesPositions[i3 + 2] = radius * Math.cos(phi);
        }
        particlesGeometry = new THREE.BufferGeometry();
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3));
        particles = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particles);
    } catch (error) {
        console.error("Error in updatePerformanceLevel:", error);
    }
}

// Thanh tùy chỉnh hiệu năng
const performanceLevelSelect = document.getElementById('performance-level');
if (performanceLevelSelect) {
    performanceLevelSelect.addEventListener('change', (event) => {
        console.log("Performance level changed to:", event.target.value);
        updatePerformanceLevel(event.target.value);
    });
} else {
    console.error("Performance level select element not found!");
}

// Khởi tạo với mức Mobile
updatePerformanceLevel('Mobile');

// Đo FPS
let lastTime = 0;
let frameCount = 0;
let fps = 0;
const fpsCounter = document.getElementById('fps-counter');

// Biến để theo dõi trạng thái chuột (cho máy tính)
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let rotationSpeed = 0.005;

// Điều khiển xoay bằng chuột (cho máy tính)
window.addEventListener('mousedown', (event) => {
    isDragging = true;
});

window.addEventListener('mousemove', (event) => {
    if (isDragging) {
        const deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y
        };
        scene.rotation.y += deltaMove.x * rotationSpeed;
        scene.rotation.x += deltaMove.y * rotationSpeed;
        previousMousePosition = { x: event.clientX, y: event.clientY };
    }
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});

window.addEventListener('mousemove', (event) => {
    previousMousePosition = { x: event.clientX, y: event.clientY };
});

// Điều khiển zoom bằng scroll wheel (cho máy tính)
window.addEventListener('wheel', (event) => {
    event.preventDefault();
    const zoomSpeed = 0.1;
    camera.position.z += event.deltaY * zoomSpeed;
    camera.position.z = Math.max(5, Math.min(200, camera.position.z));
    camera.updateProjectionMatrix();
    console.log("Wheel zoom: camera.z =", camera.position.z);
}, { passive: false });

// Biến để theo dõi cảm ứng trên điện thoại
let isTouchRotating = false;
let touchPreviousPosition = { x: 0, y: 0 };
let initialDistance = 0;
let currentDistance = 0;

// Hàm tính khoảng cách giữa hai điểm chạm
function getDistance(touch1, touch2) {
    const dx = touch1.pageX - touch2.pageX;
    const dy = touch1.pageY - touch2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
}

// Sự kiện bắt đầu chạm (cho điện thoại)
window.addEventListener('touchstart', (event) => {
    event.preventDefault();
    if (event.touches.length === 1) {
        isTouchRotating = true;
        touchPreviousPosition = { x: event.touches[0].pageX, y: event.touches[0].pageY };
    } else if (event.touches.length === 2) {
        isTouchRotating = false;
        initialDistance = getDistance(event.touches[0], event.touches[1]);
    }
});

// Sự kiện di chuyển ngón tay (cho điện thoại)
window.addEventListener('touchmove', (event) => {
    event.preventDefault();
    if (event.touches.length === 1 && isTouchRotating) {
        const deltaMove = {
            x: event.touches[0].pageX - touchPreviousPosition.x,
            y: event.touches[0].pageY - touchPreviousPosition.y
        };
        scene.rotation.y += deltaMove.x * rotationSpeed;
        scene.rotation.x += deltaMove.y * rotationSpeed;
        touchPreviousPosition = { x: event.touches[0].pageX, y: event.touches[0].pageY };
    } else if (event.touches.length === 2) {
        currentDistance = getDistance(event.touches[0], event.touches[1]);
        const zoomSpeed = 0.05;
        const delta = (currentDistance - initialDistance) * zoomSpeed;
        camera.position.z -= delta;
        camera.position.z = Math.max(5, Math.min(200, camera.position.z));
        camera.updateProjectionMatrix();
        console.log("Touch zoom: camera.z =", camera.position.z);
        initialDistance = currentDistance;
    }
});

// Sự kiện kết thúc chạm (cho điện thoại)
window.addEventListener('touchend', (event) => {
    isTouchRotating = false;
    initialDistance = 0;
});

// Vòng lặp animation
function animate(time) {
    requestAnimationFrame(animate);
    customShaderMaterial.uniforms.time.value = time * 0.001;
    sphere.rotation.y += 0.005;
    smallSpheres.forEach((smallSphere, index) => {
        smallSphere.rotation.y += 0.02;
        const radius = 20 + Math.sin(time * 0.001 + index) * 10;
        const theta = time * 0.001 + index;
        const phi = Math.PI / 2 + Math.sin(time * 0.001 + index) * 0.5;
        smallSphere.position.set(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta),
            radius * Math.cos(phi)
        );
    });
    const positions = particlesGeometry.attributes.position.array;
    for (let i = 0; i < particlesCount; i++) {
        const i3 = i * 3;
        positions[i3 + 1] += Math.sin(time * 0.001 + i) * 0.01;
    }
    particlesGeometry.attributes.position.needsUpdate = true;
    frameCount++;
    if (time - lastTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastTime = time;
        fpsCounter.innerText = `FPS: ${fps}`;
    }
    renderer.render(scene, camera);
}
animate(0);

// Xử lý resize cửa sổ
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});