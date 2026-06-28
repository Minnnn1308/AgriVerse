package agtech.models.task;

public class SuggestedState implements TaskState {
    @Override
    public void handleState(Task context) {
        // Chuyển sang Pending khi phụ huynh nhận nhiệm vụ
        context.setState(new PendingState());
    }

    @Override
    public String getStateName() {
        return "SUGGESTED";
    }
}
