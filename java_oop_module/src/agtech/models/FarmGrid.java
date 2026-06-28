package agtech.models;

public class FarmGrid {
    private FarmBlock[][] grid;
    private int rows;
    private int cols;

    public FarmGrid(int rows, int cols) {
        this.rows = rows;
        this.cols = cols;
        grid = new FarmBlock[rows][cols];
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                grid[i][j] = new FarmBlock("B-" + i + "-" + j);
            }
        }
    }

    /**
     * Thuật toán lan truyền (Spread Simulation / Inverse Distance Weighting).
     * Áp dụng kết quả đo lường tổng thể (Macro Input) và lan truyền ra các ô xung quanh.
     */
    public void applyMacroMeasurement(int centerRow, int centerCol, double measuredMoisture) {
        System.out.println("\n[Sổ Đo Lường] Bắt đầu lan truyền độ ẩm " + measuredMoisture + "% từ tọa độ (" + centerRow + "," + centerCol + ")...");
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                // Tính khoảng cách Euclid
                double distance = Math.sqrt(Math.pow(i - centerRow, 2) + Math.pow(j - centerCol, 2));
                
                // Suy giảm độ ẩm theo khoảng cách (Giả lập)
                // Khoảng cách càng xa, ảnh hưởng của kết quả đo càng giảm
                double decayFactor = Math.max(0, 1.0 - (distance * 0.15)); // Giảm 15% mỗi đơn vị khoảng cách
                
                // Độ ẩm ban đầu của ô
                double currentMoisture = grid[i][j].getSoilMoisture();
                
                // Độ ẩm mới = Độ ẩm ban đầu * (1 - decayFactor) + Độ ẩm đo được * decayFactor
                double newMoisture = currentMoisture * (1 - decayFactor) + measuredMoisture * decayFactor;
                grid[i][j].setSoilMoisture(newMoisture);
                grid[i][j].evaluateStatus();
            }
        }
    }

    public void printGridStatus() {
        System.out.println("--- Bản đồ Độ ẩm (Heatmap) ---");
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                double moist = grid[i][j].getSoilMoisture();
                String icon = moist < 50 ? "🟥" : (moist > 80 ? "🟦" : "🟩");
                System.out.printf("%s %.1f%%  ", icon, moist);
            }
            System.out.println();
        }
    }

    public FarmBlock getBlock(int row, int col) {
        return grid[row][col];
    }
}
