package agtech.models.task;

public class PendingDataEntryState implements TaskState {
    @Override
    public void handleState(Task context) {
        // Sau khi điền số liệu xong, chuyển sang Completed
        context.setState(new CompletedState());
    }

    @Override
    public String getStateName() {
        return "PENDING_DATA_ENTRY";
    }
}
