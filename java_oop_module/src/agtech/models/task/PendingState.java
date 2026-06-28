package agtech.models.task;

public class PendingState implements TaskState {
    @Override
    public void handleState(Task context) {
        // Sau khi hoàn thành hành động thực tế, chuyển sang chờ nhập số liệu
        context.setState(new PendingDataEntryState());
    }

    @Override
    public String getStateName() {
        return "PENDING";
    }
}
