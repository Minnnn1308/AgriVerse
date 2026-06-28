package agtech.services;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * SINGLETON PATTERN — GameLogger.
 * Logger toàn cục ghi lại mọi hành động trong hệ thống game hóa.
 * Thread-safe lazy initialization (Bill Pugh Singleton).
 */
public class GameLogger {
    private final List<String> logs;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("HH:mm:ss dd/MM");

    // Private constructor — không cho tạo instance từ bên ngoài
    private GameLogger() {
        logs = new ArrayList<>();
        log("SYSTEM", "GameLogger khởi tạo thành công");
    }

    // Bill Pugh Singleton — Thread-safe, Lazy Loading
    private static class Holder {
        private static final GameLogger INSTANCE = new GameLogger();
    }

    /**
     * Lấy instance duy nhất của GameLogger.
     */
    public static GameLogger getInstance() {
        return Holder.INSTANCE;
    }

    /**
     * Ghi log hành động.
     */
    public void log(String category, String message) {
        String timestamp = LocalDateTime.now().format(FMT);
        String entry = "[" + timestamp + "] [" + category + "] " + message;
        logs.add(entry);
        System.out.println("📋 " + entry);
    }

    /**
     * Ghi log hành động của người chơi.
     */
    public void logAction(String playerName, String action) {
        log("ACTION", playerName + " → " + action);
    }

    /**
     * Ghi log nhiệm vụ hoàn thành.
     */
    public void logQuestComplete(String playerName, String questTitle, int points) {
        log("QUEST", playerName + " hoàn thành [" + questTitle + "] +" + points + " EXP");
    }

    /**
     * Ghi log mua sắm.
     */
    public void logPurchase(String playerName, String itemName, int cost) {
        log("SHOP", playerName + " mua [" + itemName + "] -" + cost + " xu");
    }

    /**
     * Lấy toàn bộ lịch sử log.
     */
    public List<String> getAllLogs() {
        return new ArrayList<>(logs);
    }

    /**
     * Lấy N dòng log gần nhất.
     */
    public List<String> getRecentLogs(int n) {
        int start = Math.max(0, logs.size() - n);
        return new ArrayList<>(logs.subList(start, logs.size()));
    }

    /**
     * Đếm tổng số log.
     */
    public int getLogCount() {
        return logs.size();
    }
}
