package agtech.services;

import agtech.models.Quest;
import agtech.models.JuniorAssistant;

public class NotificationObserver implements Observer {
    private String observerName;

    public NotificationObserver(String observerName) {
        this.observerName = observerName;
    }

    @Override
    public void onQuestCompleted(Quest quest, JuniorAssistant assistant) {
        System.out.println("🔔 [Thông báo tới " + observerName + "]: Tài khoản " + assistant.getFullName() 
            + " vừa hoàn thành nhiệm vụ và nhận " + quest.getRewardPoints() + " điểm.");
        // In real app, this would send an FCM Push Notification or Email
    }
}
