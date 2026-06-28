package agtech.commands;

import agtech.models.FarmBlock;
import agtech.services.GameLogger;

/**
 * WaterCommand — Lệnh tưới nước cho ô đất.
 * Lưu lại trạng thái cũ để hỗ trợ undo (hoàn tác).
 */
public class WaterCommand implements ActionCommand {
    private FarmBlock block;
    private double previousMoisture;

    public WaterCommand(FarmBlock block) {
        this.block = block;
    }

    @Override
    public void execute() {
        previousMoisture = block.getSoilMoisture();
        block.setSoilMoisture(Math.min(100, previousMoisture + 25));
        block.evaluateStatus();
        
        System.out.println("💦 Tưới nước ô [" + block.getBlockId() + "]: " 
            + previousMoisture + "% → " + block.getSoilMoisture() + "%");
        
        GameLogger.getInstance().logAction("Hệ thống", "Tưới nước ô " + block.getBlockId());
    }

    @Override
    public void undo() {
        block.setSoilMoisture(previousMoisture);
        block.evaluateStatus();
        
        System.out.println("↩️ Hoàn tác tưới nước ô [" + block.getBlockId() + "]: khôi phục " + previousMoisture + "%");
        
        GameLogger.getInstance().logAction("Hệ thống", "Hoàn tác tưới ô " + block.getBlockId());
    }

    @Override
    public String getDescription() {
        return "💦 Tưới nước ô " + block.getBlockId();
    }
}
