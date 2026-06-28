package agtech.models.task;

public class Task {
    private String taskId;
    private String name;
    private TaskState state;

    public Task(String taskId, String name) {
        this.taskId = taskId;
        this.name = name;
        this.state = new SuggestedState(); // Trạng thái mặc định
    }

    public void setState(TaskState state) {
        this.state = state;
        System.out.println("Nhiệm vụ [" + taskId + "] chuyển sang trạng thái: " + state.getStateName());
    }

    public void advanceState() {
        if (state != null) {
            state.handleState(this);
        }
    }

    public String getTaskId() { return taskId; }
    public String getName() { return name; }
    public String getStateName() { return state != null ? state.getStateName() : "UNKNOWN"; }
}
