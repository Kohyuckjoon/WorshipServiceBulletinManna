// import { useState, useEffect } from 'react';
// import { db } from '../firebase'; // 우리가 만든 설정파일
// import { doc, onSnapshot } from "firebase/firestore";

// // Profile images import
// import imgPastor from "../assets/23b6ea5c163050d8d7280dcdba4dd396a2a33a46.png";
// import imgDeacon from "../assets/00ad4e427fa7ed6cd813e8c4cd690b7a86efc80f.png";
// import imgStaff from "../assets/db6dcd21d1e35f52c009a16c9dbf2efb299ee6ee.png";
// import imgPresident from "../assets/0dddf9e56cf8320357777233eabf71e06076128b.png";
// import imgSecretary1 from "../assets/34de46806c44451dbf82b1fa6b39733546054488.png";
// import imgTreasurer from "../assets/4f1e306d2329963fe6f2def993058c9cf7bca570.png";
// import imgSecretary2 from "../assets/c56259d571473b7473ecf24a207afa65b6540e85.png";


// import {
//   Home,
//   BookOpen,
//   Bell,
//   Users,
//   Instagram,
//   Youtube,
//   MapPin,
//   Copy,
//   PhoneCall,
//   MessageSquare,
//   ChevronDown,
//   ChevronRight,
//   User,
//   X,
//   ArrowUp,
//   Phone,
// } from 'lucide-react';

// // Background image import
// // import bulletinBg from "figma:asset/be99a7d60cdcd33e42197f11c749fa026cf46000.png";
// import bulletinBg from "../assets/manna_youth_background.png";

// // Data - Based on the bulletin image provided
// const communityConfession = [
//   "이 예배의 주인은 하나님이십니다.",
//   "오직는 하나님을 예배하기 위해 이 곳에 왔습니다.",
//   "하나님은 지금 여 곳에서 우리의 예배를 받으십니다.",
//   "하나님의 사랑을 우리에게 이루어냅니다.",
// ];

// const worshipOrder = [
//   { title: '공동체의 고백', time: '13:00 - 13:10', details: [] },
//   { title: '입례송', person: '다같이', details: [] },
//   {
//     title: '신앙고백', person: '사도신경', scripture: '시편 95:1-7', details: [
//       "1.(찬송)오라 우리가(식6)여호와 노래하여 우리 구원반석을 즐겁게 부르자",
//       "2.(찬송)우리가 하나님 앞에 나아가 감사함으로 그 앞에 즐겁게 부르자",
//       "3.(찬송)여호와는 크신 하나님이시요 모든 신들을 그의 것이라",
//       "4.(찬송)땅의 깊은 곳이 그의 손안에 있으며 산들의 높은 곳도 그의 것이로다",
//       "5.(찬송)바다가 그의 것이니 그가 만드셨고 그 손이 육지를 지으셨도다",
//       "6.(찬송)오라 우리가 경배하며 꿇어 엎드러 우리를 지으신 여호와 앞에 무릎을 꿇자",
//       "7.(합)임께임자나 나 길에 갈 때 하나님이 우리를 인도하시는 것을 감사합니다 그리고그리고기도하기도을 간청하니라",
//     ]
//   },
//   { title: '예배자의 고백', details: communityConfession },
//   {
//     title: '찬양', time: '13:10 - 13:30', details: [
//       '- 새 힘 얻으리 -',
//       '- 내 마음 다해 -',
//       '- 믿음에 믿음을 더하여 -'
//     ]
//   },
//   {
//     title: '말씀 선포 및 기도회', time: '13:30 - 14:20', highlight: true, details: [
//       { label: '말씀선포', person: '임원일 목사님' },
//       { label: '기도회', person: '찬양팀' },
//       { label: '교회 소식', person: '임원단' },
//       { label: '헌금 기도 및 축도', person: '임원일 목사님' },
//     ]
//   },
// ];

// const newsData = [
//   {
//     cat: '안내',
//     title: '새로 오신 청년들을',
//     date: '2026.03.01',
//     detail:
//       '하반기 사역을 준비하며 소그룹 리더들이 한자리에 모입니다. 비전 공유 및 팀별 교제의 시간이 준비되어 있습니다.<br>• 일시: 3월 30일(토) 오후 4시<br>• 장소: 제1교육관 2층',
//   },
//   {
//     cat: '행사',
//     title: '만나 청년부 봄 야유회 \'하나됨\'',
//     date: '2024.04.15',
//     detail:
//       '따스한 봄날, 자연 속에서 공동체의 기쁨을 나눕니다! 다양한 레크리에이션과 맛있는 점심 식사가 준비되어 있으니 모두 함께해요.<br>• 일시: 4월 20일(토) 오전 10시<br>• 신청: 각 소그룹 리더를 통해 신청',
//   },
//   {
//     cat: '교육',
//     title: '새가족 교육 4주 과정 개설',
//     date: '매주 주일',
//     detail:
//       '만나 청년부에 처음 오신 여러분을 환영합니다! 공동체의 가치와 신앙의 기초를 배우는 4주 과정에 참여해보세요.<br>• 장소: 새가족실 (오후 2시)<br>• 문의: 새가족팀장',
//   },
// ];

// const leaderData = [
//   { role: '담당', name: '임원일 목사님', phone: '010-6258-8105', img: imgPastor },
//   { role: '부장', name: '박양규 장로님', phone: '010-2277-9734', img: imgDeacon },
//   { role: '간사', name: '고혁준 간사님', phone: '010-9231-1175', img: imgStaff },
//   { role: '회장', name: '최지환 청년', phone: '010-3180-6322', img: imgPresident },
//   { role: '총무', name: '박은희 청년', phone: '010-5767-9734', img: imgSecretary1 },
//   { role: '회계', name: '배소연 청년', phone: '010-3646-4475', img: imgTreasurer },
//   { role: '서기', name: '김석진 청년', phone: '010-7164-4068', img: imgSecretary2 },
// ];

// const galleryData = [
//   {
//     title: '봄 야유회',
//     date: '2024.04',
//     image: 'https://images.unsplash.com/photo-1758274533219-cc0ef0af4f60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaHVyY2glMjB5b3V0aCUyMGdyb3VwJTIwb3V0ZG9vciUyMHBpY25pY3xlbnwxfHx8fDE3NzExMjcxMDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
//   },
//   {
//     title: '생일파티',
//     date: '2024.03',
//     image: 'https://images.unsplash.com/photo-1763951778440-13af353b122a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaXJ0aGRheSUyMHBhcnR5JTIwY2VsZWJyYXRpb24lMjB5b3VuZyUyMGFkdWx0c3xlbnwxfHx8fDE3NzExMjcxMDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
//   },
//   {
//     title: '찬양예배',
//     date: '2024.02',
//     image: 'https://images.unsplash.com/photo-1558541966-a801364c934b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaHVyY2glMjB3b3JzaGlwJTIwYmFuZCUyMHNpbmdpbmd8ZW58MXx8fHwxNzcxMTI3MTA4fDA&ixlib=rb-4.1.0&q=80&w=1080',
//   },
//   {
//     title: '모임',
//     date: '2024.01',
//     image: 'https://images.unsplash.com/photo-1730875650907-b988c91fe120?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmllbmRzJTIwZ3JvdXAlMjBnYXRoZXJpbmclMjBoYXBweXxlbnwxfHx8fDE3NzExMjcxMDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
//   },
//   {
//     title: '교제',
//     date: '2023.12',
//     image: 'https://images.unsplash.com/photo-1551327420-4b280d52cc68?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaHVyY2glMjBmZWxsb3dzaGlwJTIwY29tbXVuaXR5fGVufDF8fHx8MTc3MTEyNzEwOXww&ixlib=rb-4.1.0&q=80&w=1080',
//   },
//   {
//     title: '청년 축제',
//     date: '2023.11',
//     image: 'https://images.unsplash.com/photo-1759851684103-1fe22424d088?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3V0aCUyMGNlbGVicmF0aW9uJTIwdG9nZXRoZXJ8ZW58MXx8fHwxNzcxMTI3MTA5fDA&ixlib=rb-4.1.0&q=80&w=1080',
//   },
// ];

// export default function App() {
//   const [activeNewsIndex, setActiveNewsIndex] = useState<number | null>(null);
//   const [selectedLeader, setSelectedLeader] = useState<number | null>(null);
//   const [showToast, setShowToast] = useState(false);
//   const [showScrollTop, setShowScrollTop] = useState(false);
//   const [activeSection, setActiveSection] = useState('home');
//   const [bulletin, setBulletin] = useState<any>(null);

//   useEffect(() => {
//     // Firebase 리스너 연결
//     const unsub = onSnapshot(doc(db, "bulletin", "current"), (docSnap) => {
//       if (docSnap.exists()) {
//         // 서버에서 데이터가 오면 우리 그릇(setBulletin)에 담습니다.
//         setBulletin(docSnap.data());
//       }
//     });

//     const handleScroll = () => {
//       setShowScrollTop(window.scrollY > 300);

//       // 현재 스크롤 위치에 따라 활성 섹션 결정
//       const sections = ['worship', 'home', 'news', 'gallery', 'leaders'];
//       const scrollPosition = window.scrollY + 200; // 오프셋 추가

//       for (const sectionId of sections) {
//         const element = document.getElementById(sectionId);
//         if (element) {
//           const { offsetTop, offsetHeight } = element;
//           if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
//             setActiveSection(sectionId);
//             break;
//           }
//         }
//       }
//     };

//     window.addEventListener('scroll', handleScroll);

//     return () => {
//       window.removeEventListener('scroll', handleScroll);
//       unsub(); // Firebase 연결 끊기
//     };
//   }, []);

//   const scrollToSection = (id: string) => {
//     const element = document.getElementById(id);
//     if (element) {
//       element.scrollIntoView({ behavior: 'smooth' });
//     }
//   };

//   const scrollToTop = () => {
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   const toggleNews = (index: number) => {
//     setActiveNewsIndex(activeNewsIndex === index ? null : index);
//   };

//   const openProfile = (index: number) => {
//     setSelectedLeader(index);
//     document.body.style.overflow = 'hidden';
//   };

//   const closeProfile = () => {
//     setSelectedLeader(null);
//     document.body.style.overflow = 'auto';
//   };

//   const copyToClipboard = (text: string) => {
//     const tempInput = document.createElement('textarea');
//     tempInput.value = text;
//     document.body.appendChild(tempInput);
//     tempInput.select();
//     document.execCommand('copy');
//     document.body.removeChild(tempInput);

//     setShowToast(true);
//     setTimeout(() => {
//       setShowToast(false);
//     }, 2000);
//   };

//   const currentDate = new Date();
//   const monthYear = `${currentDate.getFullYear()}.${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

//   return (
//     <div className="bg-[#E8DDD5] text-slate-900 selection:bg-purple-200 pb-24">
//       {/* Header */}
//       <header className="sticky top-0 z-30 bg-[#9C8577]/90 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-[#8B7466] shadow-sm">
//         <div
//           className="flex items-center gap-2 cursor-pointer"
//           onClick={scrollToTop}
//         >

//           <span className="font-extrabold text-lg tracking-tight text-white">곤지암 만나교회 청년부</span>
//         </div>

//       </header>

//       {/* Main Content */}
//       <main className="px-4 pt-6 max-w-md mx-auto space-y-8">
//         {/* 1. Worship Section with Background - Moved to Top */}
//         <section id="worship" className="scroll-mt-24">
//           {/* Hero worship card with mountain background */}
//           <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl mb-6">
//             {/* Background Image */}
//             <div className="absolute inset-0">
//               <img
//                 src={bulletinBg}
//                 alt="Mountain background"
//                 className="w-full h-full object-cover"
//               />
//               <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50"></div>
//             </div>

//             {/* Content Overlay */}
//             <div className="relative z-10 p-8 min-h-[400px] flex flex-col justify-center text-white">
//               {/* Worship Message - Centered */}
//               <div className="text-center mb-8">
//                 {/* <p className="text-xs uppercase tracking-widest mb-3 opacity-90 font-[Arita_Dotum_KR]">2026.03.01</p> */}
//                 <p className="text-xs uppercase tracking-widest mb-3 opacity-90 font-[Arita_Dotum_KR]">{bulletin?.date || "2026.03.01"}</p>

//                 {/* <h1 className="text-3xl font-black leading-tight font-[Arita_Buri_KR] mx-[0px] mt-[30px] mb-[12px]">복음, 그리스도(3)<br />왕이신 그리스도</h1> */}
//                 <h1 className="text-3xl font-black leading-tight font-[Arita_Buri_KR] mx-[0px] mt-[30px] mb-[12px]">{bulletin?.title || "복음, 그리스도(10)\n왕이신 그리스도"}</h1>

//                 {/* <p className="text-base opacity-95 italic mt-2 font-[Arita_Dotum_KR]">누가복음 4:16-21</p> */}
//                 <p className="text-base opacity-95 italic mt-2 font-[Arita_Dotum_KR]">{bulletin?.scripture || "누가복음 4:16-21"}</p>
//               </div>

//               {/* Worship Order */}
//               <div className="bg-white/15 backdrop-blur-md rounded-2xl p-5 border border-white/20">
//                 <h3 className="font-bold mb-4 text-center opacity-90 text-[16px] font-[Arita_Dotum_KR]">예배 순서</h3>
//                 <div className="space-y-4 text-sm">
//                   <div className="flex justify-between items-center">
//                     <span className="opacity-90 font-[Arita_Dotum_KR]">입례송</span>
//                     <span className="font-bold font-[Arita_Dotum_KR]">다같이</span>
//                   </div>
//                   <div className="flex justify-between items-center">
//                     <span className="opacity-90">신앙고백</span>
//                     <span className="font-bold font-[Arita_Dotum_KR] text-[14px]">사도신경 / 시편 95:1-7</span>
//                   </div>
//                   <div className="flex justify-between items-center">
//                     <span className="opacity-90 font-[Arita_Dotum_KR] text-[14px]">예배자의 고백</span>
//                     <span className="font-bold text-[14px] font-[Arita_Dotum_KR]">다같이</span>
//                   </div>
//                   <div className="flex justify-between items-center">
//                     <span className="opacity-90 font-[Arita_Dotum_KR]">찬양</span>
//                     <span className="font-bold font-[Arita_Dotum_KR]">JOY 찬양팀</span>
//                   </div>
//                   <div className="flex justify-between items-center -mx-2 px-2 py-1 rounded">
//                     <span className="font-bold font-[Arita_Dotum_KR]">말씀선포</span>
//                     <span className="font-bold font-[Arita_Dotum_KR]">임원일 목사님</span>
//                   </div>
//                   <div className="flex justify-between items-center">
//                     <span className="opacity-90">봉헌</span>
//                     <span className="font-bold font-[Arita_Dotum_KR]">JOY 찬양팀</span>
//                   </div>
//                   <div className="flex justify-between items-center">
//                     <span className="opacity-90 font-[Arita_Dotum_KR]">교회 소식</span>
//                     <span className="font-bold font-[Arita_Dotum_KR]">김석진</span>
//                   </div>
//                   <div className="flex justify-between items-center">
//                     <span className="opacity-90 text-[14px] font-[Arita_Dotum_KR]">축도</span>
//                     <span className="font-bold font-[Arita_Dotum_KR]">임원일 목사님</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Offering Information */}
//           <div className="bg-[#4A3528] text-white rounded-3xl p-6 shadow-xl">
//             <div className="flex justify-between items-center mb-4">
//               <h3 className="font-bold text-lg tracking-tight">온라인 헌금 안내</h3>

//             </div>
//             <div className="bg-white/10 rounded-2xl p-4 mb-4 border border-white/5">
//               <p className="text-white/60 mb-1 uppercase text-[12px] font-[Noto_Sans_KR]">국민은행 | 곤지암 만나교회 </p>
//               <p className="text-xl font-black tracking-wider font-[Noto_Sans_KR] font-normal">633801-04-126716</p>
//             </div>
//             <button
//               onClick={() =>
//                 copyToClipboard('633801-04-126716')
//               }
//               className="w-full py-3.5 bg-[#9C8577] hover:bg-[#8B7466] rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg font-[Noto_Sans_KR]"
//             >
//               <Copy className="w-4 h-4" /> 계좌번호 복사하기
//             </button>
//           </div>
//         </section>

//         <hr className="border-[#9C8577]/20" />

//         {/* 2. Home Section - Simplified */}
//         <section id="home" className="fade-in scroll-mt-24">
//           {/* Community News Section */}
//           <div>
//             <div className="flex items-center justify-between mb-4">
//               <h2 className="text-2xl font-bold text-[#4A3528]">공동체 소식</h2>
//               <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">3월1주              </div>
//             </div>
//             <div className="space-y-3">
//               {/* 첫 번째 소식 - 안내 */}
//               <div className="bg-white rounded-2xl border border-[#9C8577]/20 shadow-sm overflow-hidden transition-all">
//                 <button
//                   onClick={() => toggleNews(0)}
//                   className="w-full p-5 flex items-start justify-between gap-3 text-left hover:bg-[#9C8577]/5 transition-colors"
//                 >
//                   <div className="flex-1">

//                     <h3 className="font-bold text-[#4A3528] mb-2 font-[Arita_Dotum_KR]">새로 오신 청년들을 진심으로 환영합니다!</h3>
//                     <p
//                       className={`text-sm text-slate-600 leading-relaxed font-[Arita_Dotum_KR] ${activeNewsIndex === 0 ? '' : 'line-clamp-2'
//                         }`}
//                     >등록을 원하시는분은 환영팀에게 말씀해주세요<br /><br /></p>
//                   </div>
//                   <ChevronDown
//                     className={`w-4 h-4 text-slate-300 shrink-0 mt-1 transition-transform ${activeNewsIndex === 0 ? 'rotate-180' : ''
//                       }`}
//                   />
//                 </button>
//               </div>

//               {/* 두 번째 소식 - 행사 */}
//               <div className="bg-white rounded-2xl border border-[#9C8577]/20 shadow-sm overflow-hidden transition-all">
//                 <button
//                   onClick={() => toggleNews(1)}
//                   className="w-full p-5 flex items-start justify-between gap-3 text-left hover:bg-[#9C8577]/5 transition-colors"
//                 >
//                   <div className="flex-1">

//                     <h3 className="font-bold text-[#4A3528] mb-2 font-[Arita_Dotum_KR]">소그룹 모임</h3>
//                     <p
//                       className={`text-sm text-slate-600 leading-relaxed font-[Arita_Dotum_KR] ${activeNewsIndex === 1 ? '' : 'line-clamp-2'
//                         }`}
//                     >
//                       예배 후 소그룹 모임이 있습니다. 함께 은혜를 나누고 돌아가시기 바랍니다.</p>
//                   </div>
//                   <ChevronDown
//                     className={`w-4 h-4 text-slate-300 shrink-0 mt-1 transition-transform ${activeNewsIndex === 1 ? 'rotate-180' : ''
//                       }`}
//                   />
//                 </button>
//               </div>

//               {/* 세 번째 소식 - 교육 */}
//               <div className="bg-white rounded-2xl border border-[#9C8577]/20 shadow-sm overflow-hidden transition-all">
//                 <button
//                   onClick={() => toggleNews(2)}
//                   className="w-full p-5 flex items-start justify-between gap-3 text-left hover:bg-[#9C8577]/5 transition-colors"
//                 >
//                   <div className="flex-1">

//                     <h3 className="font-bold text-[#4A3528] mb-2 font-[Arita_Dotum_KR]">3월 생일파티</h3>
//                     <p
//                       className={`text-sm text-slate-600 leading-relaxed font-[Arita_Dotum_KR] ${activeNewsIndex === 2 ? '' : 'line-clamp-2'
//                         }`}
//                     >다음주 주일(3월 8일) 청년부 예배 후 생일 파티가 있습니다.<br /><br /></p>
//                   </div>
//                   <ChevronDown
//                     className={`w-4 h-4 text-slate-300 shrink-0 mt-1 transition-transform ${activeNewsIndex === 2 ? 'rotate-180' : ''
//                       }`}
//                   />
//                 </button>
//               </div>

//               {/* 네 번째 소식 */}
//               <div className="bg-white rounded-2xl border border-[#9C8577]/20 shadow-sm overflow-hidden transition-all">
//                 <button
//                   onClick={() => toggleNews(3)}
//                   className="w-full p-5 flex items-start justify-between gap-3 text-left hover:bg-[#9C8577]/5 transition-colors"
//                 >
//                   <div className="flex-1">

//                     <h3 className="font-bold text-[#4A3528] mb-2 font-[Arita_Dotum_KR]">밥묵자</h3>
//                     <p
//                       className={`text-sm text-slate-600 leading-relaxed font-[Arita_Dotum_KR] ${activeNewsIndex === 3 ? '' : 'line-clamp-2'
//                         }`}
//                     >소그룹 별 밥묵자를 진행해주시기 바랍니다.</p>
//                   </div>
//                   <ChevronDown
//                     className={`w-4 h-4 text-slate-300 shrink-0 mt-1 transition-transform ${activeNewsIndex === 3 ? 'rotate-180' : ''
//                       }`}
//                   />
//                 </button>
//               </div>

//               {/* 다섯 번째 소식 */}
//               <div className="bg-white rounded-2xl border border-[#9C8577]/20 shadow-sm overflow-hidden transition-all">
//                 <button
//                   onClick={() => toggleNews(4)}
//                   className="w-full p-5 flex items-start justify-between gap-3 text-left hover:bg-[#9C8577]/5 transition-colors"
//                 >
//                   <div className="flex-1">

//                     <h3 className="font-bold text-[#4A3528] mb-2 font-[Arita_Dotum_KR]">모바일 주보</h3>
//                     <p
//                       className={`text-sm text-slate-600 leading-relaxed font-[Arita_Dotum_KR] ${activeNewsIndex === 4 ? '' : 'line-clamp-2'
//                         }`}
//                     >종이 주보 대신 모바일 주보를 도입합니다. 예배에 들어오시면서, QR을 통해 예배 순서와 교회 소식을 확인하실 수 있습니다.</p>
//                   </div>
//                   <ChevronDown
//                     className={`w-4 h-4 text-slate-300 shrink-0 mt-1 transition-transform ${activeNewsIndex === 4 ? 'rotate-180' : ''
//                       }`}
//                   />
//                 </button>
//               </div>

//               {/* 여섯 번째 소식 */}
//               <div className="bg-white rounded-2xl border border-[#9C8577]/20 shadow-sm overflow-hidden transition-all">
//                 <button
//                   onClick={() => toggleNews(5)}
//                   className="w-full p-5 flex items-start justify-between gap-3 text-left hover:bg-[#9C8577]/5 transition-colors"
//                 >
//                   <div className="flex-1">

//                     <h3 className="font-bold text-[#4A3528] mb-2 font-[Arita_Dotum_KR]">만나 청년 동아리 모집</h3>
//                     <p
//                       className={`text-sm text-slate-600 leading-relaxed font-[Arita_Dotum_KR] ${activeNewsIndex === 5 ? '' : 'line-clamp-2'
//                         }`}
//                     >상반기 동아리 모집을 시작합니다. 자세한 사항은 소그룹 별로 나가는 공지를 확인하여 신청해주시기 바랍니다.</p>
//                   </div>
//                   <ChevronDown
//                     className={`w-4 h-4 text-slate-300 shrink-0 mt-1 transition-transform ${activeNewsIndex === 5 ? 'rotate-180' : ''
//                       }`}
//                   />
//                 </button>
//               </div>

//               {/* 일곱 번째 소식 */}
//               <div className="bg-white rounded-2xl border border-[#9C8577]/20 shadow-sm overflow-hidden transition-all">
//                 <button
//                   onClick={() => toggleNews(6)}
//                   className="w-full p-5 flex items-start justify-between gap-3 text-left hover:bg-[#9C8577]/5 transition-colors"
//                 >
//                   <div className="flex-1">

//                     <h3 className="font-bold text-[#4A3528] mb-2 font-[Arita_Dotum_KR]">그루터기 기도회</h3>
//                     <p
//                       className={`text-sm text-slate-600 leading-relaxed font-[Arita_Dotum_KR] ${activeNewsIndex === 6 ? '' : 'line-clamp-2'
//                         }`}
//                     ><span className="font-bold">매월 마지막 주 금요일 오후 11시</span>에 그루터기 기도회가 있습니다. 3월 기도회는 27일이며 장소는 1층 교육관입니다.</p>
//                   </div>
//                   <ChevronDown
//                     className={`w-4 h-4 text-slate-300 shrink-0 mt-1 transition-transform ${activeNewsIndex === 6 ? 'rotate-180' : ''
//                       }`}
//                   />
//                 </button>
//               </div>

//               {/* 여덟 번째 소식 */}
//               <div className="bg-white rounded-2xl border border-[#9C8577]/20 shadow-sm overflow-hidden transition-all">
//                 <button
//                   onClick={() => toggleNews(7)}
//                   className="w-full p-5 flex items-start justify-between gap-3 text-left hover:bg-[#9C8577]/5 transition-colors"
//                 >
//                   <div className="flex-1">

//                     <h3 className="font-bold text-[#4A3528] mb-2 font-[Arita_Dotum_KR]">본당 청소</h3>
//                     <p
//                       className={`text-sm text-slate-600 leading-relaxed font-[Arita_Dotum_KR] ${activeNewsIndex === 7 ? '' : 'line-clamp-2'
//                         }`}
//                     >이번주 본당 청소는 최지환 셀입니다.</p>
//                   </div>
//                   <ChevronDown
//                     className={`w-4 h-4 text-slate-300 shrink-0 mt-1 transition-transform ${activeNewsIndex === 7 ? 'rotate-180' : ''
//                       }`}
//                   />
//                 </button>
//               </div>
//             </div>
//           </div>

//           <hr className="border-[#9C8577]/20 my-8" />

//           {/* Worship Info */}
//           <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#9C8577]/20 mb-6">
//             <div className="flex items-center gap-2 mb-3">
//               <div className="w-1 h-4 bg-[#8B7466] rounded-full"></div>
//               <h2 className="font-bold text-[#4A3528]">예배 안내</h2>
//             </div>
//             <div className="space-y-3">
//               <div className="flex items-start gap-3">

//                 <div>
//                   <p className="text-xs text-slate-500 font-bold mb-1">예배 시간</p>
//                   <p className="text-sm text-slate-800 font-bold">매주 주일 오후 1시</p>
//                 </div>
//               </div>
//               <div className="flex items-start gap-3">

//                 <div>
//                   <p className="text-xs text-slate-500 font-bold mb-1">예배 장소</p>
//                   <p className="text-sm text-slate-800 font-bold">곤지암 만나교회 2층 본당 (예루살렘홀)</p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Theme Verse */}
//           <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#9C8577]/20 mb-6">
//             <div className="flex items-center gap-2 mb-3">
//               <div className="w-1 h-4 bg-[#8B7466] rounded-full"></div>
//               <h2 className="font-bold text-[#4A3528]">주제 성구&nbsp;&nbsp;</h2>
//             </div>
//             <p className="text-slate-700 italic text-sm leading-relaxed mb-4">
//               "인자가 온 것은 섬김을 받으려 함이 아니라 도리어 섬기려 하고 자기
//               목숨을 많은 사람의 대속물로 주려 함이니라"
//             </p>
//             <p className="text-[#8B7466] text-xs font-bold text-right">
//               - 마가복음 10장 45절 -
//             </p>
//           </div>
//         </section>

//         <hr className="border-[#9C8577]/20" />

//         {/* Leaders Section */}
//         <section id="leaders" className="scroll-mt-24">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-2xl font-bold text-[#4A3528]">
//               섬기는 사람들
//             </h2>

//           </div>
//           <div className="bg-white rounded-3xl border border-[#9C8577]/20 shadow-sm overflow-hidden">
//             {/* 담당 목사님 */}
//             <div className="flex items-center justify-between p-5 border-b border-[#9C8577]/10 hover:bg-[#9C8577]/5 transition-colors cursor-pointer" onClick={() => openProfile(0)}>
//               <div className="flex items-center gap-4">
//                 <div className="w-10 h-10 rounded-full bg-[#9C8577]/10 flex items-center justify-center text-[#8B7466] border border-[#9C8577]/20 shrink-0 overflow-hidden">
//                   {leaderData[0].img ? (
//                     <img src={leaderData[0].img} alt={leaderData[0].name} className="w-full h-full object-cover" />
//                   ) : (
//                     <User className="w-5 h-5" />
//                   )}
//                 </div>
//                 <div>
//                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">담당 목사 </p>
//                   <p className="font-black text-[#4A3528] text-sm tracking-tight">임원일 목사님</p>
//                 </div>
//               </div>
//               <ChevronRight className="w-4 h-4 text-slate-200" />
//             </div>

//             {/* 장로님 */}
//             <div className="flex items-center justify-between p-5 border-b border-[#9C8577]/10 hover:bg-[#9C8577]/5 transition-colors cursor-pointer" onClick={() => openProfile(1)}>
//               <div className="flex items-center gap-4">
//                 <div className="w-10 h-10 rounded-full bg-[#9C8577]/10 flex items-center justify-center text-[#8B7466] border border-[#9C8577]/20 shrink-0 overflow-hidden">
//                   {leaderData[1].img ? (
//                     <img src={leaderData[1].img} alt={leaderData[1].name} className="w-full h-full object-cover" />
//                   ) : (
//                     <User className="w-5 h-5" />
//                   )}
//                 </div>
//                 <div>
//                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">부장</p>
//                   <p className="font-black text-[#4A3528] text-sm tracking-tight">박양규 장로님</p>
//                 </div>
//               </div>
//               <ChevronRight className="w-4 h-4 text-slate-200" />
//             </div>

//             {/* 간사님 */}
//             <div className="flex items-center justify-between p-5 border-b border-[#9C8577]/10 hover:bg-[#9C8577]/5 transition-colors cursor-pointer" onClick={() => openProfile(2)}>
//               <div className="flex items-center gap-4">
//                 <div className="w-10 h-10 rounded-full bg-[#9C8577]/10 flex items-center justify-center text-[#8B7466] border border-[#9C8577]/20 shrink-0 overflow-hidden">
//                   {leaderData[2].img ? (
//                     <img src={leaderData[2].img} alt={leaderData[2].name} className="w-full h-full object-cover" />
//                   ) : (
//                     <User className="w-5 h-5" />
//                   )}
//                 </div>
//                 <div>
//                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">간사</p>
//                   <p className="font-black text-[#4A3528] text-sm tracking-tight">고혁준 간사님</p>
//                 </div>
//               </div>
//               <ChevronRight className="w-4 h-4 text-slate-200" />
//             </div>

//             {/* 회장 */}
//             <div className="flex items-center justify-between p-5 border-b border-[#9C8577]/10 hover:bg-[#9C8577]/5 transition-colors cursor-pointer" onClick={() => openProfile(3)}>
//               <div className="flex items-center gap-4">
//                 <div className="w-10 h-10 rounded-full bg-[#9C8577]/10 flex items-center justify-center text-[#8B7466] border border-[#9C8577]/20 shrink-0 overflow-hidden">
//                   {leaderData[3].img ? (
//                     <img src={leaderData[3].img} alt={leaderData[3].name} className="w-full h-full object-cover" />
//                   ) : (
//                     <User className="w-5 h-5" />
//                   )}
//                 </div>
//                 <div>
//                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">회장</p>
//                   <p className="font-black text-[#4A3528] text-sm tracking-tight">최지환 청년</p>
//                 </div>
//               </div>
//               <ChevronRight className="w-4 h-4 text-slate-200" />
//             </div>

//             {/* 총무 */}
//             <div className="flex items-center justify-between p-5 border-b border-[#9C8577]/10 hover:bg-[#9C8577]/5 transition-colors cursor-pointer" onClick={() => openProfile(4)}>
//               <div className="flex items-center gap-4">
//                 <div className="w-10 h-10 rounded-full bg-[#9C8577]/10 flex items-center justify-center text-[#8B7466] border border-[#9C8577]/20 shrink-0 overflow-hidden">
//                   {leaderData[4].img ? (
//                     <img src={leaderData[4].img} alt={leaderData[4].name} className="w-full h-full object-cover" />
//                   ) : (
//                     <User className="w-5 h-5" />
//                   )}
//                 </div>
//                 <div>
//                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">총무</p>
//                   <p className="font-black text-[#4A3528] text-sm tracking-tight">박은희 청년</p>
//                 </div>
//               </div>
//               <ChevronRight className="w-4 h-4 text-slate-200" />
//             </div>

//             {/* 회계 */}
//             <div className="flex items-center justify-between p-5 border-b border-[#9C8577]/10 hover:bg-[#9C8577]/5 transition-colors cursor-pointer" onClick={() => openProfile(5)}>
//               <div className="flex items-center gap-4">
//                 <div className="w-10 h-10 rounded-full bg-[#9C8577]/10 flex items-center justify-center text-[#8B7466] border border-[#9C8577]/20 shrink-0 overflow-hidden">
//                   {leaderData[5].img ? (
//                     <img src={leaderData[5].img} alt={leaderData[5].name} className="w-full h-full object-cover" />
//                   ) : (
//                     <User className="w-5 h-5" />
//                   )}
//                 </div>
//                 <div>
//                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">회계</p>
//                   <p className="font-black text-[#4A3528] text-sm tracking-tight">배소연 청년</p>
//                 </div>
//               </div>
//               <ChevronRight className="w-4 h-4 text-slate-200" />
//             </div>

//             {/* 서기 */}
//             <div className="flex items-center justify-between p-5 border-b border-[#9C8577]/10 last:border-0 hover:bg-[#9C8577]/5 transition-colors cursor-pointer" onClick={() => openProfile(6)}>
//               <div className="flex items-center gap-4">
//                 <div className="w-10 h-10 rounded-full bg-[#9C8577]/10 flex items-center justify-center text-[#8B7466] border border-[#9C8577]/20 shrink-0 overflow-hidden">
//                   {leaderData[6].img ? (
//                     <img src={leaderData[6].img} alt={leaderData[6].name} className="w-full h-full object-cover" />
//                   ) : (
//                     <User className="w-5 h-5" />
//                   )}
//                 </div>
//                 <div>
//                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">서기</p>
//                   <p className="font-black text-[#4A3528] text-sm tracking-tight">김석진 청년</p>
//                 </div>
//               </div>
//               <ChevronRight className="w-4 h-4 text-slate-200" />
//             </div>
//           </div>
//         </section>

//         <hr className="border-[#9C8577]/20" />

//         {/* Social Links */}
//         <section className="fade-in">

//           <div className="grid grid-cols-2 gap-4">
//             <a
//               href="https://www.instagram.com/manna_youthgroup/"
//               target="_blank"
//               rel="noopener noreferrer"
//               className="bg-white p-4 rounded-2xl border border-[#9C8577]/20 flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-transform"
//             >
//               <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-pink-500">
//                 <Instagram className="w-5 h-5" />
//               </div>
//               <span className="text-xs font-bold text-slate-700">
//                 인스타그램
//               </span>
//             </a>
//             <a
//               href="https://www.youtube.com/@곤지암만나교회"
//               target="_blank"
//               rel="noopener noreferrer"
//               className="bg-white p-4 rounded-2xl border border-[#9C8577]/20 flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-transform"
//             >
//               <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
//                 <Youtube className="w-5 h-5" />
//               </div>
//               <span className="text-xs font-bold text-slate-700">
//                 유튜브 채널
//               </span>
//             </a>
//           </div>
//         </section>

//         <footer className="text-center py-12">

//           <p className="text-[#9C8577] text-[10px] font-medium">섬김으로 하나님 나라를 세워가는 만나 청년부</p>
//         </footer>
//       </main>

//       <div
//         id="profile-modal"
//         className={`fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#4A3528]/60 backdrop-blur-sm ${selectedLeader === null ? 'hidden' : ''
//           }`}
//         onClick={(e) => {
//           if (e.target === e.currentTarget) closeProfile();
//         }}
//       >
//         {selectedLeader !== null && (
//           <div
//             id="profile-card"
//             className="bg-white w-full max-w-xs rounded-[2.5rem] overflow-hidden shadow-2xl relative"
//           >
//             <button
//               onClick={closeProfile}
//               className="absolute top-5 right-5 z-10 w-8 h-8 bg-white/90 text-slate-400 rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-lg"
//             >
//               <X className="w-4 h-4" />
//             </button>

//             {/* Profile Image - Rectangle */}
//             <div className="relative w-full aspect-[3/4] bg-gradient-to-br from-[#9C8577]/20 to-[#E8DDD5] overflow-hidden">
//               {leaderData[selectedLeader].img ? (
//                 <img
//                   src={leaderData[selectedLeader].img}
//                   alt={leaderData[selectedLeader].name}
//                   className="w-full h-full object-cover"
//                 />
//               ) : (
//                 <div className="w-full h-full flex items-center justify-center">
//                   <User className="w-24 h-24 text-slate-300" />
//                 </div>
//               )}
//             </div>

//             <div className="p-8">
//               {/* Name and Role */}
//               <div className="text-center mb-6">
//                 <p className="text-[#8B7466] text-xs font-black uppercase tracking-[0.2em] mb-2">
//                   {leaderData[selectedLeader].role}
//                 </p>
//                 <h3 className="text-2xl font-black text-[#4A3528]">
//                   {leaderData[selectedLeader].name}
//                 </h3>
//               </div>

//               {/* Phone Number Display */}
//               <div className="flex items-center justify-center gap-2 bg-slate-50 py-3 rounded-2xl mb-4">
//                 <Phone className="w-4 h-4 text-slate-400" />
//                 <span className="text-slate-600 font-bold tracking-wider">
//                   {leaderData[selectedLeader].phone}
//                 </span>
//               </div>

//               {/* Action Buttons */}
//               <div className="grid grid-cols-2 gap-3">
//                 <a
//                   href={`tel:${leaderData[selectedLeader].phone}`}
//                   className="bg-[#9C8577] hover:bg-[#8B7466] text-white py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
//                 >
//                   <PhoneCall className="w-4 h-4" />
//                   <span className="font-bold text-sm">전화하기</span>
//                 </a>
//                 <a
//                   href={`sms:${leaderData[selectedLeader].phone}`}
//                   className="bg-[#4A3528] hover:bg-[#3A2518] text-white py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
//                 >
//                   <MessageSquare className="w-4 h-4" />
//                   <span className="font-bold text-sm">문자하기</span>
//                 </a>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>


//       {/* Scroll to Top Button */}
//       <button
//         onClick={scrollToTop}
//         className={`fixed bottom-6 right-6 w-10 h-10 bg-white border border-[#9C8577]/30 rounded-full shadow-lg flex items-center justify-center text-[#8B7466] z-50 transition-opacity active:scale-90 ${showScrollTop ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
//           }`}
//       >
//         <ArrowUp className="w-5 h-5" />
//       </button>

//       {/* Toast Notification */}
//       <div
//         className={`fixed left-1/2 -translate-x-1/2 top-20 z-50 bg-[#4A3528] text-white px-6 py-3 rounded-full text-sm font-bold shadow-xl transition-all duration-300 pointer-events-none ${showToast ? 'opacity-100' : 'opacity-0'
//           }`}
//       >
//         계좌번호가 복사되었습니다!
//       </div>
//     </div>
//   );
// }

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Admin from '../pages/Admin/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}