import React, { useCallback, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

// window.alert / window.confirm 대신 쓰는 관리자 페이지 스타일 팝업
//   const { dialog, showAlert, showConfirm } = useAdminDialog();
//   if (await showConfirm({ title: "삭제할까요?" })) { ... }
//   return <>{dialog} ...</>

type Tone = "info" | "success" | "danger";

interface DialogOptions {
    title: string;
    message?: React.ReactNode;
    tone?: Tone;
    confirmText?: string;
    cancelText?: string;
}

interface DialogState extends DialogOptions {
    kind: "alert" | "confirm";
}

const TONE: Record<Tone, { icon: typeof Info; bg: string; fg: string; button: string }> = {
    info: { icon: Info, bg: "bg-[#E8F3FF]", fg: "text-[#3182F6]", button: "bg-[#3182F6] hover:bg-[#2D77E5] shadow-blue-100" },
    success: { icon: CheckCircle2, bg: "bg-[#E8F3FF]", fg: "text-[#3182F6]", button: "bg-[#3182F6] hover:bg-[#2D77E5] shadow-blue-100" },
    danger: { icon: AlertCircle, bg: "bg-[#FFF0F0]", fg: "text-[#F04452]", button: "bg-[#F04452] hover:bg-[#E03442] shadow-red-100" },
};

export function useAdminDialog() {
    const [state, setState] = useState<DialogState | null>(null);
    const resolver = useRef<((value: boolean) => void) | null>(null);

    const open = useCallback((kind: DialogState["kind"], options: DialogOptions) => {
        resolver.current?.(false);
        setState({ kind, ...options });
        return new Promise<boolean>((resolve) => { resolver.current = resolve; });
    }, []);

    const close = (value: boolean) => {
        resolver.current?.(value);
        resolver.current = null;
        setState(null);
    };

    const showAlert = useCallback((options: DialogOptions) => open("alert", options).then(() => undefined), [open]);
    const showConfirm = useCallback((options: DialogOptions) => open("confirm", options), [open]);

    const tone = TONE[state?.tone ?? "info"];
    const Icon = tone.icon;

    const dialog = state && (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300"
            onClick={() => close(false)}
        >
            <div
                role="dialog"
                aria-modal="true"
                className="bg-white rounded-[32px] p-8 max-w-[340px] w-full text-center shadow-[0_20px_50px_rgba(0,0,0,0.1)] animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-center mb-6">
                    <div className={`w-16 h-16 ${tone.bg} rounded-full flex items-center justify-center`}>
                        <Icon size={32} className={tone.fg} strokeWidth={2.5} />
                    </div>
                </div>
                <h2 className="text-[21px] font-black text-[#191F28] mb-2 tracking-tighter leading-snug">{state.title}</h2>
                {state.message && (
                    <div className="text-[#4E5968] font-bold text-[15px] leading-relaxed mb-8 whitespace-pre-line">{state.message}</div>
                )}
                {!state.message && <div className="mb-6" />}
                <div className="flex gap-3">
                    {state.kind === "confirm" && (
                        <button
                            onClick={() => close(false)}
                            className="flex-1 h-[56px] bg-[#F2F4F6] text-[#4E5968] rounded-[18px] font-black text-[16px] active:scale-[0.96] transition-all duration-200"
                        >
                            {state.cancelText ?? "취소"}
                        </button>
                    )}
                    <button
                        autoFocus
                        onClick={() => close(true)}
                        className={`flex-1 h-[56px] text-white rounded-[18px] font-black text-[16px] shadow-lg active:scale-[0.96] transition-all duration-200 ${tone.button}`}
                    >
                        {state.confirmText ?? "확인"}
                    </button>
                </div>
            </div>
        </div>
    );

    return { dialog, showAlert, showConfirm };
}
