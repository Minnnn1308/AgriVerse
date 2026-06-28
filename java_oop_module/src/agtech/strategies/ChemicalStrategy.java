package agtech.strategies;

import agtech.models.FarmBlock;

/**
 * ChemicalStrategy — Chiến lược bón phân hóa học (NPK, Urê...).
 * Tăng NPK nhanh mạnh nhưng gây chai đất, hạ pH, dụ sâu rầy.
 * Phổ biến nhất ở nông dân VN hiện tại — cần cảnh báo tác hại.
 */
public class ChemicalStrategy implements FertilizerStrategy {
    
    @Override
    public void applyFertilizer(FarmBlock block) {
        System.out.println("🧪 Bón phân HÓA HỌC (NPK 16-16-8) cho ô [" + block.getBlockId() + "]");
        
        // Tăng NPK nhanh mạnh
        block.setN(block.getN() + 30);
        block.setP(block.getP() + 25);
        block.setK(block.getK() + 20);
        
        // Hạ pH (hóa học gây chua đất dần)
        double currentPh = block.getPh();
        block.setPh(currentPh - 0.2);
        System.out.println("  ⚠️ pH giảm: " + currentPh + " → " + block.getPh() + " (đất bị chua dần)");
        
        // Tăng nguy cơ sâu bệnh (phân hóa học dụ sâu rầy)
        block.setPest(Math.min(100, block.getPest() + 8));
        System.out.println("  ⚠️ Sâu bệnh tăng: " + block.getPest() + "% (phân đạm thu hút rầy nâu)");
        
        System.out.println("  → NPK: " + block.getN() + "/" + block.getP() + "/" + block.getK());
        System.out.println("  → 💡 Hiệu quả nhanh nhưng lạm dụng sẽ chai đất, diệt giun đất");
        
        block.evaluateStatus();
    }
    
    @Override
    public String getName() { return "Phân hóa học NPK 16-16-8"; }
    
    @Override
    public String getEmoji() { return "🧪"; }
}
