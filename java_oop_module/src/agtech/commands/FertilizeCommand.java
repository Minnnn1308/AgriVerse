package agtech.commands;

import agtech.models.FarmBlock;
import agtech.strategies.FertilizerStrategy;
import agtech.services.GameLogger;

/**
 * FertilizeCommand — Lệnh bón phân cho ô đất.
 * Kết hợp Command Pattern + Strategy Pattern:
 * - Command xử lý execute/undo
 * - Strategy xác định loại phân bón được áp dụng
 */
public class FertilizeCommand implements ActionCommand {
    private FarmBlock block;
    private FertilizerStrategy strategy;
    
    // Snapshot trước khi bón — dùng cho undo
    private double prevN, prevP, prevK, prevPh, prevPest;
    private String prevStatus;

    public FertilizeCommand(FarmBlock block, FertilizerStrategy strategy) {
        this.block = block;
        this.strategy = strategy;
    }

    @Override
    public void execute() {
        // Lưu snapshot
        prevN = block.getN();
        prevP = block.getP();
        prevK = block.getK();
        prevPh = block.getPh();
        prevPest = block.getPest();
        prevStatus = block.getStatus();
        
        // Áp dụng strategy
        block.setFertilizerStrategy(strategy);
        block.applyFertilizer();
        
        GameLogger.getInstance().logAction("Hệ thống", 
            "Bón " + strategy.getName() + " ô " + block.getBlockId());
    }

    @Override
    public void undo() {
        // Khôi phục từ snapshot
        block.setN(prevN);
        block.setP(prevP);
        block.setK(prevK);
        block.setPh(prevPh);
        block.setPest(prevPest);
        block.setStatus(prevStatus);
        
        System.out.println("↩️ Hoàn tác bón phân ô [" + block.getBlockId() + "]: khôi phục NPK + pH");
        
        GameLogger.getInstance().logAction("Hệ thống", 
            "Hoàn tác bón phân ô " + block.getBlockId());
    }

    @Override
    public String getDescription() {
        return strategy.getEmoji() + " Bón " + strategy.getName() + " ô " + block.getBlockId();
    }
}
