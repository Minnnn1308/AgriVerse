package agtech;

import agtech.models.User;
import agtech.models.JuniorAssistant;
import agtech.models.Quest;
import agtech.services.QuestSubject;
import agtech.services.NotificationObserver;
import agtech.dao.UserDAO;

import java.util.List;

public class Main {
    public static void main(String[] args) {
        System.out.println("=====================================================");
        System.out.println("HỆ THỐNG AGTECH-PLATFORM: GAME HÓA NÔNG NGHIỆP");
        System.out.println("Kiến trúc OOP nâng cao (Design Patterns Applied)");
        System.out.println("=====================================================\n");
        
        // 1. Khởi tạo dữ liệu người dùng (Áp dụng DAO Pattern lấy từ CSDL SQLite)
        UserDAO userDAO = new UserDAO();
        List<User> users = userDAO.getAllUsers();
        
        if (users.isEmpty()) {
            System.out.println("Không tìm thấy user nào trong DB!");
            return;
        }
        
        // Duyệt qua danh sách user và gọi loginDashboard() (Tính Đa Hình)
        for (User u : users) {
            u.loginDashboard();
        }
        
        System.out.println("--- TIẾN TRÌNH LÀM NHIỆM VỤ NÔNG TRẠI (GAMIFICATION) ---");
        
        // Lấy tài khoản của Bé Cà Rốt ra để làm nhiệm vụ
        JuniorAssistant kid = (JuniorAssistant) users.get(1);
        
        // Khởi tạo hệ thống quản lý Quest (Áp dụng Observer Pattern)
        QuestSubject questManager = new QuestSubject();
        
        // Đăng ký các Observer lắng nghe sự kiện hoàn thành nhiệm vụ
        NotificationObserver htxObserver = new NotificationObserver("HTX_Nestle_ĐắkLắk (Hệ thống giám sát)");
        NotificationObserver parentObserver = new NotificationObserver("Phụ huynh Nguyễn Văn Hải (App mobile)");
        
        questManager.addObserver(htxObserver);
        questManager.addObserver(parentObserver);

        // Khởi tạo các nhiệm vụ (Real-time data update)
        Quest q1 = new Quest("Q-01", "Bác sĩ cây trồng", "Cầm smartphone chụp 3 lá cà phê bị vàng", 40);
        Quest q2 = new Quest("Q-02", "Siêu nhân tưới tiêu", "Mở van hệ thống tưới nhỏ giọt 15 phút", 70);
        
        // Thực hiện nhiệm vụ thông qua JuniorAssistant (sử dụng QuestSubject)
        kid.completeQuest(q1, questManager);
        System.out.println();
        kid.completeQuest(q2, questManager); // Sẽ đạt 110 điểm => Kích hoạt hàm Level Up!
        System.out.println();
        
        // Thử hoàn thành lại nhiệm vụ đã xong
        kid.completeQuest(q1, questManager); 
        
        System.out.println("=====================================================");
        System.out.println("DỮ LIỆU ĐÃ ĐƯỢC ĐỒNG BỘ THÀNH CÔNG VỀ HTX TRUNG TÂM!");
    }
}
