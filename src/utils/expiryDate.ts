// 노출 마감 날짜 설정 공용 유틸 (찬양 예배 버튼, 광고 배너 등 여러 곳에서 재사용)

// "YYYY-MM-DD" + 시/분/초 문자열을 실제 Date로 조합 (시=24 입력 시 자동으로 다음날 00시로 정규화됨)
export function buildExpiryDate(dateStr: string, hour: string, minute: string, second: string): Date | null {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d, Number(hour), Number(minute), Number(second));
}

// 마감 설정이 켜져 있고, 마감 시각(ISO 문자열)이 이미 지났는지 여부
export function isExpired(expiryEnabled: boolean | undefined, expiryAtIso: string | null | undefined): boolean {
    if (!expiryEnabled || !expiryAtIso) return false;
    return new Date(expiryAtIso).getTime() <= Date.now();
}
