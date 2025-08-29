// ----------------- CONFIGURAR FIREBASE -----------------
const firebaseConfig = {
    apiKey: "AIzaSyBG5s2PbWfl53BEuYxvDPNnKuizgPRFwAE",
    authDomain: "refugios-para-el-alma.firebaseapp.com",
    projectId: "refugios-para-el-alma",
    storageBucket: "refugios-para-el-alma.firebasestorage.app",
    messagingSenderId: "35504803245",
    appId: "1:35504803245:web:8e40262fa5f19c6a436524",
    measurementId: "G-0368JE9TDX"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ----------------- MAPA -----------------
var map = L.map('map').setView([4.5709, -74.2973], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Geocoder (barra de búsqueda)
L.Control.geocoder({
    defaultMarkGeocode: false
}).on('markgeocode', function(e) {
    var latlng = e.geocode.center;
    map.setView(latlng, 15);
    tempMarker.setLatLng(latlng);
    tempMarker.setOpacity(1);
    selectedLatLng = latlng;
}).addTo(map);

// Marcador temporal
var tempMarker = L.marker([0, 0], { draggable: true }).addTo(map);
tempMarker.setOpacity(0);
var selectedLatLng = null;

map.on('click', function(e) {
    selectedLatLng = e.latlng;
    tempMarker.setLatLng(selectedLatLng);
    tempMarker.setOpacity(1);
});

// ----------------- VARIABLES GLOBALES -----------------
const refugiosList = document.getElementById('refugiosList');
const contador = document.getElementById('contador');
const filtroInput = document.getElementById('filtro');
let refugiosData = []; // guardará todos los refugios

// ----------------- FUNCION PARA AGREGAR MARCADOR -----------------
function addEmojiMarker(lat, lng, emoji, comment, name, date) {
    let fechaFormateada = new Date(date).toLocaleString();

    var emojiIcon = L.divIcon({
        className: 'emoji-icon',
        html: `<div style="font-size: 2rem;">${emoji}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    L.marker([lat, lng], { icon: emojiIcon })
        .addTo(map)
        .bindPopup(`<p>${comment}</p><small>Por ${name}</small><br><small>📅 ${fechaFormateada}</small>`);
}

// ----------------- RENDERIZAR LISTA -----------------
function renderRefugiosLista() {
    refugiosList.innerHTML = "";
    let filtro = filtroInput.value.toLowerCase();

    let filtrados = refugiosData.filter(r =>
        r.emoji.toLowerCase().includes(filtro) ||
        r.comment.toLowerCase().includes(filtro) ||
        r.name.toLowerCase().includes(filtro)
    );

    filtrados.forEach(data => {
        let fechaFormateada = new Date(data.date).toLocaleString();
        let li = document.createElement('li');
        li.innerHTML = `${data.emoji} <strong>${data.comment}</strong><br>
                        <small>Por ${data.name} - ${fechaFormateada}</small>`;
        refugiosList.appendChild(li);
    });

    contador.textContent = `Total: ${filtrados.length}`;
}

filtroInput.addEventListener("input", renderRefugiosLista);

// ----------------- BOTÓN FLOTANTE Y MODAL -----------------
const btnFlotante = document.getElementById("btnFlotante");
const modal = document.getElementById("modalRefugio");
const cerrarModal = document.getElementById("cerrarModal");
const guardarRefugio = document.getElementById("guardarRefugio");

btnFlotante.addEventListener("click", () => { modal.style.display = "block"; });
cerrarModal.addEventListener("click", () => { modal.style.display = "none"; });
window.addEventListener("click", (e) => { if (e.target == modal) modal.style.display = "none"; });

// Guardar en Firebase
guardarRefugio.addEventListener("click", () => {
    let emoji = document.getElementById("emojiSelect").value;
    let comment = document.getElementById("comentarioInput").value.trim();
    let name = document.getElementById("nombreInput").value.trim();

    if (!selectedLatLng) {
        alert("📍 Selecciona un lugar en el mapa.");
        return;
    }
    if (!comment) {
        alert("✍️ Escribe un comentario.");
        return;
    }

    db.collection("refugios").add({
        lat: selectedLatLng.lat,
        lng: selectedLatLng.lng,
        emoji: emoji,
        comment: comment,
        name: name || "Anónimo",
        date: Date.now()
    }).then(() => {
        modal.style.display = "none";
        document.getElementById("comentarioInput").value = "";
        document.getElementById("nombreInput").value = "";
        tempMarker.setOpacity(0);
        selectedLatLng = null;
    });
});

// ----------------- CARGAR EN TIEMPO REAL -----------------
db.collection("refugios").orderBy("date").onSnapshot((snapshot) => {
    refugiosData = [];
    refugiosList.innerHTML = "";
    snapshot.forEach(doc => {
        let data = doc.data();
        addEmojiMarker(data.lat, data.lng, data.emoji, data.comment, data.name, data.date);
        refugiosData.push(data);
    });
    renderRefugiosLista();
});
