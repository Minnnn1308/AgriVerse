package agtech.commands;

/**
 * COMMAND PATTERN — Interface cho mọi hành động chăm sóc ruộng.
 * Cho phép thực hiện (execute) và hoàn tác (undo) hành động.
 * Hữu ích khi nông dân bấm nhầm — có thể "quay lại" thao tác.
 */
public interface ActionCommand {
    void execute();
    void undo();
    String getDescription();
}
