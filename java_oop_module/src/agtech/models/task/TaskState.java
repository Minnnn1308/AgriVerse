package agtech.models.task;

public interface TaskState {
    void handleState(Task context);
    String getStateName();
}
