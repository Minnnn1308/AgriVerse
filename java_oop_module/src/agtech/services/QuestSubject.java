package agtech.services;

import agtech.models.Quest;
import agtech.models.JuniorAssistant;
import java.util.ArrayList;
import java.util.List;

public class QuestSubject {
    private List<Observer> observers = new ArrayList<>();

    public void addObserver(Observer observer) {
        observers.add(observer);
    }

    public void removeObserver(Observer observer) {
        observers.remove(observer);
    }

    public void completeQuest(Quest quest, JuniorAssistant assistant) {
        if (!quest.isCompleted()) {
            quest.setCompleted(true);
            System.out.println("✅ " + assistant.getFullName() + " đã hoàn thành nhiệm vụ: [" + quest.getTitle() + "]");
            assistant.addPoints(quest.getRewardPoints());
            notifyObservers(quest, assistant);
        } else {
            System.out.println("⚠️ Nhiệm vụ này đã hoàn thành rồi!");
        }
    }

    private void notifyObservers(Quest quest, JuniorAssistant assistant) {
        for (Observer observer : observers) {
            observer.onQuestCompleted(quest, assistant);
        }
    }
}
