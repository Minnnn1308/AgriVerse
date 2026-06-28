import agtech.models.*;
import agtech.models.task.*;
import agtech.events.*;
import agtech.services.*;
import java.util.ArrayList;
import java.util.List;

// ============================================================================
// HỆ THỐNG QUẢN LÝ LIÊN MINH NÔNG HỘ ỨNG DỤNG GAME HÓA - MODULE JAVA OOP
// (Lõi Domain Model ứng dụng các nguyên lý OOP & Design Patterns)
// ============================================================================

public class GamifiedFarmApp {
    public static void main(String[] args) {
        System.out.println("=====================================================");
        System.out.println("🔥 AGTECH-PLATFORM v0.0.9.0: DIGITAL TWIN & FAMILY FARMING");
        System.out.println("=====================================================\n");
        
        GameLogger logger = GameLogger.getInstance();
        EventManager eventManager = EventManager.getInstance();

        // 1. Khởi tạo dữ liệu người dùng
        List<User> users = new ArrayList<>();
        Farmer parent = new Farmer("F-991", "Bác Nguyễn Văn Hải", "HTX_Nestle_ĐắkLắk");
        JuniorAssistant kid = new JuniorAssistant("J-007", "Bé Cà Rốt");
        users.add(parent);
        users.add(kid);

        // Đăng ký sự kiện Observer (Khi Task xong, thưởng điểm cho Kid)
        eventManager.subscribe(task -> {
            System.out.println("🎉 [Sự kiện UI Game] Nhận thông báo: Nhiệm vụ '" + task.getName() + "' đã hoàn thành!");
            System.out.println("🌟 Bé Cà Rốt nhận được +15 điểm Eco Karma!");
        });
        
        System.out.println("--- [1] LUỒNG NHIỆM VỤ BẤT ĐỒNG BỘ (STATE PATTERN) ---");
        Task waterTask = new Task("T-001", "Tưới 200ml nước Khu A");
        System.out.println("=> Hệ thống gợi ý: " + waterTask.getStateName());
        
        // Trẻ em ấn gửi cho phụ huynh
        waterTask.advanceState(); 
        
        // Phụ huynh làm xong ngoài đời, ấn hoàn thành
        System.out.println("(Phụ huynh tưới xong, bấm nút Hoàn thành...)");
        waterTask.advanceState();
        eventManager.notifyTaskCompleted(waterTask); // Kích hoạt sự kiện Observer

        System.out.println("\n--- [2] SỔ ĐO LƯỜNG & LAN TRUYỀN DỮ LIỆU (SPREAD SIMULATION) ---");
        // Cuối ngày, Sổ chờ nhập gọi phụ huynh điền số liệu.
        waterTask.advanceState(); // Chuyển sang Completed toàn bộ sau khi nhập liệu

        FarmGrid grid = new FarmGrid(3, 3);
        System.out.println("Bản đồ đất trước khi nhập liệu:");
        grid.printGridStatus();

        // Nông dân cắm cảm biến ở góc ruộng (0, 0) đo được độ ẩm 85%
        System.out.println("\n(Nông dân nhập: Độ ẩm ở tọa độ [0,0] là 85%)");
        grid.applyMacroMeasurement(0, 0, 85.0);
        grid.printGridStatus();

        System.out.println("\n--- [3] LỊCH SỬ HỆ THỐNG ---");
        for (String log : logger.getAllLogs()) {
            System.out.println(log);
        }
    } 
}
