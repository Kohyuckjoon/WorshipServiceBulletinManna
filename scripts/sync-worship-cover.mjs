// 🔴 관리자페이지에서 업로드한 "찬양 링크 커버 이미지"(Firestore siteMeta/worshipCover)를
// 카카오톡이 실제로 읽을 수 있는 정적 파일(public/worship_cover.jpg)로 내려받는 스크립트.
//
// 카카오톡 등 링크 미리보기 크롤러는 자바스크립트를 실행하지 않고 og:image에 적힌 실제 파일 URL만
// 그대로 읽기 때문에, Firestore에 저장된 이미지를 빌드 시점에 파일로 "구워서" 배포해야 한다.
// (Storage/Functions 같은 유료 기능 없이, Firestore(무료) + 빌드 시 동기화로 해결)
//
// package.json의 "build" 스크립트에서 vite build보다 먼저 실행되도록 연결되어 있어서,
// 관리자가 새 이미지를 저장한 뒤 "npm run build && firebase deploy"(=배포)를 한 번 하면
// 그 시점의 최신 이미지로 카카오톡 미리보기가 자동으로 갱신된다.

import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { writeFileSync, existsSync, copyFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "..", "public", "worship_cover.jpg");
const fallbackPath = join(__dirname, "..", "public", "manna_logo.png");

// src/firebase.ts와 동일한 공개 클라이언트 설정 (비밀키 아님, 프론트엔드에 이미 노출되는 값)
const firebaseConfig = {
    apiKey: "AIzaSyB1jAZI4vimjNIMNUUwScSAdcSUMiZdmcQ",
    authDomain: "mannayouthbulletinonline.firebaseapp.com",
    projectId: "mannayouthbulletinonline",
    storageBucket: "mannayouthbulletinonline.firebasestorage.app",
    messagingSenderId: "905546238842",
    appId: "1:905546238842:web:1ce99f67b822096a0a24c3",
};

async function main() {
    try {
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        const snap = await getDoc(doc(db, "siteMeta", "worshipCover"));
        const imageUrl = snap.exists() ? snap.data().imageUrl : "";

        if (imageUrl && imageUrl.startsWith("data:")) {
            const base64 = imageUrl.split(",")[1];
            writeFileSync(outPath, Buffer.from(base64, "base64"));
            console.log("[sync-worship-cover] 관리자페이지에 저장된 이미지로 worship_cover.jpg 갱신 완료");
            return;
        }

        console.log("[sync-worship-cover] 등록된 커버 이미지가 없어 기본 로고로 대체합니다.");
    } catch (err) {
        console.warn("[sync-worship-cover] Firestore에서 커버 이미지를 불러오지 못했습니다:", err?.message || err);
    }

    // 등록된 이미지가 없거나 실패한 경우, 기존 파일이 있으면 그대로 두고 없으면 로고로 대체
    if (!existsSync(outPath)) {
        copyFileSync(fallbackPath, outPath);
        console.log("[sync-worship-cover] worship_cover.jpg가 없어 기본 로고를 복사했습니다.");
    }
}

main();
