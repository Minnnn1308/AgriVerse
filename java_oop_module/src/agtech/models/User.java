package agtech.models;

public abstract class User {
    protected String userId;
    protected String fullName;
    protected Role role;
    
    public User(String userId, String fullName, Role role) {
        this.userId = userId;
        this.fullName = fullName;
        this.role = role;
    }
    
    // Abstract method that must be implemented by subclasses
    public abstract void loginDashboard();
    
    public String getUserId() {
        return userId;
    }
    
    public String getFullName() {
        return fullName;
    }
    
    public Role getRole() {
        return role;
    }
}
