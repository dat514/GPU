// Kiểm tra Three.js có tải không
console.log("Three.js loaded:", typeof THREE);

// Khởi tạo scene, camera, renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 50;

// Thêm OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enabled = false; // Tắt OrbitControls ban đầu
window.addEventListener('click', function() {
    controls.enabled = true; // Bật khi người dùng tương tác
});

// Thêm ánh sáng
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

// Thêm texture loader
const textureLoader = new THREE.TextureLoader();

// Tạo ngôi sao trung tâm (Mặt Trời) với texture
const sunTexture = textureLoader.load('https://threejs.org/examples/textures/planets/sun.png'); // Thay bằng URL texture của bạn
const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
const sunMaterial = new THREE.MeshStandardMaterial({
    map: sunTexture,
    emissive: 0xffff00,
    emissiveIntensity: 1
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Tạo hành tinh 1 (Dự án - đỏ) với texture
const planet1Texture = textureLoader.load('https://threejs.org/examples/textures/planets/earth.png'); // Thay bằng URL texture của bạn
const planet1Geometry = new THREE.SphereGeometry(1, 32, 32);
const planet1Material = new THREE.MeshStandardMaterial({ map: planet1Texture });
const planet1 = new THREE.Mesh(planet1Geometry, planet1Material);
planet1.position.x = 10;
scene.add(planet1);

// Tạo hành tinh 2 (Blog - xanh) với texture
const planet2Texture = textureLoader.load('https://threejs.org/examples/textures/planets/mars.png'); // Thay bằng URL texture của bạn
const planet2Geometry = new THREE.SphereGeometry(1.5, 32, 32);
const planet2Material = new THREE.MeshStandardMaterial({ map: planet2Texture });
const planet2 = new THREE.Mesh(planet2Geometry, planet2Material);
planet2.position.x = 15;
scene.add(planet2);

// Tạo quỹ đạo elip cho hành tinh
let angle1 = 0;
let angle2 = 0;
const speed1 = 0.01;
const speed2 = 0.005;
const orbit1RadiusX = 10; // Bán kính trục X của quỹ đạo elip
const orbit1RadiusZ = 8;  // Bán kính trục Z của quỹ đạo elip
const orbit2RadiusX = 15;
const orbit2RadiusZ = 12;

// Tạo nền sao
const starsGeometry = new THREE.BufferGeometry();
const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff });

const starsVertices = [];
for (let i = 0; i < 1000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starsVertices.push(x, y, z);
}

starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

// Tương tác với hành tinh
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects([planet1, planet2]);

    if (intersects.length > 0) {
        const clickedPlanet = intersects[0].object;
        showContent(clickedPlanet);
    }
}

window.addEventListener('click', onMouseClick);

// Hiển thị nội dung khi nhấp vào hành tinh
function showContent(planet) {
    let title, text;
    if (planet === planet1) {
        title = "Dự án";
        text = "Nội dung về dự án...";
    } else if (planet === planet2) {
        title = "Blog";
        text = "Nội dung về blog...";
    }

    const contentWindow = document.getElementById('content-window');
    document.getElementById('content-title').innerText = title;
    document.getElementById('content-text').innerText = text;
    contentWindow.style.display = 'block';

    contentWindow.style.position = 'absolute';
    contentWindow.style.top = '50%';
    contentWindow.style.left = '50%';
    contentWindow.style.transform = 'translate(-50%, -50%)';
    contentWindow.style.background = 'rgba(0,0,0,0.8)';
    contentWindow.style.color = 'white';
    contentWindow.style.padding = '20px';
    contentWindow.style.zIndex = '100';
}

document.getElementById('launch-button').addEventListener('click', function() {
    console.log("Nút Khởi hành được bấm!");
    document.getElementById('content-window').style.display = 'none';
});

// Tích hợp Web3: Kết nối ví MetaMask
const connectWalletButton = document.getElementById('connect-wallet');
connectWalletButton.addEventListener('click', async () => {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner();
            const address = await signer.getAddress();
            connectWalletButton.innerText = `Đã kết nối: ${address.slice(0, 6)}...${address.slice(-4)}`;
            console.log("Địa chỉ ví:", address);
        } catch (error) {
            console.error("Lỗi khi kết nối ví:", error);
            connectWalletButton.innerText = "Kết nối thất bại";
        }
    } else {
        alert("Vui lòng cài đặt MetaMask!");
    }
});

// Vòng lặp animation
function animate() {
    requestAnimationFrame(animate);

    // Quỹ đạo elip
    angle1 += speed1;
    angle2 += speed2;
    planet1.position.x = orbit1RadiusX * Math.cos(angle1);
    planet1.position.z = orbit1RadiusZ * Math.sin(angle1);
    planet2.position.x = orbit2RadiusX * Math.cos(angle2);
    planet2.position.z = orbit2RadiusZ * Math.sin(angle2);

    // Xoay hành tinh
    sun.rotation.y += 0.01;
    planet1.rotation.y += 0.02;
    planet2.rotation.y += 0.015;

    controls.update();
    renderer.render(scene, camera);
}
animate();

// Xử lý resize cửa sổ
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});