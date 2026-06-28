package agtech.strategies;

import agtech.models.FarmBlock;

/**
 * STRATEGY PATTERN — Interface chiến lược bón phân.
 * Cho phép thay đổi loại phân bón tại runtime mà không sửa code FarmBlock.
 * Mỗi loại phân có tác động khác nhau tới NPK, pH, sức khỏe đất.
 */
public interface FertilizerStrategy {
    void applyFertilizer(FarmBlock block);
    String getName();
    String getEmoji();
}
