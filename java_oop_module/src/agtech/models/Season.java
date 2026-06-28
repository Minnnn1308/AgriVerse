package agtech.models;

/**
 * Enum Season — Đại diện cho 4 mùa vụ nông nghiệp Việt Nam.
 * Mỗi mùa có hệ số thưởng riêng, phù hợp thực tế canh tác.
 */
public enum Season {
    SPRING("Xuân", "🌸", 1.2, "Mùa gieo trồng — thời tiết ấm, mưa phùn"),
    SUMMER("Hè", "☀️", 1.0, "Mùa nắng nóng — cần tưới tiêu, chống sâu rầy"),
    AUTUMN("Thu", "🍂", 1.5, "Mùa thu hoạch — sản lượng cao nhất"),
    WINTER("Đông", "❄️", 0.8, "Mùa nghỉ ngơi — cải tạo đất, ủ phân chuồng");

    private final String nameVn;
    private final String icon;
    private final double bonusMultiplier;
    private final String description;

    Season(String nameVn, String icon, double bonusMultiplier, String description) {
        this.nameVn = nameVn;
        this.icon = icon;
        this.bonusMultiplier = bonusMultiplier;
        this.description = description;
    }

    public String getNameVn() { return nameVn; }
    public String getIcon() { return icon; }
    public double getBonusMultiplier() { return bonusMultiplier; }
    public String getDescription() { return description; }

    /**
     * Tự động xác định mùa dựa trên tháng hiện tại (lịch nông nghiệp VN).
     */
    public static Season fromMonth(int month) {
        if (month >= 2 && month <= 4) return SPRING;
        if (month >= 5 && month <= 7) return SUMMER;
        if (month >= 8 && month <= 10) return AUTUMN;
        return WINTER;
    }

    @Override
    public String toString() {
        return icon + " Mùa " + nameVn + " (x" + bonusMultiplier + ")";
    }
}
