import java.util.ArrayList;
import java.util.List;

// ============================================================================
// HỆ THỐNG QUẢN LÝ LIÊN MINH NÔNG HỘ ỨNG DỤNG GAME HÓA - MODULE JAVA OOP
// (Lõi Domain Model ứng dụng các nguyên lý OOP)
// ============================================================================

// 1. TÍNH TRỪU TƯỢNG (Abstraction) & INTERFACE
interface IGameMechanics {
    void addPoints(int points);
    void checkLevelUp();
}

abstract class User {
    // 2. TÍNH ĐÓNG GÓI (Encapsulation): Bảo vệ dữ liệu bằng access modifier (protected/private)
    protected String userId;
    protected String fullName;
    
    public User(String userId, String fullName) {
        this.userId = userId;
        this.fullName = fullName;
    }
    
    // Phương thức trừu tượng yêu cầu các lớp con phải tự định nghĩa
    public abstract void loginDashboard();
    
    public String getName() {
        return fullName;
    }
}

// 3. TÍNH KẾ THỪA (Inheritance)
class Farmer extends User {
    private String cooperativeId; // Mã HTX (Ví dụ: HTX Cà phê Trung Nguyên)
    
    public Farmer(String userId, String fullName, String cooperativeId) {
        super(userId, fullName);
        this.cooperativeId = cooperativeId;
    }
    
    // 4. TÍNH ĐA HÌNH (Polymorphism): Ghi đè phương thức của lớp cha
    @Override
    public void loginDashboard() {
        System.out.println("[PRO MODE - Giao diện chuyên nghiệp]");
        System.out.println("Xin chào Nông dân " + fullName + " (Thuộc: " + cooperativeId + ").");
        System.out.println("Đang hiển thị biểu đồ độ ẩm đất, lịch trình bón phân và dự báo sản lượng...\n");
    }
}

// Kế thừa và triển khai Interface cho tài khoản Trợ lý số (Trẻ em)
class JuniorAssistant extends User implements IGameMechanics {
    private int currentLevel;
    private int totalPoints;
    
    public JuniorAssistant(String userId, String fullName) {
        super(userId, fullName);
        this.currentLevel = 1; // Mặc định Level 1
        this.totalPoints = 0;
    }
    
    @Override
    public void loginDashboard() {
        System.out.println("[GAME MODE - Giao diện Trò chơi 2D/3D]");
        System.out.println("Chào mừng Nông dân nhí " + fullName + "!");
        System.out.println("Level hiện tại: " + currentLevel + " | Điểm tích lũy: " + totalPoints + " pts.");
        System.out.println("Nông trại hoạt hình đang tải...\n");
    }

    @Override
    public void addPoints(int points) {
        this.totalPoints += points;
        System.out.println("🌟 " + fullName + " vừa nhận được " + points + " điểm EXP!");
        checkLevelUp();
    }

    @Override
    public void checkLevelUp() {
        if (this.totalPoints >= 100) {
            this.currentLevel++;
            this.totalPoints -= 100;
            System.out.println("🎉 CHÚC MỪNG! " + fullName + " đã thăng cấp lên LEVEL " + this.currentLevel + "!");
            System.out.println("🎁 Phần thưởng mở khóa: 1 Lốc sữa bò tươi nguyên chất!\n");
        }
    }
}

// Lớp quản lý Nhiệm vụ (Quest System)
class Quest {
    private String questId;
    private String description;
    private int rewardPoints;
    private boolean isCompleted;
    
    public Quest(String questId, String description, int rewardPoints) {
        this.questId = questId;
        this.description = description;
        this.rewardPoints = rewardPoints;
        this.isCompleted = false;
    }
    
    public String getQuestID() {
        return questId;
    }
    
    public void complete(JuniorAssistant kid) {
        if (!isCompleted) {
            System.out.println("✅ Hoàn thành nhiệm vụ: [" + description + "]");
            kid.addPoints(rewardPoints);
            this.isCompleted = true;
        } else {
            System.out.println("⚠️ Nhiệm vụ này đã hoàn thành rồi!");
        }
    }
}

public class GamifiedFarmApp {

    // ============================================================================
    // PHẦN DÀNH CHO BÀI TẬP LỚN OOP (CHUYỂN THÀNH 1 APP HOÀN CHỈNH)
    // Hướng dẫn: Để nộp bài tập lớn, bạn chỉ cần XÓA DẤU COMMENT "/*" và "*/"
    // bao quanh phương thức main() ở bên dưới để biến file này thành 1 App chạy được.
    // Các lớp trên đóng vai trò là "Core Domain" phục vụ dự án lớn, 
    // còn main() là "EntryPoint" để test code OOP cho môn học.
    // ============================================================================
    
    public static void main(String[] args) {
        System.out.println("=====================================================");
        System.out.println("HỆ THỐNG AGTECH-PLATFORM: GAME HÓA NÔNG NGHIỆP");
        System.out.println("=====================================================\n");
        
        // 1. Khởi tạo dữ liệu người dùng (Demo Đa hình)
        List<User> users = new ArrayList<>();
        users.add(new Farmer("F-991", "Bác Nguyễn Văn Hải", "HTX_Nestle_ĐắkLắk"));
        users.add(new JuniorAssistant("J-007", "Bé Cà Rốt (Con bác Hải)"));
        
        // Duyệt qua danh sách user và gọi loginDashboard()
        // (Tính ĐA HÌNH thể hiện rõ nhất ở đây: cùng 1 hàm nhưng in ra giao diện khác nhau)
        for (User u : users) {
            u.loginDashboard();
        }
        
        System.out.println("--- TIẾN TRÌNH LÀM NHIỆM VỤ NÔNG TRẠI (GAMIFICATION) ---");
        
        // Lấy tài khoản của Bé Cà Rốt ra để làm nhiệm vụ
        JuniorAssistant kid = (JuniorAssistant) users.get(1);
        
        // Khởi tạo các nhiệm vụ (Real-time data update)
        Quest q1 = new Quest("Q-01", "Cầm smartphone chụp 3 lá cà phê bị vàng", 40);
        Quest q2 = new Quest("Q-02", "Mở van hệ thống tưới nhỏ giọt 15 phút", 70);
        
        // Thực hiện nhiệm vụ
        q1.complete(kid);
        q2.complete(kid); // Sẽ đạt 110 điểm => Kích hoạt hàm Level Up!
        
        // Thử hoàn thành lại nhiệm vụ đã xong
        q1.complete(kid); 
        
        System.out.println("=====================================================");
        System.out.println("DỮ LIỆU ĐÃ ĐƯỢC ĐỒNG BỘ THÀNH CÔNG VỀ HTX TRUNG TÂM!");
    } 
}
