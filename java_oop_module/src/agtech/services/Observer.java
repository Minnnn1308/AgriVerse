package agtech.services;

import agtech.models.Quest;
import agtech.models.JuniorAssistant;

public interface Observer {
    void onQuestCompleted(Quest quest, JuniorAssistant assistant);
}
