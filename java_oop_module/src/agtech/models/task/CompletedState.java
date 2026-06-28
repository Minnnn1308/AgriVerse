package agtech.models.task;

public class CompletedState implements TaskState {
    @Override
    public void handleState(Task context) {
        System.out.println("Nhiệm vụ [" + context.getTaskId() + "] đã hoàn thành toàn bộ.");
    }

    @Override
    public String getStateName() {
        return "COMPLETED";
    }
}
