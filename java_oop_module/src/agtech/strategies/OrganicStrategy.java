package agtech.strategies;

import agtech.models.FarmBlock;

/**
 * OrganicStrategy — Chiến lược bón phân hữu cơ.
 * Tăng NPK từ từ nhưng cải thiện pH và giảm sâu bệnh bền vững.
 * Phù hợp canh tác VietGAP, nông nghiệp sạch.
 */
public class OrganicStrategy implements FertilizerStrategy {
    
    @Override
    public void applyFertilizer(FarmBlock block) {
        System.out.println("🍂 Bón phân HỮU CƠ cho ô [" + block.getBlockId() + "]");
        
        // Tăng NPK chậm nhưng bền
        block.setN(block.getN() + 12);
        block.setP(block.getP() + 8);
        block.setK(block.getK() + 10);
        
        // Cải thiện pH (hữu cơ ổn định pH)
        double currentPh = block.getPh();
        if (currentPh < 5.5) {
            block.setPh(currentPh + 0.3);
            System.out.println("  → pH tăng nhẹ: " + currentPh + " → " + block.getPh() + " (bớt chua)");
        }
        
        // Giảm sâu bệnh nhẹ (hữu cơ cải thiện hệ sinh thái đất)
        block.setPest(Math.max(0, block.getPest() - 5));
        
        System.out.println("  → NPK: " + block.getN() + "/" + block.getP() + "/" + block.getK());
        System.out.println("  → 💡 Phân hữu cơ tác dụng chậm nhưng bền vững, tốt cho đất lâu dài");
        
        block.evaluateStatus();
    }
    
    @Override
    public String getName() { return "Phân hữu cơ sinh học"; }
    
    @Override
    public String getEmoji() { return "🍂"; }
}
