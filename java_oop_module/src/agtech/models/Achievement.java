package agtech.models;

/**
 * Achievement — Hệ thống thành tựu khuyến khích nông dân nhí.
 * Mỗi thành tựu có mục tiêu cụ thể (target), tiến trình (progress) và trạng thái nhận thưởng.
 */
public class Achievement {
    private String achievementId;
    private String name;
    private String description;
    private String emoji;
    private int targetCount;
    private int currentProgress;
    private boolean isClaimed;

    public Achievement(String achievementId, String name, String description, String emoji, int targetCount) {
        this.achievementId = achievementId;
        this.name = name;
        this.description = description;
        this.emoji = emoji;
        this.targetCount = targetCount;
        this.currentProgress = 0;
        this.isClaimed = false;
    }

    public String getAchievementId() { return achievementId; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getEmoji() { return emoji; }
    public int getTargetCount() { return targetCount; }
    public int getCurrentProgress() { return currentProgress; }
    public boolean isClaimed() { return isClaimed; }

    /**
     * Tăng tiến trình thành tựu lên 1 bước.
     * @return true nếu vừa đạt mục tiêu (lần đầu)
     */
    public boolean incrementProgress() {
        if (currentProgress < targetCount) {
            currentProgress++;
            if (currentProgress >= targetCount) {
                System.out.println("🏆 MỞ KHÓA THÀNH TỰU: [" + emoji + " " + name + "]!");
                return true;
            }
        }
        return false;
    }

    /**
     * Nhận thưởng thành tựu (chỉ nhận được 1 lần).
     * @return điểm thưởng nếu nhận thành công, 0 nếu đã nhận rồi
     */
    public int claim() {
        if (currentProgress >= targetCount && !isClaimed) {
            isClaimed = true;
            int reward = targetCount * 10; // 10 EXP mỗi bước
            System.out.println("🎁 Nhận thưởng thành tựu [" + name + "]: +" + reward + " EXP!");
            return reward;
        }
        return 0;
    }

    public int getProgressPercent() {
        return Math.min(100, (currentProgress * 100) / targetCount);
    }

    @Override
    public String toString() {
        return emoji + " " + name + " (" + currentProgress + "/" + targetCount + ")" 
            + (isClaimed ? " ✅" : currentProgress >= targetCount ? " 🎁 Chờ nhận" : "");
    }
}
