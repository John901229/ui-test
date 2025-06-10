/// ✅ app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBSLCVS3oHZ6_M_xoPMvH2ihsbYUgfdTSo",
  authDomain: "pwa-checkin-4dbe1.firebaseapp.com",
  projectId: "pwa-checkin-4dbe1",
  storageBucket: "pwa-checkin-4dbe1.appspot.com",
  messagingSenderId: "467417750707",
  appId: "1:467417750707:web:1c165c3c6353db694c0d3f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function handlePunch(type) {
  let name = localStorage.getItem("username");
  if (!name || name.trim() === "") {
    name = prompt("請輸入您的姓名：");
    if (!name || name.trim() === "") {
      alert("⚠️ 請輸入有效的姓名再打卡！");
      return;
    }
    localStorage.setItem("username", name.trim());

  }

  if (!navigator.geolocation) {
    document.getElementById("status").innerText = "❌ 無法取得 GPS 位置。";
    return;
  }

  document.getElementById("status").innerHTML = "⏳ <b style='color:green'>處理中...</b>";

navigator.geolocation.getCurrentPosition(async (pos) => {
  const { latitude, longitude } = pos.coords;
  const isInside =
    Math.abs(latitude - 25.0982990) < 0.001 &&
    Math.abs(longitude - 121.7878391) < 0.001;

  if (!isInside) {
    document.getElementById("status").innerHTML = "❌ <b style='color:red'>GPS 不在指定範圍內，禁止打卡！</b>";
    return;
  }

  try {
    await addDoc(collection(db, "attendance"), {
      name,
      type,
      timestamp: serverTimestamp(),
      gps_status: "GPS 正常",
      location: { lat: latitude, lng: longitude }
    });
    document.getElementById("status").innerHTML = `✅ <b style='color:green'>${type === 'clockin' ? '上班' : '下班'} 打卡成功！</b>`;
  } catch (e) {
    document.getElementById("status").innerText = `❌ 上傳失敗：${e.message}`;
  }
}, () => {
  document.getElementById("status").innerText = "❌ GPS 取得失敗";
});
}

export async function loadRecords() {
  const list = document.getElementById("record-list");
  const username = localStorage.getItem("username");

  if (!username) {
    list.innerHTML = "<p>❌ 請先回首頁打卡並輸入姓名。</p>";
    return;
  }

  const q = query(
    collection(db, "attendance"),
    where("name", "==", username),
    orderBy("timestamp", "desc"),
    limit(20)
  );

  try {
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      list.innerHTML = "<p>📭 尚無打卡紀錄</p>";
      return;
    }

    let html = "";
snapshot.forEach((doc) => {
  const d = doc.data();
  const date = d.timestamp?.toDate().toLocaleString("zh-TW") || "N/A";
  const gpsEmoji = d.gps_status === "GPS 正常" ? "✅" : "❌";
  const rawType = d.type || "";
  const typeText = (rawType === "clockin" || rawType === "in") ? "上班" :
                   (rawType === "clockout" || rawType === "out") ? "下班" :
                   rawType;

  html += `
    <div class="log-card">
      <div class="line1">${d.name}｜${date}</div>
      <div class="line2">📍GPS：${d.gps_status} ｜ 類型：${typeText}</div>
    </div>
  `;
});
    list.innerHTML = html;
  } catch (e) {
    list.innerHTML = `<p>❌ 查詢錯誤：${e.message}</p>`;
  }
}
