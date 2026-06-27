package agtech.models;

import agtech.services.QuestSubject;

public class JuniorAssistant extends User {
    private int currentLevel;
    private int totalPoints;
    
    public JuniorAssistant(String userId, String fullName) {
        super(userId, fullName, Role.JUNIOR_ASSISTANT);
        this.currentLevel = 1;
        this.totalPoints = 0;
    }
    
    @Override
    public void loginDashboard() {
        System.out.println("[GAME MODE - Giao diện Trò chơi 2D/3D]");
        System.out.println("Chào mừng Nông dân nhí " + fullName + "!");
        System.out.println("Level hiện tại: " + currentLevel + " | Điểm tích lũy: " + totalPoints + " pts.");
        System.out.println("Nông trại hoạt hình đang tải...\n");
    }

    public void addPoints(int points) {
        this.totalPoints += points;
        System.out.println("🌟 " + fullName + " vừa nhận được " + points + " điểm EXP!");
        checkLevelUp();
    }

    private void checkLevelUp() {
        if (this.totalPoints >= 100) {
            this.currentLevel++;
            this.totalPoints -= 100;
            System.out.println("🎉 CHÚC MỪNG! " + fullName + " đã thăng cấp lên LEVEL " + this.currentLevel + "!");
            System.out.println("🎁 Phần thưởng mở khóa: 1 Lốc sữa bò tươi nguyên chất!\n");
        }
    }
    
    // Completing quest using Observer pattern
    public void completeQuest(Quest quest, QuestSubject questManager) {
        questManager.completeQuest(quest, this);
    }
}
