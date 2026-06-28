package agtech.events;

import agtech.models.task.Task;
import java.util.ArrayList;
import java.util.List;

public class EventManager {
    private List<TaskObserver> listeners = new ArrayList<>();
    private static EventManager instance;

    private EventManager() {}

    public static EventManager getInstance() {
        if (instance == null) {
            instance = new EventManager();
        }
        return instance;
    }

    public void subscribe(TaskObserver listener) {
        listeners.add(listener);
    }

    public void unsubscribe(TaskObserver listener) {
        listeners.remove(listener);
    }

    public void notifyTaskCompleted(Task task) {
        for (TaskObserver listener : listeners) {
            listener.onTaskCompleted(task);
        }
    }
}
