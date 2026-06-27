package agtech.dao;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseConnection {
    // Đường dẫn tới file agtech.db (Nằm ở thư mục database của dự án)
    private static final String DB_URL = "jdbc:sqlite:../../database/agtech.db";

    public static Connection getConnection() {
        Connection conn = null;
        try {
            // Load driver SQLite
            Class.forName("org.sqlite.JDBC");
            // Mở kết nối
            conn = DriverManager.getConnection(DB_URL);
            System.out.println("[JDBC] Đã kết nối thành công tới Cơ sở dữ liệu SQLite!");
        } catch (SQLException e) {
            System.out.println("[JDBC Error] Lỗi kết nối CSDL: " + e.getMessage());
        } catch (ClassNotFoundException e) {
            System.out.println("[JDBC Error] Không tìm thấy Driver SQLite: " + e.getMessage());
        }
        return conn;
    }
}
