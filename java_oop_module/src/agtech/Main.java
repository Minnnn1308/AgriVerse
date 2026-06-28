package agtech;

import agtech.models.*;
import agtech.services.*;
import agtech.strategies.*;
import agtech.commands.*;
import agtech.dao.UserDAO;

import java.util.List;

public class Main {
    public static void main(String[] args) {
        System.out.println("=====================================================");
        System.out.println("🔥 AGTECH-PLATFORM v0.0.7.0: ĐẠI CÁCH MẠNG NÔNG NGHIỆP");
        System.out.println(" Kiến trúc OOP Nâng Cao (Strategy, Command, Singleton)");
        System.out.println("=====================================================\n");
        
        GameLogger logger = GameLogger.getInstance();
        logger.log("SYSTEM", "Khởi động hệ thống v0.0.7.0");

        // 1. DAO & Tính Đa hình
        UserDAO userDAO = new UserDAO();
        List<User> users = userDAO.getAllUsers();
        
        if (users.isEmpty()) {
            System.out.println("Không tìm thấy user nào trong DB!");
            return;
        }

        System.out.println("\n--- [1] TÍNH ĐA HÌNH: ĐĂNG NHẬP ---");
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
        gieoHat.incrementProgress(); // Sẽ mở khóa
        int reward = gieoHat.claim();
        if (reward > 0) kid.addPoints(reward);

        System.out.println("\n--- [3] STRATEGY & COMMAND PATTERN: CHĂM SÓC ĐẤT ---");
        FarmBlock blockA1 = new FarmBlock("A1-CàPhê");
        System.out.println("Trạng thái ban đầu: " + blockA1);

        // Tưới nước bằng Command
        ActionCommand waterCmd = new WaterCommand(blockA1);
        waterCmd.execute();
        
        // Nông dân lỡ tay tưới nhầm -> Hoàn tác!
        waterCmd.undo();

        // Bón phân hóa học
        ActionCommand chemCmd = new FertilizeCommand(blockA1, new ChemicalStrategy());
        chemCmd.execute();
        
        // Thấy đất bị chua, quyết định hoàn tác hóa học
        chemCmd.undo();

        // Đổi sang bón phân hữu cơ (VietGAP)
        ActionCommand orgCmd = new FertilizeCommand(blockA1, new OrganicStrategy());
        orgCmd.execute();

        System.out.println("\n--- [4] LỊCH SỬ HỆ THỐNG (SINGLETON) ---");
        List<String> logs = logger.getAllLogs();
        for (String log : logs) {
            System.out.println(log);
        }

        System.out.println("\n=====================================================");
        System.out.println("✅ HOÀN THÀNH DEMO KIẾN TRÚC OOP MỚI!");
    }
}
