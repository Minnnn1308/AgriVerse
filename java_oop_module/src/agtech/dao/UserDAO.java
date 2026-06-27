package agtech.dao;

import agtech.factories.UserFactory;
import agtech.models.Role;
import agtech.models.User;
import agtech.models.JuniorAssistant;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class UserDAO {

    public List<User> getAllUsers() {
        List<User> users = new ArrayList<>();
        String sql = "SELECT * FROM users";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql);
             ResultSet rs = pstmt.executeQuery()) {

            while (rs.next()) {
                String id = rs.getString("user_id");
                String fullName = rs.getString("full_name");
                String roleStr = rs.getString("role");
                
                Role role = Role.valueOf(roleStr);
                
                if (role == Role.FARMER) {
                    String coopId = rs.getString("coop_id");
                    users.add(UserFactory.createUser(role, id, fullName, coopId));
                } else if (role == Role.JUNIOR_ASSISTANT) {
                    String parentId = rs.getString("parent_id");
                    JuniorAssistant kid = (JuniorAssistant) UserFactory.createUser(role, id, fullName, parentId);
                    
                    // Lấy thêm điểm số từ DB nếu có
                    int totalPoints = rs.getInt("total_points");
                    if (totalPoints > 0) {
                        kid.addPoints(totalPoints); // Restore points from DB
                    }
                    users.add(kid);
                }
            }
        } catch (SQLException e) {
            System.out.println("[UserDAO Error] Lỗi khi truy vấn danh sách người dùng: " + e.getMessage());
        }
        return users;
    }
}
