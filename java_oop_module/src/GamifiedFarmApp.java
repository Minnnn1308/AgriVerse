import agtech.models.*;
import agtech.services.*;
import agtech.strategies.*;
import agtech.commands.*;
import java.util.ArrayList;
import java.util.List;

// ============================================================================
// HỆ THỐNG QUẢN LÝ LIÊN MINH NÔNG HỘ ỨNG DỤNG GAME HÓA - MODULE JAVA OOP
// (Lõi Domain Model ứng dụng các nguyên lý OOP & Design Patterns)
// ============================================================================

public class GamifiedFarmApp {

    // ============================================================================
    // PHẦN DÀNH CHO BÀI TẬP LỚN OOP
    // ============================================================================
    
    public static void main(String[] args) {
        System.out.println("=====================================================");
        System.out.println("🔥 AGTECH-PLATFORM v0.0.7.0: ĐẠI CÁCH MẠNG NÔNG NGHIỆP");
        System.out.println("=====================================================\n");
        
        GameLogger logger = GameLogger.getInstance();

        // 1. Khởi tạo dữ liệu người dùng (Demo Đa hình)
        List<User> users = new ArrayList<>();
        users.add(new Farmer("F-991", "Bác Nguyễn Văn Hải", "HTX_Nestle_ĐắkLắk"));
        users.add(new JuniorAssistant("J-007", "Bé Cà Rốt (Con bác Hải)"));
        
        System.out.println("--- [1] TÍNH ĐA HÌNH: ĐĂNG NHẬP ---");
        for (User u : users) {
            u.loginDashboard();
        }
        
        System.out.println("\n--- [2] ECO-PET & ACHIEVEMENTS ---");
        JuniorAssistant kid = (JuniorAssistant) users.get(1);
        EcoPet dragon = new EcoPet("PET_01", "Bé Rồng Đất", "Rồng Đất");
        System.out.println(dragon);
        dragon.feed();
        
        Achievement gieoHat = new Achievement("A01", "Gieo Hạt Chăm Chỉ", "Gieo 3 hạt giống", "🌱", 3);
        System.out.println(gieoHat);
        gieoHat.incrementProgress();
        gieoHat.incrementProgress();
        gieoHat.incrementProgress();
        int reward = gieoHat.claim();
        if (reward > 0) kid.addPoints(reward);

        System.out.println("\n--- [3] STRATEGY & COMMAND PATTERN ---");
        FarmBlock blockA1 = new FarmBlock("A1-CàPhê");
        
        ActionCommand chemCmd = new FertilizeCommand(blockA1, new ChemicalStrategy());
        chemCmd.execute();
        
        System.out.println("\n(Nông dân thấy hóa học hại đất, quyết định hoàn tác...)");
        chemCmd.undo();

        ActionCommand orgCmd = new FertilizeCommand(blockA1, new OrganicStrategy());
        orgCmd.execute();

        System.out.println("\n--- [4] LỊCH SỬ HỆ THỐNG ---");
        for (String log : logger.getAllLogs()) {
            System.out.println(log);
        }
    } 
}
