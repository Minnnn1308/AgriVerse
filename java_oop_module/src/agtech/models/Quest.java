package agtech.models;

public class Quest {
    private String questId;
    private String title;
    private String description;
    private int rewardPoints;
    private boolean isCompleted;
    
    public Quest(String questId, String title, String description, int rewardPoints) {
        this.questId = questId;
        this.title = title;
        this.description = description;
        this.rewardPoints = rewardPoints;
        this.isCompleted = false;
    }
    
    public String getQuestId() {
        return questId;
    }
    
    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }
    
    public int getRewardPoints() {
        return rewardPoints;
    }
    
    public boolean isCompleted() {
        return isCompleted;
    }
    
    public void setCompleted(boolean completed) {
        this.isCompleted = completed;
    }
}
