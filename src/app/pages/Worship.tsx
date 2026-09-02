import { Youtube, BookOpen } from "lucide-react";
import { useState, useEffect } from "react"; // [수정] useState, useEffect 추가
import { doc, getDoc } from "firebase/firestore"; // [수정] Firebase 함수 추가
import { db } from "../../firebase";
import { useLocation, useNavigate } from "react-router-dom";

export default function Worship() {
    // [수정] DB에서 가져온 URL을 저장할 상태 추가
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const location = useLocation();
    const navigate = useNavigate();

    // 🔴 카카오톡 공유 미리보기(og:title)를 "/worship" 전용으로 바꾸기 위해
    // worship.html(정적 페이지, og 태그 포함) → /worship-app 으로 리다이렉트된 뒤
    // 여기서 다시 주소창을 /worship 으로 되돌림 (서버 재요청 없이 클라이언트 라우팅만 사용, 무한 루프 방지)
    useEffect(() => {
        if (location.pathname === '/worship-app') {
            navigate('/worship', { replace: true });
        }
    }, [location.pathname, navigate]);

    // [수정] 페이지 로드 시 DB의 URL 데이터 불러오기
    useEffect(() => {
        const fetchUrl = async () => {
            try {
                const docSnap = await getDoc(doc(db, "bulletin", "current"));
                if (docSnap.exists()) {
                    const urlFromDb = docSnap.data().youtubeId || "";
                    
                    // [수정: 입력된 주소가 http/https로 시작하는지 확인]
                    if (urlFromDb && !urlFromDb.startsWith("http://") && !urlFromDb.startsWith("https://")) {
                        setYoutubeUrl(`https://${urlFromDb}`); // [수정: 없으면 https:// 추가]
                    } else {
                        setYoutubeUrl(urlFromDb);
                    }
                }
            } catch (error) {
                console.error("URL 로드 실패:", error);
            }
        };
        fetchUrl();
    }, []);

    useEffect(() => {
        console.log("현재 youtubeUrl 값:", youtubeUrl);
    }, [youtubeUrl]);

    return (
        <div className="min-h-screen bg-[#F2F4F6] p-6 flex flex-col items-center justify-center">
            <div className="max-w-md w-full bg-white p-8 rounded-[32px] shadow-lg border border-[#F2F4F6] text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Youtube className="w-10 h-10 text-red-500" />
                </div>
                <h1 className="text-2xl font-black text-[#191F28] mb-2">곤지암 만나교회<br></br>이번주 찬양 듣기</h1>
                <p className="text-[#8B95A1] font-bold mb-8">주님의 은혜가 가득한<br></br>자리로 여러분을 초대합니다.</p>
                
                {/* [수정] href에 고정 주소 대신 youtubeUrl 상태값을 연결 */}
                {/* <a
                    href={youtubeUrl || "#"} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full h-[58px] bg-[#191F28] text-white rounded-[18px] font-black text-[17px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                    찬양 바로가기
                </a> */}

                <div className="space-y-3">
                    {/* [수정: 빨간색] 찬양 버튼: 강조된 Primary 스타일 */}
                    <a
                        href={youtubeUrl || "#"} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full h-[56px] bg-[#191F28] text-white rounded-[16px] font-bold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                    >
                        유튜브 찬양 바로가기
                    </a>

                    {/* [수정: 빨간색] 온라인 주보 버튼: 부드러운 Secondary 스타일 추가 */}
                    <a
                        href="https://mannayouthbulletinonline.web.app/" 
                        className="block w-full h-[56px] bg-[#F2F4F6] text-[#4E5968] rounded-[16px] font-bold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                    >
                        <BookOpen size={20} />
                        이번 주 온라인 주보 보기
                    </a>
                    <p className="mt-8 text-[#B0B8C1] text-[13px] font-medium">곤지암 만나교회 청년부</p>
                </div>
            </div>
        </div>
    );
}
