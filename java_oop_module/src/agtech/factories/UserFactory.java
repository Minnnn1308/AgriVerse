package agtech.factories;

import agtech.models.User;
import agtech.models.Farmer;
import agtech.models.JuniorAssistant;
import agtech.models.Role;

public class UserFactory {
    public static User createUser(Role role, String userId, String fullName, String extraInfo) {
        switch (role) {
            case FARMER:
                // extraInfo acts as cooperativeId for Farmer
                return new Farmer(userId, fullName, extraInfo);
            case JUNIOR_ASSISTANT:
                // extraInfo can be parentId or something else, unused here for simplicity
                return new JuniorAssistant(userId, fullName);
            default:
                throw new IllegalArgumentException("Unknown role: " + role);
        }
    }
}
