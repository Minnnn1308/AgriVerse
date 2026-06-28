package agtech.models;

/**
 * FarmBlock — Model cho 1 ô đất trong bản đồ ruộng.
 * Chứa toàn bộ dữ liệu cảm biến + hỗ trợ Strategy Pattern cho bón phân.
 */
public class FarmBlock {
    private String blockId;
    private double soilMoisture;  // 0-100%
    private double temperature;   // °C
    private double n, p, k;       // NPK 0-100%
    private double ph;            // 0-14
    private double pest;          // 0-100%
    private String status;        // HEALTHY, THIRSTY, PEST, etc.

    // Strategy Pattern — chiến lược bón phân có thể thay đổi runtime
    private agtech.strategies.FertilizerStrategy fertilizerStrategy;

    public FarmBlock(String blockId) {
        this.blockId = blockId;
        this.soilMoisture = 65.0;
        this.temperature = 25.0;
        this.n = 70; this.p = 70; this.k = 70;
        this.ph = 6.0;
        this.pest = 5.0;
        this.status = "HEALTHY";
    }

    // --- Getters ---
    public String getBlockId() { return blockId; }
    public double getSoilMoisture() { return soilMoisture; }
    public double getTemperature() { return temperature; }
    public double getN() { return n; }
    public double getP() { return p; }
    public double getK() { return k; }
    public double getPh() { return ph; }
    public double getPest() { return pest; }
    public String getStatus() { return status; }

    // --- Setters ---
    public void setSoilMoisture(double v) { this.soilMoisture = Math.max(0, Math.min(100, v)); }
    public void setTemperature(double v) { this.temperature = v; }
    public void setN(double v) { this.n = Math.max(0, Math.min(100, v)); }
    public void setP(double v) { this.p = Math.max(0, Math.min(100, v)); }
    public void setK(double v) { this.k = Math.max(0, Math.min(100, v)); }
    public void setPh(double v) { this.ph = Math.max(0, Math.min(14, v)); }
    public void setPest(double v) { this.pest = Math.max(0, Math.min(100, v)); }
    public void setStatus(String s) { this.status = s; }

    // --- Strategy Pattern ---
    public void setFertilizerStrategy(agtech.strategies.FertilizerStrategy strategy) {
        this.fertilizerStrategy = strategy;
    }

    public void applyFertilizer() {
        if (fertilizerStrategy != null) {
            fertilizerStrategy.applyFertilizer(this);
        } else {
            System.out.println("⚠️ Chưa chọn loại phân bón!");
        }
    }

    /**
     * Tự động đánh giá trạng thái ô đất dựa trên thông số.
     */
    public String evaluateStatus() {
        if (pest > 30) status = "PEST";
        else if (soilMoisture < 50) status = "THIRSTY";
        else if (soilMoisture > 85) status = "WATERLOGGED";
        else if (ph < 5.0) status = "ACIDIC";
        else if (n < 50 || p < 50 || k < 50) status = "NUTRIENT_DEFICIENT";
        else if (n > 80 && p > 80 && k > 80 && soilMoisture >= 60 && soilMoisture <= 80 && pest < 10)
            status = "READY_TO_HARVEST";
        else status = "HEALTHY";
        return status;
    }

    @Override
    public String toString() {
        return "[" + blockId + "] " + status + " | Ẩm:" + soilMoisture + "% NPK:" + n + "/" + p + "/" + k 
            + " pH:" + ph + " Sâu:" + pest + "%";
    }
}
