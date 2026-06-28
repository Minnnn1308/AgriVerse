package agtech.events;

import agtech.models.task.Task;

public interface TaskObserver {
    void onTaskCompleted(Task task);
}
