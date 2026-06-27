package agtech.models;

public class Farmer extends User {
    private String cooperativeId;
    
    public Farmer(String userId, String fullName, String cooperativeId) {
        super(userId, fullName, Role.FARMER);
        this.cooperativeId = cooperativeId;
    }
    
    @Override
    public void loginDashboard() {
        System.out.println("[PRO MODE - Giao diện chuyên nghiệp]");
        System.out.println("Xin chào Nông dân " + fullName + " (Thuộc: " + cooperativeId + ").");
        System.out.println("Đang hiển thị biểu đồ độ ẩm đất, lịch trình bón phân và dự báo sản lượng...\n");
    }
    
    public String getCooperativeId() {
        return cooperativeId;
    }
}
